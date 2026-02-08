import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderId = searchParams.get('orderId')
  const paymentKey = searchParams.get('paymentKey')
  const amount = searchParams.get('amount')
  
  if (!orderId) {
    return NextResponse.redirect('/payment/fail?code=MISSING_ORDER_ID')
  }

  try {
    // 주문 조회
    const { data: order, error } = await supabase
      .from('customer_orders')
      .select('*')
      .or(`order_number.eq.${orderId},id.eq.${orderId}`)
      .single()

    if (error || !order) {
      console.error('Order not found:', orderId)
      return NextResponse.redirect('/payment/fail?code=ORDER_NOT_FOUND')
    }

    // 상태 업데이트: payment_pending → pending (Admin에서 처리 가능)
    const { error: updateError } = await supabase
      .from('customer_orders')
      .update({
        status: 'pending',
        payment_key: paymentKey,
        paid_amount: amount,
        paid_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Failed to update order:', updateError)
      return NextResponse.redirect('/payment/fail?code=UPDATE_FAILED')
    }

    // 포인트 적립 처리
    if (order.points_earned > 0) {
      await supabase
        .from('coupons')
        .insert({
          code: `CP${Date.now().toString(36).toUpperCase()}`,
          customer_phone: order.customer_phone,
          amount: order.points_earned,
          type: 'purchase',
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          order_id: order.id
        })
    }

    // 추천인 포인트
    if (order.referrer_phone && order.referrer_phone !== order.customer_phone) {
      const referrerPoints = Math.floor(order.total_amount * 0.03)
      if (referrerPoints > 0) {
        await supabase
          .from('coupons')
          .insert({
            code: `CP${Date.now().toString(36).toUpperCase()}`,
            customer_phone: order.referrer_phone,
            amount: referrerPoints,
            type: 'referral',
            expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            order_id: order.id
          })
      }
    }

    // 성공 페이지로 리다이렉트
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/order-complete?orderId=${order.order_number}`)
  } catch (error) {
    console.error('Payment success processing error:', error)
    return NextResponse.redirect('/payment/fail?code=UNKNOWN_ERROR')
  }
}
