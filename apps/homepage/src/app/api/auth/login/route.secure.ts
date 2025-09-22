import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcryptjs'
import { createPublicClient } from '@/lib/supabase/server'
import { validatePhone, sanitizeSqlInput } from '@/lib/security/validation'
import { encryptionService } from '@/lib/security/encryption'
import { createRateLimiter, RATE_LIMITS, ipBlocklist, logSecurityEvent } from '@/lib/security/rate-limit'
import { jwtService, sessionStore, COOKIE_OPTIONS } from '@/lib/security/jwt-auth'

// Rate limiting 설정
const loginRateLimiter = createRateLimiter(RATE_LIMITS.login)

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
         request.headers.get('x-real-ip') || 
         '127.0.0.1'
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const userAgent = request.headers.get('user-agent') || ''
  
  // IP 차단 체크
  if (ipBlocklist.isBlocked(ip)) {
    logSecurityEvent({
      type: 'blocked_ip',
      ip,
      path: '/api/auth/login',
      details: { reason: 'IP is blocked' }
    })
    return NextResponse.json({ error: '접근이 차단되었습니다' }, { status: 403 })
  }
  
  // Rate limiting
  const rateLimitResponse = await loginRateLimiter(request)
  if (rateLimitResponse.status === 429) {
    logSecurityEvent({
      type: 'rate_limit',
      ip,
      path: '/api/auth/login',
      details: { reason: 'Too many login attempts' }
    })
    return rateLimitResponse
  }
  
  try {
    const body = await request.json()
    const { phone, password } = body
    
    // 입력값 검증
    if (!phone || !password) {
      return NextResponse.json(
        { error: '전화번호와 비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }
    
    if (!validatePhone(phone)) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다' },
        { status: 400 }
      )
    }
    
    const cleanPhone = phone.replace(/-/g, '')
    const supabase = createPublicClient()
    
    // 사용자 조회
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('phone', cleanPhone)
      .single()
    
    if (error || !member) {
      // 보안상 구체적인 오류 메시지 숨김
      logSecurityEvent({
        type: 'suspicious_activity',
        ip,
        path: '/api/auth/login',
        details: { 
          reason: 'Login attempt for non-existent user',
          phone: encryptionService.maskPhone(phone)
        }
      })
      
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 일치하지 않습니다' },
        { status: 401 }
      )
    }
    
    // 계정 잠금 확인
    if (member.account_locked_until) {
      const lockTime = new Date(member.account_locked_until)
      if (new Date() < lockTime) {
        const remainingMinutes = Math.ceil((lockTime.getTime() - Date.now()) / (60 * 1000))
        
        logSecurityEvent({
          type: 'suspicious_activity',
          ip,
          path: '/api/auth/login',
          details: { 
            reason: 'Login attempt on locked account',
            memberId: member.id
          }
        })
        
        return NextResponse.json(
          { error: `계정이 잠겨있습니다. ${remainingMinutes}분 후 다시 시도해주세요` },
          { status: 423 }
        )
      } else {
        // 잠금 시간이 지났으면 잠금 해제
        await supabase
          .from('members')
          .update({ 
            account_locked_until: null,
            login_attempts: 0
          })
          .eq('id', member.id)
      }
    }
    
    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, member.password)
    
    if (!isPasswordValid) {
      // 로그인 시도 횟수 증가
      const newAttempts = (member.login_attempts || 0) + 1
      const updateData: any = {
        login_attempts: newAttempts,
        last_login_attempt: new Date().toISOString()
      }
      
      // 5회 실패시 계정 잠금
      if (newAttempts >= 5) {
        updateData.account_locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30분
        
        logSecurityEvent({
          type: 'suspicious_activity',
          ip,
          path: '/api/auth/login',
          details: { 
            reason: 'Account locked due to multiple failed attempts',
            memberId: member.id,
            attempts: newAttempts
          }
        })
      }
      
      await supabase
        .from('members')
        .update(updateData)
        .eq('id', member.id)
      
      // 보안 감사 로그
      await supabase
        .from('security_audit_logs')
        .insert({
          event_type: 'login_failed',
          member_id: member.id,
          ip_address: ip,
          user_agent: userAgent,
          success: false,
          error_message: 'Invalid password'
        })
      
      return NextResponse.json(
        { 
          error: '아이디 또는 비밀번호가 일치하지 않습니다',
          remainingAttempts: Math.max(0, 5 - newAttempts)
        },
        { status: 401 }
      )
    }
    
    // 로그인 성공 - 시도 횟수 리셋
    await supabase
      .from('members')
      .update({ 
        login_attempts: 0,
        last_login_attempt: null,
        last_login_at: new Date().toISOString()
      })
      .eq('id', member.id)
    
    // 세션 ID 생성
    const sessionId = encryptionService.generateToken(32)
    
    // JWT 토큰 생성
    const tokenPayload = {
      userId: member.id,
      phone: member.phone,
      role: member.role || 'user',
      sessionId
    }
    
    const accessToken = jwtService.generateAccessToken(tokenPayload)
    const refreshToken = jwtService.generateRefreshToken(tokenPayload)
    
    // 세션 저장
    sessionStore.create(sessionId, member.id, {
      phone: member.phone,
      name: member.name,
      email: member.email
    })
    
    // DB에 세션 기록
    await supabase
      .from('user_sessions')
      .insert({
        member_id: member.id,
        session_token: sessionId,
        ip_address: ip,
        user_agent: userAgent,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
    
    // 보안 감사 로그
    await supabase
      .from('security_audit_logs')
      .insert({
        event_type: 'login_success',
        member_id: member.id,
        ip_address: ip,
        user_agent: userAgent,
        success: true,
        event_data: { sessionId }
      })
    
    // 민감정보 제거 후 응답
    const { password: _, ...safeUser } = member
    
    // 응답 생성
    const response = NextResponse.json({
      success: true,
      user: {
        ...safeUser,
        phone: encryptionService.maskPhone(safeUser.phone),
        email: safeUser.email ? encryptionService.maskEmail(safeUser.email) : null
      },
      accessToken
    })
    
    // 쿠키 설정
    response.cookies.set('auth-token', accessToken, COOKIE_OPTIONS)
    response.cookies.set('refresh-token', refreshToken, {
      ...COOKIE_OPTIONS,
      httpOnly: true
    })
    
    return response
    
  } catch (error: any) {
    console.error('Login error:', error)
    
    logSecurityEvent({
      type: 'suspicious_activity',
      ip,
      path: '/api/auth/login',
      details: { error: error.message }
    })
    
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}