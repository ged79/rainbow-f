import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (!(await checkRateLimit(`sms-send:${clientIp}`))) {
    return NextResponse.json({ error: '요청이 너무 많습니다' }, { status: 429 })
  }

  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ error: '수신번호와 메시지가 필요합니다' }, { status: 400 })
    }

    // NHN Cloud SMS API 설정
    const NHN_SMS_APP_KEY = process.env.NHN_SMS_APP_KEY
    const NHN_SMS_SECRET_KEY = process.env.NHN_SMS_SECRET_KEY
    const NHN_SMS_SENDER = process.env.NHN_SMS_SENDER

    if (!NHN_SMS_APP_KEY || !NHN_SMS_SECRET_KEY || !NHN_SMS_SENDER) {
      return NextResponse.json({ 
        error: 'NHN Cloud SMS 설정이 필요합니다' 
      }, { status: 500 })
    }

    // NHN Cloud LMS API 호출
    const response = await fetch(`https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${NHN_SMS_APP_KEY}/sender/mms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-Secret-Key': NHN_SMS_SECRET_KEY,
      },
      body: JSON.stringify({
        title: '무지개꽃 알림',
        body: message,
        sendNo: NHN_SMS_SENDER,
        recipientList: [
          {
            recipientNo: to.replace(/-/g, ''),
            countryCode: '82'
          }
        ],
        userId: 'flower-system'
      })
    })

    const result = await response.json()
    console.log('[NHN Cloud Response]', result)

    if (result.header.isSuccessful) {
      return NextResponse.json({ 
        success: true, 
        message: 'SMS 발송 완료',
        requestId: result.body.data.requestId 
      })
    } else {
      console.error('[NHN SMS Error]', result)
      return NextResponse.json({ 
        error: 'SMS 발송 실패', 
        details: result.header.resultMessage 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('[SMS Send Error]', error)
    return NextResponse.json({ error: 'SMS 발송 중 오류' }, { status: 500 })
  }
}
