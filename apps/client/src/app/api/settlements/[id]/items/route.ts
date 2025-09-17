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
      .select('id, store_id, order_ids')
      .eq('id', settlementId)
      .eq('store_id', store.id)
      .single()
    if (settlementError || !settlement) {
      return NextResponse.json({ error: 'Settlement not found or access denied' }, { status: 404 })
    }
    // Get settlement items
    const { data: items, error: itemsError } = await supabase
      .from('settlement_items')
      .select(`
        *,
        order:orders(
          id,
          order_number,
          created_at,
          product,
          payment,
          status,
          sender_name,
          sender_phone,
          receiver_name,
          receiver_phone,
          receiver_address
        )
      `)
      .eq('settlement_id', settlementId)
      .order('order_date', { ascending: false })
    if (itemsError) {
      throw itemsError
    }
    // If no settlement_items exist, try to fetch from order_ids array
    if (!items || items.length === 0) {
      if (settlement.order_ids && settlement.order_ids.length > 0) {
        // Fetch orders directly
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .in('id', settlement.order_ids)
          .order('created_at', { ascending: false })
        if (ordersError) throw ordersError
        // Transform orders to settlement items format
        const transformedItems = orders?.map(order => ({
          id: `temp-${order.id}`,
          settlement_id: settlementId,
          order_id: order.id,
          order_number: order.order_number,
          order_date: order.created_at,
          product_name: order.product?.name || '상품명 없음',
          quantity: order.product?.quantity || 1,
          original_amount: order.payment?.total || 0,
          commission_rate: 20,
          commission_amount: Math.floor((order.payment?.total || 0) * 0.2),
          net_amount: (order.payment?.total || 0) - Math.floor((order.payment?.total || 0) * 0.2),
          // Additional info
          sender_name: order.sender_name,
          sender_phone: order.sender_phone,
          receiver_name: order.receiver_name,
          receiver_phone: order.receiver_phone,
          delivery_address: order.receiver_address
        })) || []
        return NextResponse.json({
          items: transformedItems,
          source: 'orders'
        })
      }
    }
    // Add order info to items if available
    const enrichedItems = items?.map(item => ({
      ...item,
      sender_name: item.order?.sender_name,
      sender_phone: item.order?.sender_phone,
      receiver_name: item.order?.receiver_name,
      receiver_phone: item.order?.receiver_phone,
      delivery_address: item.order?.receiver_address
    }))
    return NextResponse.json({
      items: enrichedItems || [],
      source: 'settlement_items'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
