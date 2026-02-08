import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get store
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }
    
    const settlementId = params.id
    
    // Verify this settlement belongs to the store
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements')
      .select('*')
      .eq('id', settlementId)
      .eq('store_id', store.id)
      .single()
    
    if (settlementError || !settlement) {
      return NextResponse.json({ 
        error: 'Settlement not found or access denied', 
        items: [],
        source: 'error'
      }, { status: 404 })
    }
    
    // First, try to get settlement_items
    const { data: items, error: itemsError } = await supabase
      .from('settlement_items')
      .select('*')
      .eq('settlement_id', settlementId)
      .order('order_date', { ascending: false })
    
    // If we have items, return them
    if (items && items.length > 0) {
      return NextResponse.json({
        items: items,
        source: 'settlement_items',
        total_orders_declared: settlement.total_orders,
        actual_items_count: items.length,
        order_ids_count: settlement.order_ids?.length || 0
      })
    }
    
    // If no items in settlement_items table, try to fetch from order_ids array
    if (settlement.order_ids && settlement.order_ids.length > 0) {
      // Fetch orders directly
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('id', settlement.order_ids)
        .order('created_at', { ascending: false })
      
      if (ordersError) {
        return NextResponse.json({ 
          items: [], 
          source: 'error',
          message: 'Failed to fetch order details',
          error: ordersError.message
        })
      }
      
      if (!orders || orders.length === 0) {
        return NextResponse.json({
          items: [],
          source: 'empty',
          message: 'Orders not found',
          order_ids: settlement.order_ids
        })
      }
      
      // Transform orders to settlement items format with CORRECT 25% commission
      const transformedItems = orders.map(order => ({
        id: `temp-${order.id}`,
        settlement_id: settlementId,
        order_id: order.id,
        order_number: order.order_number,
        order_date: order.created_at,
        product_name: order.product?.name || '상품명 없음',
        quantity: order.product?.quantity || 1,
        original_amount: order.payment?.total || 0,
        commission_rate: 25, // FIXED: Changed from 20 to 25
        commission_amount: Math.floor((order.payment?.total || 0) * 0.25), // FIXED: 25% commission
        net_amount: (order.payment?.total || 0) - Math.floor((order.payment?.total || 0) * 0.25), // FIXED: 75% net
        // Additional info
        sender_name: order.sender_name,
        sender_phone: order.sender_phone,
        receiver_name: order.receiver_name,
        receiver_phone: order.receiver_phone,
        delivery_address: order.receiver_address
      }))
      
      // Insert these items into settlement_items table for consistency
      if (transformedItems.length > 0) {
        // Check which items don't exist yet
        const { data: existingItems } = await supabase
          .from('settlement_items')
          .select('order_id')
          .eq('settlement_id', settlementId)
        
        const existingOrderIds = new Set(existingItems?.map(item => item.order_id) || [])
        const itemsToInsert = transformedItems
          .filter(item => !existingOrderIds.has(item.order_id))
          .map(item => ({
            settlement_id: item.settlement_id,
            order_id: item.order_id,
            order_number: item.order_number,
            order_date: item.order_date,
            product_name: item.product_name,
            quantity: item.quantity,
            original_amount: item.original_amount,
            commission_rate: item.commission_rate,
            commission_amount: item.commission_amount,
            net_amount: item.net_amount
          }))
        
        if (itemsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('settlement_items')
            .insert(itemsToInsert)
          
          if (insertError) {
            console.error('Failed to insert settlement items:', insertError)
          }
        }
      }
      
      return NextResponse.json({
        items: transformedItems,
        source: 'orders',
        total_orders_declared: settlement.total_orders,
        actual_items_count: transformedItems.length,
        order_ids_count: settlement.order_ids.length,
        message: 'Generated from order_ids array with 25% commission'
      })
    }
    
    // No order_ids either
    return NextResponse.json({
      items: [],
      source: 'empty',
      total_orders_declared: settlement.total_orders,
      actual_items_count: 0,
      order_ids_count: 0,
      message: 'No order data found for this settlement'
    })
    
  } catch (error: any) {
    console.error('Settlement items error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        items: [],
        source: 'error'
      },
      { status: 500 }
    )
  }
}