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
      // NHN Cloud 설정이 없으면 알리고 API 사용
      const formData = new FormData()
      formData.append('key', process.env.ALIGO_API_KEY!)
      formData.append('user_id', process.env.ALIGO_USER_ID!)
      formData.append('sender', process.env.ALIGO_SENDER!)
      formData.append('receiver', to.replace(/-/g, ''))
      formData.append('msg', message)
      formData.append('testmode_yn', process.env.NODE_ENV === 'development' ? 'Y' : 'N')

      const response = await fetch('https://apis.aligo.in/send/', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      console.log('[Aligo Response]', result)

      if (result.result_code === 1 || result.result_code === '1') {
        return NextResponse.json({ success: true, message: 'SMS 발송 완료' })
      } else {
        console.error('[SMS Error]', result)
        return NextResponse.json({ 
          error: 'SMS 발송 실패', 
          details: result.message 
        }, { status: 500 })
      }
    }

    // NHN Cloud SMS API 호출
    const response = await fetch(`https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${NHN_SMS_APP_KEY}/sender/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-Secret-Key': NHN_SMS_SECRET_KEY,
      },
      body: JSON.stringify({
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
