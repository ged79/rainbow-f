import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

// 메모리 기반 인증 코드 저장소 (간단한 구조)
// 실제 운영환경에서는 Redis 권장
declare global {
  var verificationCodes: Map<string, { code: string; expiresAt: number; verified: boolean }>
}

if (!global.verificationCodes) {
  global.verificationCodes = new Map()
}

const verificationCodes = global.verificationCodes

// 주기적으로 만료된 코드 정리 (5분마다)
setInterval(() => {
  const now = Date.now()
  for (const [phone, data] of verificationCodes.entries()) {
    if (now > data.expiresAt) {
      verificationCodes.delete(phone)
    }
  }
}, 5 * 60 * 1000)

export async function POST(request: NextRequest) {
  // Rate limiting: SMS 전송 (IP당 분당 3회)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const rateLimitKey = `sms-verification:${clientIp}`
  
  if (!(await checkRateLimit(rateLimitKey))) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }

  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: '전화번호를 입력해주세요' },
        { status: 400 }
      )
    }

    // 전화번호 형식 검증
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다' },
        { status: 400 }
      )
    }

    // 6자리 랜덤 코드 생성 (서버에서!)
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 유효시간 3분
    const expiresAt = Date.now() + (3 * 60 * 1000)
    
    // 서버에 저장
    verificationCodes.set(cleanPhone, { code, expiresAt, verified: false })
    
    console.log(`[SMS 인증] 전화번호: ${cleanPhone}, 코드: ${code} (테스트용 로그)`)

    // NHN Cloud SMS 발송
    const NHN_APP_KEY = process.env.NHN_SMS_APP_KEY
    const NHN_SECRET_KEY = process.env.NHN_SMS_SECRET_KEY
    const NHN_SENDER = process.env.NHN_SMS_SENDER

    if (!NHN_APP_KEY || !NHN_SECRET_KEY || !NHN_SENDER) {
      return NextResponse.json(
        { error: 'SMS 설정이 올바르지 않습니다' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${NHN_APP_KEY}/sender/mms`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Secret-Key': NHN_SECRET_KEY,
        },
        body: JSON.stringify({
          title: '무지개꽃 본인인증',
          body: `[무지개꽃] 인증번호: ${code}\n3분 이내에 입력해주세요.\n타인에게 절대 알려주지 마세요.`,
          sendNo: NHN_SENDER,
          recipientList: [
            {
              recipientNo: cleanPhone,
              countryCode: '82',
            },
          ],
          userId: 'flower-verification',
        }),
      }
    )

    const result = await response.json()
    console.log('[NHN Cloud Response]', result)

    if (result.header.isSuccessful) {
      return NextResponse.json({
        success: true,
        message: '인증번호가 발송되었습니다',
        expiresIn: 180, // 3분
      })
    } else {
      console.error('[NHN SMS Error]', result)
      return NextResponse.json(
        { error: 'SMS 발송에 실패했습니다', details: result.header.resultMessage },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[SMS Verification Error]', error)
    return NextResponse.json(
      { error: 'SMS 발송 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
