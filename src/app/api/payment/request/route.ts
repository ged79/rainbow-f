import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { method, amount, orderId, orderName, customerName, customerMobilePhone } = await request.json()

    // 토스 결제창 생성 (테스트용 Mock)
    // 실제로는 심사 승인 후 위젯 사용
    
    return NextResponse.json({ 
      success: false,
      message: '토스페이먼츠 심사 승인 대기 중입니다. 승인 후 결제가 가능합니다.'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
