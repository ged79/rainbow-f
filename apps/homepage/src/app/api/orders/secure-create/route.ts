import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${dateStr}-${random}`
}

function generateCouponCode(): string {
  return `CP${Date.now().toString(36).toUpperCase()}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      validatedPrice,
      validationToken,
      customer_name,
      customer_phone,
      customer_memo,
      recipient_name,
      recipient_phone,
      recipient_address,
      delivery_date,
      delivery_time,
      ribbon_text,
      special_instructions,
      productId,
      product_name,
      quantity,
      pointsToUse = 0,
      referrerPhone,
      funeral_id
    } = body

    // 1. 필수값 검증
    if (!customer_name || !customer_phone || !recipient_name || !recipient_phone) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 2. 검증 토큰 확인 (선택적 - 토큰 없이도 작동)
    let validation = null
    if (validationToken) {
      const { data } = await supabase
        .from('order_validations')
        .select('*')
        .eq('token', validationToken)
        .gte('expires_at', new Date().toISOString())
        .single()
      
      validation = data
    }

    // 3. 상품 확인
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: '상품 정보를 확인할 수 없습니다' },
        { status: 404 }
      )
    }

    // 4. 최종 금액 계산
    const baseAmount = product.customer_price * quantity
    const finalAmount = baseAmount - pointsToUse

    // 5. 주문 번호 생성
    const orderNumber = generateOrderNumber()

    // 6. 주소 처리 - jsonb 타입으로 저장
    const addressObj = typeof recipient_address === 'object' && recipient_address
      ? recipient_address
      : { dong: recipient_address, detail: '' }

    // 7. 포인트 계산
    let buyerPoints = 0
    let referrerPoints = 0
    const hasReferrer = referrerPhone && referrerPhone !== customer_phone

    if (pointsToUse === 0) {
      buyerPoints = Math.floor(finalAmount * (hasReferrer ? 0.05 : 0.03))
      if (hasReferrer) {
        referrerPoints = Math.floor(finalAmount * 0.03)
      }
    }

    // 8. 주문 생성
    const { data: order, error: orderError } = await supabase
    .from('customer_orders')
    .insert({
    order_number: orderNumber,
    customer_name,
    customer_phone: customer_phone.replace(/-/g, ''),
    recipient_name,
    recipient_phone: recipient_phone.replace(/-/g, ''),
    recipient_address: addressObj,
    product_id: productId,
    product_name: product_name || product.display_name,
    product_image: product.image_url,
    original_price: product.customer_price,
    quantity,
    delivery_date,
    delivery_time,
    ribbon_text: Array.isArray(ribbon_text) ? ribbon_text : [ribbon_text].filter(Boolean),
    special_instructions,
    referrer_phone: referrerPhone?.replace(/-/g, ''),
    points_earned: buyerPoints,
    discount_amount: pointsToUse,
    total_amount: finalAmount,
    status: 'payment_pending',  // 결제 전 상태
    funeral_id: funeral_id || null
    })
    .select()
    .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json(
        { error: '주문 생성 실패' },
        { status: 500 }
      )
    }

    // 9. 포인트 차감
    if (pointsToUse > 0) {
      const normalizedPhone = customer_phone.replace(/-/g, '')
      
      const { data: availableCoupons } = await supabase
        .from('coupons')
        .select('*')
        .eq('customer_phone', normalizedPhone)
        .is('used_at', null)
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true })

      if (availableCoupons && availableCoupons.length > 0) {
        let remainingToUse = pointsToUse
        const usedCouponIds: string[] = []

        for (const coupon of availableCoupons) {
          if (remainingToUse <= 0) break
          
          const useAmount = Math.min(coupon.amount, remainingToUse)
          remainingToUse -= useAmount
          usedCouponIds.push(coupon.id)

          if (useAmount < coupon.amount) {
            await supabase
              .from('coupons')
              .insert({
                code: generateCouponCode(),
                customer_phone: normalizedPhone,
                amount: coupon.amount - useAmount,
                type: coupon.type,
                expires_at: coupon.expires_at,
                order_id: order.id
              })
          }
        }

        if (usedCouponIds.length > 0) {
          await supabase
            .from('coupons')
            .update({
              used_at: new Date().toISOString(),
              order_id: order.id
            })
            .in('id', usedCouponIds)
        }
      }
    }

    // 10. 포인트 적립 - 결제 완료 시로 이동
    // 주문 생성 시점에는 적립하지 않음
    // payment/success API에서 처리
    /*
    if (buyerPoints > 0) {
      await supabase
        .from('coupons')
        .insert({
          code: generateCouponCode(),
          customer_phone: customer_phone.replace(/-/g, ''),
          amount: buyerPoints,
          type: 'purchase',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          order_id: order.id
        })
    }

    if (referrerPoints > 0 && hasReferrer) {
      await supabase
        .from('coupons')
        .insert({
          code: generateCouponCode(),
          customer_phone: referrerPhone.replace(/-/g, ''),
          amount: referrerPoints,
          type: 'referral',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          order_id: order.id
        })
    }
    */

    // 11. 검증 토큰 삭제
    if (validationToken) {
      await supabase
        .from('order_validations')
        .delete()
        .eq('token', validationToken)
    }

    // 12. 결제 세션 ID를 주문에 저장
    const paymentSessionId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    await supabase
      .from('customer_orders')
      .update({ payment_session_id: paymentSessionId })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber,
      paymentSessionId,
      amount: finalAmount,
      pointsEarned: buyerPoints
    })

  } catch (error: any) {
    console.error('[Secure Order Creation Error]', error)
    return NextResponse.json(
      { error: '주문 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
