/**
 * JWT 기반 인증 시스템
 * 세션 관리 및 토큰 처리
 */

import jwt from 'jsonwebtoken'
import { encryptionService } from './encryption'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-this'
const TOKEN_EXPIRY = '24h'
const REFRESH_TOKEN_EXPIRY = '7d'

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
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
      issuer: 'flower-platform',
      audience: 'flower-users'
    })
  }

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

  decodeToken(token: string): any {
    try {
      return jwt.decode(token)
    } catch {
      return null
    }
  }

  refreshAccessToken(refreshToken: string): {
    accessToken: string
    refreshToken: string
  } | null {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as RefreshTokenPayload
      
      if (!decoded.isRefreshToken) {
        throw new Error('Invalid refresh token')
      }
      
      const payload: TokenPayload = {
        userId: decoded.userId,
        phone: decoded.phone,
        role: decoded.role,
        sessionId: encryptionService.generateToken(16)
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

  getTokenExpiry(token: string): Date | null {
    const decoded = this.decodeToken(token)
    if (!decoded || !decoded.exp) return null
    
    return new Date(decoded.exp * 1000)
  }

  isTokenExpiringSoon(token: string): boolean {
    const expiry = this.getTokenExpiry(token)
    if (!expiry) return true
    
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
    
    return expiry <= fiveMinutesFromNow
  }
}

export const jwtService = new JWTService()

export const COOKIE_OPTIONS = {
  httpOnly: false,
  secure: false,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7,
  path: '/'
}

class SessionStore {
  private sessions = new Map<string, {
    userId: string
    data: any
    createdAt: Date
    lastActivity: Date
    expiresAt: Date
  }>()
  
  create(sessionId: string, userId: string, data: any = {}): void {
    const now = new Date()
    this.sessions.set(sessionId, {
      userId,
      data,
      createdAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
    })
  }
  
  get(sessionId: string): any {
    const session = this.sessions.get(sessionId)
    if (!session) return null
    
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId)
      return null
    }
    
    session.lastActivity = new Date()
    return session
  }
  
  update(sessionId: string, data: any): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false
    
    session.data = { ...session.data, ...data }
    session.lastActivity = new Date()
    return true
  }
  
  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }
  
  deleteUserSessions(userId: string): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId)
      }
    }
  }
  
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

if (typeof window === 'undefined') {
  setInterval(() => {
    sessionStore.cleanup()
  }, 5 * 60 * 1000)
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  
  return parts[1]
}

export function extractTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  const headerToken = extractTokenFromHeader(authHeader)
  if (headerToken) return headerToken
  
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return null
  
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => c.split('='))
  )
  
  return cookies['auth-token'] || null
}
