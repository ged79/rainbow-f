import { NextRequest, NextResponse } from 'next/server'
import { getDeliveryCompleteMessage } from '@/lib/sms-templates'

const NHN_APP_KEY = process.env.NHN_SMS_APP_KEY!
const NHN_SECRET_KEY = process.env.NHN_SMS_SECRET_KEY!
const NHN_SENDER = process.env.NHN_SMS_SENDER!

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    console.log('📦 배송 완료 SMS 시작:', orderId)
    
    // Supabase에서 주문 정보 조회
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: order, error } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('id', orderId)
      .single()
    
    if (error || !order) {
      console.error('❌ 주문 조회 실패:', error)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    console.log('✅ 주문 조회 성공:', order.order_number)
    
    // 포인트 정보 계산
    const hasReferrer = order.referrer_phone && order.referrer_phone !== order.customer_phone
    const rewardRate = hasReferrer ? 5 : 3
    const pointsEarned = Math.floor(order.total_amount * (rewardRate / 100))
    
    let referrerPoints = 0
    if (hasReferrer) {
      referrerPoints = Math.floor(order.total_amount * 0.03)
    }
    
    // 완료 시간
    const completionTime = order.updated_at 
      ? new Date(order.updated_at).toLocaleString('ko-KR', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : new Date().toLocaleString('ko-KR', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
    
    // 신규 템플릿 사용
    const message = getDeliveryCompleteMessage({
      orderNumber: order.order_number,
      productName: order.product_name || '상품',
      recipientName: order.recipient_name,
      completionTime,
      totalAmount: order.total_amount,
      pointsEarned,
      rewardRate,
      referrerPoints: hasReferrer ? referrerPoints : undefined,
      referrerPhone: hasReferrer ? order.referrer_phone : undefined,
      orderId: order.id
    })
    
    console.log('📱 메시지 생성 완료, 길이:', message.length)
    console.log('📱 발송 대상:', order.customer_phone)
    
    const response = await fetch(
      `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${NHN_APP_KEY}/sender/mms`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Secret-Key': NHN_SECRET_KEY
        },
        body: JSON.stringify({
          title: 'RAINBOW-F',
          body: message,
          sendNo: NHN_SENDER,
          recipientList: [{ recipientNo: order.customer_phone }]
        })
      }
    )

    const data = await response.json()
    console.log('📱 발송 결과:', data)
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('❌ 배송 완료 SMS 오류:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
