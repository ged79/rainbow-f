/**
 * JWT 기반 인증 시스템
 * 세션 관리 및 토큰 처리
 */

import jwt from 'jsonwebtoken'
import { encryptionService } from './encryption'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-this'
const TOKEN_EXPIRY = '24h' // 토큰 유효 기간
const REFRESH_TOKEN_EXPIRY = '7d' // 리프레시 토큰 유효 기간

export interface TokenPayload {
  userId: string
  phone: string
  role?: string
  sessionId: string
}

export interface RefreshTokenPayload extends TokenPayload {
  isRefreshToken: true
}

export class JWTService {
  /**
   * Access Token 생성
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
      issuer: 'flower-platform',
      audience: 'flower-users'
    })
  }

  /**
   * Refresh Token 생성
   */
  generateRefreshToken(payload: TokenPayload): string {
    const refreshPayload: RefreshTokenPayload = {
      ...payload,
      isRefreshToken: true
    }
    
    return jwt.sign(refreshPayload, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'flower-platform',
      audience: 'flower-users'
    })
  }

  /**
   * 토큰 검증
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'flower-platform',
        audience: 'flower-users'
      }) as TokenPayload
      
      return decoded
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  /**
   * 토큰 디코드 (검증 없이)
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token)
    } catch {
      return null
    }
  }

  /**
   * 토큰 갱신
   */
  refreshAccessToken(refreshToken: string): {
    accessToken: string
    refreshToken: string
  } | null {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as RefreshTokenPayload
      
      if (!decoded.isRefreshToken) {
        throw new Error('Invalid refresh token')
      }
      
      // 새 토큰 생성
      const payload: TokenPayload = {
        userId: decoded.userId,
        phone: decoded.phone,
        role: decoded.role,
        sessionId: encryptionService.generateToken(16) // 새 세션 ID
      }
      
      return {
        accessToken: this.generateAccessToken(payload),
        refreshToken: this.generateRefreshToken(payload)
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      return null
    }
  }

  /**
   * 토큰 만료 시간 확인
   */
  getTokenExpiry(token: string): Date | null {
    const decoded = this.decodeToken(token)
    if (!decoded || !decoded.exp) return null
    
    return new Date(decoded.exp * 1000)
  }

  /**
   * 토큰이 곧 만료되는지 확인 (5분 이내)
   */
  isTokenExpiringSoon(token: string): boolean {
    const expiry = this.getTokenExpiry(token)
    if (!expiry) return true
    
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
    
    return expiry <= fiveMinutesFromNow
  }
}

// 싱글톤 인스턴스
export const jwtService = new JWTService()

/**
 * HTTP 쿠키 옵션
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24 * 7, // 7일
  path: '/'
}

/**
 * 세션 저장소 (메모리 기반 - 실제로는 Redis 권장)
 */
class SessionStore {
  private sessions = new Map<string, {
    userId: string
    data: any
    createdAt: Date
    lastActivity: Date
    expiresAt: Date
  }>()
  
  /**
   * 세션 생성
   */
  create(sessionId: string, userId: string, data: any = {}): void {
    const now = new Date()
    this.sessions.set(sessionId, {
      userId,
      data,
      createdAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24시간
    })
  }
  
  /**
   * 세션 조회
   */
  get(sessionId: string): any {
    const session = this.sessions.get(sessionId)
    if (!session) return null
    
    // 만료 체크
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId)
      return null
    }
    
    // 활동 시간 업데이트
    session.lastActivity = new Date()
    
    return session
  }
  
  /**
   * 세션 업데이트
   */
  update(sessionId: string, data: any): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false
    
    session.data = { ...session.data, ...data }
    session.lastActivity = new Date()
    
    return true
  }
  
  /**
   * 세션 삭제
   */
  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }
  
  /**
   * 사용자의 모든 세션 삭제
   */
  deleteUserSessions(userId: string): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId)
      }
    }
  }
  
  /**
   * 만료된 세션 정리
   */
  cleanup(): void {
    const now = new Date()
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId)
      }
    }
  }
}

export const sessionStore = new SessionStore()

// 5분마다 만료된 세션 정리
if (typeof window === 'undefined') {
  setInterval(() => {
    sessionStore.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * 인증 헤더에서 토큰 추출
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  
  return parts[1]
}

/**
 * 요청에서 토큰 추출 (헤더 또는 쿠키)
 */
export function extractTokenFromRequest(request: Request): string | null {
  // 1. Authorization 헤더 확인
  const authHeader = request.headers.get('Authorization')
  const headerToken = extractTokenFromHeader(authHeader)
  if (headerToken) return headerToken
  
  // 2. 쿠키 확인
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return null
  
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => c.split('='))
  )
  
  return cookies['auth-token'] || null
}