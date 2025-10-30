import { NextRequest, NextResponse } from 'next/server'

const NHN_APP_KEY = process.env.NHN_SMS_APP_KEY!
const NHN_SECRET_KEY = process.env.NHN_SMS_SECRET_KEY!
const NHN_SENDER = process.env.NHN_SMS_SENDER!

export async function POST(request: NextRequest) {
  try {
    const { to, body: message } = await request.json()
    
    console.log('📱 SMS 발송 요청:', { to, sender: NHN_SENDER })
    console.log('📄 메시지:', message)
    
    const response = await fetch(
      `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${NHN_APP_KEY}/sender/mms`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Secret-Key': NHN_SECRET_KEY
        },
        body: JSON.stringify({
          title: '무지개꽃 알림',
          body: message,
          sendNo: NHN_SENDER,
          recipientList: [{ recipientNo: to }]
        })
      }
    )

    const data = await response.json()
    console.log('📡 NHN 응답:', data)
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('❌ SMS Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
