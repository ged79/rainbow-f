import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  console.log('=== MANUAL COUPON FIX ===')
  console.log('Phone:', body.phone)
  console.log('Amount:', body.amount)
  
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Get recent order with discount
  const { data: orders } = await supabase
    .from('customer_orders')
    .select('*')
    .eq('customer_phone', body.phone)
    .gt('discount_amount', 0)
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (!orders || orders.length === 0) {
    return NextResponse.json({ error: 'No order with discount found' })
  }
  
  const order = orders[0]
  const discountAmount = order.discount_amount
  
  // Get unused coupons
  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .eq('customer_phone', body.phone)
    .is('used_at', null)
    .order('amount', { ascending: true })
  
  if (!coupons || coupons.length === 0) {
    return NextResponse.json({ error: 'No coupons available' })
  }
  
  // Use coupons
  let remaining = discountAmount
  let used = []
  
  for (const coupon of coupons) {
    if (remaining <= 0) break
    
    if (coupon.amount <= remaining) {
      await supabase
        .from('coupons')
        .update({ used_at: new Date().toISOString(), order_id: order.id })
        .eq('id', coupon.id)
      
      remaining -= coupon.amount
      used.push(coupon.id)
    }
  }
  
  return NextResponse.json({
    success: true,
    orderId: order.id,
    discount: discountAmount,
    couponsUsed: used.length,
    remaining
  })
}
