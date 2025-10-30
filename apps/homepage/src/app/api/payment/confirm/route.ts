import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrderConfirmationMessage, getDeliveryCompleteMessage } from '@/lib/sms-templates'

// 고객 SMS 발송 (신규 템플릿 사용)
async function sendOrderConfirmSMS(order: any) {
  try {
    console.log('📱 ========== 고객 SMS 시작 ==========')
    console.log('📱 customer_phone:', order.customer_phone)
    console.log('📱 order_number:', order.order_number)

    if (!order.customer_phone) {
      console.error('❌ customer_phone이 없음!')
      return
    }

    const address = order.recipient_address
    const addressText = typeof address === 'object' 
      ? `${address.sido || ''} ${address.sigungu || ''} ${address.dong || ''} ${address.detail || ''}`.trim()
      : (address || '')

    const ribbonText = order.ribbon_text && Array.isArray(order.ribbon_text) && order.ribbon_text.length > 0
      ? order.ribbon_text[0]
      : ''

    const hasReferrer = order.referrer_phone && order.referrer_phone !== order.customer_phone
    const buyerRate = hasReferrer ? 0.05 : 0.03
    const buyerPoints = Math.floor(order.total_amount * buyerRate)

    const message = getOrderConfirmationMessage({
      orderNumber: order.order_number,
      productName: order.product_name || '상품',
      quantity: order.quantity || 1,
      totalAmount: order.total_amount,
      deliveryDate: order.delivery_date || '',
      deliveryTime: order.delivery_time || '',
      recipientName: order.recipient_name || '',
      recipientPhone: order.recipient_phone || '',
      deliveryAddress: addressText,
      ribbonText: ribbonText,
      isReferral: hasReferrer,
      pointsEarned: buyerPoints,
      orderId: order.id
    })

    console.log('📱 메시지 길이:', message.length, '자')
    console.log('📱 메시지 첫 100자:', message.substring(0, 100))

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: order.customer_phone,
        body: message
      })
    })

    const result = await response.json()
    console.log('📱 발송 응답:', JSON.stringify(result))
    console.log('📱 ========== 고객 SMS 끝 ==========')

  } catch (error: any) {
    console.error('❌ 고객 SMS 실패:', error.message, error.stack)
  }
}

// 배달업체 SMS 발송
async function sendDeliveryNotificationSMS(order: any) {
  try {
    console.log('🚚 ========== 배달업체 SMS 시작 ==========')
    console.log('🚚 주문번호:', order.order_number)

    const address = order.recipient_address
    const addressText = typeof address === 'object' 
      ? `${address.sido || ''} ${address.sigungu || ''} ${address.dong || ''} ${address.detail || ''}`.trim()
      : (address || '')

    const ribbonText = order.ribbon_text && Array.isArray(order.ribbon_text) && order.ribbon_text.length > 0
      ? `\n리본문구: ${order.ribbon_text[0]}`
      : ''

    const message = `[신규 주문] ${order.product_name}\n주문번호: ${order.order_number}\n배송지: ${addressText}\n배송일시: ${order.delivery_date} ${order.delivery_time}\n수령인: ${order.recipient_name} (${order.recipient_phone})${ribbonText}`

    const deliveryPhones = ['01077414569', '01045331333']
    
    for (const phone of deliveryPhones) {
      console.log(`🚚 발송 시작 → ${phone}`)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phone,
          body: message
        })
      })
      
      const result = await response.json()
      console.log(`🚚 발송 완료 ${phone}:`, JSON.stringify(result))
    }
    
    console.log('🚚 ========== 배달업체 SMS 끝 ==========')
  } catch (error: any) {
    console.error('❌ 배달업체 SMS 실패:', error.message)
  }
}

// 중복 실행 방지 플래그
const processedOrders = new Set<string>()

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { paymentKey, orderId, amount } = await request.json()

    console.log('💳 ==========================================')
    console.log('💳 결제 확인 API 호출됨')
    console.log('💳 시각:', new Date().toISOString())
    console.log('💳 paymentKey:', paymentKey)
    console.log('💳 orderId:', orderId)
    console.log('💳 amount:', amount)
    console.log('💳 ==========================================')

    // 중복 방지 체크
    const requestId = `${orderId}-${paymentKey}`
    if (processedOrders.has(requestId)) {
      console.warn('⚠️ 중복 요청 감지! 무시함:', requestId)
      return NextResponse.json({ 
        success: true, 
        message: 'Already processed',
        payment: { orderId, status: 'DONE' }
      })
    }
    processedOrders.add(requestId)
    
    // 5초 후 플래그 제거 (메모리 누수 방지)
    setTimeout(() => processedOrders.delete(requestId), 5000)

    // For test environment, skip Toss verification and directly update order
    if (process.env.TOSS_SECRET_KEY?.startsWith('test_')) {
      console.log('🧪 테스트 모드 - Toss 검증 스킵')

      const { data: order, error } = await supabaseAdmin
        .from('customer_orders')
        .update({ 
          status: 'pending',
          payment_status: 'completed',
          payment_key: paymentKey
        })
        .or(`order_number.eq.${orderId},payment_session_id.eq.${orderId}`)
        .select()
        .single()

      if (error) {
        console.error('❌ 주문 업데이트 실패:', error)
        processedOrders.delete(requestId)
        return NextResponse.json({ error: 'Order update failed' }, { status: 500 })
      }
      
      if (!order) {
        console.error('❌ 주문 없음')
        processedOrders.delete(requestId)
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      console.log('✅ 주문 업데이트 완료')

      // Create points after successful payment ONLY if no discount was used
      if (order.discount_amount === 0) {
        const hasReferrer = order.referrer_phone && order.referrer_phone !== order.customer_phone
        const buyerRate = hasReferrer ? 0.05 : 0.03
        const buyerPoints = Math.floor(order.total_amount * buyerRate)

        if (buyerPoints > 0) {
          await supabaseAdmin.from('coupons').insert({
            code: `CP${Date.now().toString(36).toUpperCase()}`,
            customer_phone: order.customer_phone,
            amount: buyerPoints,
            type: 'purchase',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            order_id: order.id
          })
          console.log('💰 구매자 포인트:', buyerPoints)
        }

        if (hasReferrer) {
          const referrerPoints = Math.floor(order.total_amount * 0.03)
          await supabaseAdmin.from('coupons').insert({
            code: `CP${Date.now().toString(36).toUpperCase()}`,
            customer_phone: order.referrer_phone,
            amount: referrerPoints,
            type: 'referral',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            order_id: order.id
          })
          console.log('💰 추천인 포인트:', referrerPoints)
        }
      }

      // SMS 발송
      await sendOrderConfirmSMS(order)
      await sendDeliveryNotificationSMS(order)

      const duration = Date.now() - startTime
      console.log(`💳 결제 처리 완료 (${duration}ms)`)

      return NextResponse.json({ 
        success: true, 
        payment: { 
          orderId, 
          status: 'DONE',
          method: 'test_card' 
        }
      })
    }

    // Production: verify with Toss
    console.log('🏭 프로덕션 모드 - Toss 검증')
    
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount })
    })

    const result = await response.json()

    if (response.ok) {
      const { data: order } = await supabaseAdmin
        .from('customer_orders')
        .update({ 
          status: 'pending',
          payment_status: 'completed',
          payment_key: paymentKey
        })
        .or(`order_number.eq.${orderId},payment_session_id.eq.${orderId}`)
        .select()
        .single()

      if (order) {
        await sendOrderConfirmSMS(order)
        await sendDeliveryNotificationSMS(order)
      }
    }

    const duration = Date.now() - startTime
    console.log(`💳 결제 처리 완료 (${duration}ms)`)

    return NextResponse.json({ success: true, payment: result })
    
  } catch (error: any) {
    console.error('❌ 결제 확인 오류:', error.message, error.stack)
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}
