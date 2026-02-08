import { NextRequest, NextResponse } from 'next/server'
import { testNotification } from '@/services/notifications'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()
    
    if (!phone) {
      return NextResponse.json(
        { error: '전화번호를 입력해주세요' },
        { status: 400 }
      )
    }
    
    // Test notification (will log if no SMS API keys)
    const success = await testNotification(phone)
    
    return NextResponse.json({
      success,
      message: success 
        ? 'SMS 테스트 메시지가 전송되었습니다' 
        : 'SMS API 키가 설정되지 않았습니다. 로그를 확인하세요.'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Test failed' },
      { status: 500 }
    )
  }
}