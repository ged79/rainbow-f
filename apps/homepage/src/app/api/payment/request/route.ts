import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const rateLimitKey = `payment-request:${clientIp}`
  
  if (!(await checkRateLimit(rateLimitKey))) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }
  
  try {
    const { 
      amount, 
      orderId, 
      orderName, 
      customerName,
      customerEmail,
      customerMobilePhone,
      method,
      successUrl,
      failUrl 
    } = await request.json()

    if (!amount || !orderId || !orderName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 토스페이먼츠 결제 요청 API
    const response = await fetch('https://api.tosspayments.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        orderId,
        orderName,
        customerName,
        customerEmail,
        customerMobilePhone,
        method,
        successUrl,
        failUrl,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Toss payment request failed:', result)
      return NextResponse.json({ 
        success: false,
        error: result.message || 'Payment request failed' 
      }, { status: response.status })
    }

    return NextResponse.json({ 
      success: true, 
      checkoutUrl: result.checkout?.url,
      paymentKey: result.paymentKey,
      orderId: result.orderId
    })
  } catch (error: any) {
    console.error('[Payment Request Error]', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({ 
      success: false,
      error: '결제 요청 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
