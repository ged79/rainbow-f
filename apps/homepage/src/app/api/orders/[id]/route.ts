import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rateLimit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (!(await checkRateLimit(`order-status:${clientIp}`))) {
    return NextResponse.json({ error: '요청이 너무 많습니다' }, { status: 429 })
  }

  try {
    const { status } = await request.json()
    const orderId = params.id

    if (!status || !['delivered', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태' }, { status: 400 })
    }

    // 주문 정보 조회
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('customer_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })
    }

    // 상태 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('customer_orders')
      .update({ 
        status,
        delivered_at: status === 'delivered' ? new Date().toISOString() : null
      })
      .eq('id', orderId)

    if (updateError) throw updateError

    // 배송 완료 시 SMS 발송
    if (status === 'delivered') {
      try {
        const smsMessage = `[무지개꽃] 배송이 완료되었습니다.\n주문번호: ${order.order_number}\n수령인: ${order.recipient_name}\n따뜻한 하루 되세요!`
        
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sms/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: order.customer_phone,
            message: smsMessage
          })
        })
      } catch (smsError) {
        console.error('[SMS Error - Non-blocking]', smsError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `주문 상태가 ${status}로 변경되었습니다` 
    })

  } catch (error: any) {
    console.error('[Order Status Update Error]', error)
    return NextResponse.json({ error: '상태 업데이트 실패' }, { status: 500 })
  }
}
