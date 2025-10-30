import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

// 동일한 저장소 참조 (send-verification과 공유)
// 실제로는 모듈로 분리하거나 Redis 사용 권장
declare global {
  var verificationCodes: Map<string, { code: string; expiresAt: number; verified: boolean }>
}

if (!global.verificationCodes) {
  global.verificationCodes = new Map()
}

const verificationCodes = global.verificationCodes

// 검증 시도 횟수 제한 (무작위 대입 공격 방지)
const verificationAttempts = new Map<string, { count: number; resetAt: number }>()

export async function POST(request: NextRequest) {
  // Rate limiting: 인증 시도 (IP당 분당 10회)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const rateLimitKey = `sms-verify:${clientIp}`
  
  if (!(await checkRateLimit(rateLimitKey))) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }

  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json(
        { error: '전화번호와 인증번호를 입력해주세요' },
        { status: 400 }
      )
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '')

    // 전화번호별 시도 횟수 체크 (5회 제한)
    const now = Date.now()
    const attempts = verificationAttempts.get(cleanPhone)
    
    if (attempts) {
      if (now < attempts.resetAt) {
        if (attempts.count >= 5) {
          return NextResponse.json(
            { error: '인증 시도 횟수를 초과했습니다. 10분 후 다시 시도해주세요.' },
            { status: 429 }
          )
        }
        attempts.count++
      } else {
        // 10분 지났으면 리셋
        verificationAttempts.set(cleanPhone, { count: 1, resetAt: now + 10 * 60 * 1000 })
      }
    } else {
      verificationAttempts.set(cleanPhone, { count: 1, resetAt: now + 10 * 60 * 1000 })
    }

    // 저장된 인증코드 확인
    const storedData = verificationCodes.get(cleanPhone)

    if (!storedData) {
      return NextResponse.json(
        { error: '인증번호를 먼저 요청해주세요' },
        { status: 400 }
      )
    }

    // 유효시간 체크
    if (now > storedData.expiresAt) {
      verificationCodes.delete(cleanPhone)
      return NextResponse.json(
        { error: '인증번호가 만료되었습니다. 다시 요청해주세요.' },
        { status: 400 }
      )
    }

    // 코드 검증
    if (storedData.code !== code) {
      return NextResponse.json(
        { 
          error: '인증번호가 일치하지 않습니다',
          remainingAttempts: Math.max(0, 5 - (attempts?.count || 0))
        },
        { status: 400 }
      )
    }

    // 인증 성공 - verified 플래그 설정
    storedData.verified = true
    verificationCodes.set(cleanPhone, storedData)
    
    // 시도 횟수 초기화
    verificationAttempts.delete(cleanPhone)

    console.log(`[SMS 인증 성공] 전화번호: ${cleanPhone}`)

    return NextResponse.json({
      success: true,
      message: '전화번호 인증이 완료되었습니다',
      verified: true
    })

  } catch (error: any) {
    console.error('[SMS Verification Check Error]', error)
    return NextResponse.json(
      { error: '인증 확인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 인증 상태 확인용 GET 엔드포인트 (선택사항)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  if (!phone) {
    return NextResponse.json(
      { error: '전화번호를 입력해주세요' },
      { status: 400 }
    )
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const storedData = verificationCodes.get(cleanPhone)

  if (!storedData || !storedData.verified || Date.now() > storedData.expiresAt) {
    return NextResponse.json({ verified: false })
  }

  return NextResponse.json({ verified: true })
}
