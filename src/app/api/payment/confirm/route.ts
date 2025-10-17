import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json()

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Toss payment failed:', result)
      return NextResponse.json({ error: result.message || 'Payment failed' }, { status: response.status })
    }

    return NextResponse.json({ success: true, payment: result })
  } catch (error: any) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
