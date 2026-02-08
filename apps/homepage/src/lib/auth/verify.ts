/**
 * API 라우트 인증 검증 미들웨어
 */

import { NextRequest } from 'next/server'
import { jwtService, extractTokenFromRequest, sessionStore } from '../security/jwt-auth'
import type { TokenPayload } from '../security/jwt-auth'

export interface AuthResult {
  authenticated: boolean
  user?: {
    userId: string
    phone: string
    role: string
  }
  error?: string
}

/**
 * 요청에서 인증 정보 추출 및 검증
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // 1. 토큰 추출
    const token = extractTokenFromRequest(request)
    
    if (!token) {
      return {
        authenticated: false,
        error: '인증 토큰이 없습니다'
      }
    }
    
    // 2. 토큰 검증
    const payload = jwtService.verifyToken(token)
    
    if (!payload) {
      return {
        authenticated: false,
        error: '유효하지 않은 토큰입니다'
      }
    }
    
    // 3. 세션 확인
    const session = sessionStore.get(payload.sessionId)
    
    if (!session) {
      return {
        authenticated: false,
        error: '세션이 만료되었습니다'
      }
    }
    
    // 4. 사용자 정보 반환
    return {
      authenticated: true,
      user: {
        userId: payload.userId,
        phone: payload.phone,
        role: payload.role || 'user'
      }
    }
    
  } catch (error) {
    console.error('Auth verification error:', error)
    return {
      authenticated: false,
      error: '인증 처리 중 오류가 발생했습니다'
    }
  }
}

/**
 * 전화번호 일치 여부 확인
 */
export function verifyPhoneMatch(authPhone: string, requestPhone: string): boolean {
  const normalizePhone = (phone: string) => phone.replace(/\D/g, '')
  return normalizePhone(authPhone) === normalizePhone(requestPhone)
}
