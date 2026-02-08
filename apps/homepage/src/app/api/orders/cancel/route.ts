import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { orderId, reason } = await request.json()
    
    // Get order details
    const { data: order, error } = await supabaseAdmin
      .from('customer_orders')
      .select('*')
      .eq('id', orderId)
      .single()
    
    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
    }
    
    // Update order status (simplified - only status field)
    const { error: updateError } = await supabaseAdmin
      .from('customer_orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
    
    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    // Restore points if used
    if (order.discount_amount > 0) {
      await supabaseAdmin
        .from('coupons')
        .update({ 
          used_at: null,
          order_id: null 
        })
        .eq('order_id', orderId)
    }
    
    // Remove earned points
    await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('order_id', orderId)
      .eq('type', 'purchase')
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('Cancel error:', error)
    return NextResponse.json({ 
      error: error.message || 'Cancellation failed' 
    }, { status: 500 })
  }
}