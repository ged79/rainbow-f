/**
 * Rate Limiting 미들웨어
 * API 엔드포인트 보호 및 DDoS 방어
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number  // 시간 창 (밀리초)
  maxRequests: number  // 최대 요청 수
  message?: string  // 제한 초과시 메시지
  skipSuccessfulRequests?: boolean  // 성공한 요청은 카운트 제외
  keyGenerator?: (req: NextRequest) => string  // 키 생성 함수
}

interface RateLimitEntry {
  count: number
  firstRequest: number
  lastRequest: number
  blocked: boolean
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null
  
  constructor() {
    // 1분마다 만료된 엔트리 정리
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, 60 * 1000)
    }
  }
  
  /**
   * Rate limiting 체크
   */
  check(key: string, config: RateLimitConfig): {
    allowed: boolean
    retryAfter?: number
    remaining: number
  } {
    const now = Date.now()
    const entry = this.store.get(key)
    
    // 새로운 엔트리
    if (!entry) {
      this.store.set(key, {
        count: 1,
        firstRequest: now,
        lastRequest: now,
        blocked: false
      })
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1
      }
    }
    
    // 시간 창 확인
    const windowElapsed = now - entry.firstRequest
    
    // 시간 창이 지났으면 리셋
    if (windowElapsed > config.windowMs) {
      this.store.set(key, {
        count: 1,
        firstRequest: now,
        lastRequest: now,
        blocked: false
      })
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1
      }
    }
    
    // 이미 차단된 경우
    if (entry.blocked) {
      const retryAfter = Math.ceil((config.windowMs - windowElapsed) / 1000)
      return {
        allowed: false,
        retryAfter,
        remaining: 0
      }
    }
    
    // 요청 수 증가
    entry.count++
    entry.lastRequest = now
    
    // 제한 초과 체크
    if (entry.count > config.maxRequests) {
      entry.blocked = true
      const retryAfter = Math.ceil((config.windowMs - windowElapsed) / 1000)
      
      return {
        allowed: false,
        retryAfter,
        remaining: 0
      }
    }
    
    this.store.set(key, entry)
    
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count
    }
  }
  
  /**
   * 특정 키의 제한 리셋
   */
  reset(key: string) {
    this.store.delete(key)
  }
  
  /**
   * 만료된 엔트리 정리
   */
  cleanup() {
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1시간
    
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.lastRequest > maxAge) {
        this.store.delete(key)
      }
    }
  }
  
  /**
   * 정리 작업 중지
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// 싱글톤 인스턴스
const rateLimiter = new RateLimiter()

/**
 * Rate limiting 미들웨어 생성
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimitMiddleware(req: NextRequest) {
    // 키 생성 (기본: IP 주소)
    const key = config.keyGenerator 
      ? config.keyGenerator(req)
      : getClientIp(req)
    
    const result = rateLimiter.check(key, config)
    
    if (!result.allowed) {
      return NextResponse.json(
        {
          error: config.message || '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          retryAfter: result.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(result.retryAfter),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': new Date(Date.now() + (result.retryAfter || 0) * 1000).toISOString()
          }
        }
      )
    }
    
    // Rate limit 헤더 추가
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
    
    return response
  }
}

/**
 * 클라이언트 IP 추출
 */
function getClientIp(req: NextRequest): string {
  // Cloudflare
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp
  
  // X-Forwarded-For
  const xForwardedFor = req.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  
  // X-Real-IP
  const xRealIp = req.headers.get('x-real-ip')
  if (xRealIp) return xRealIp
  
  // 기본 IP (개발 환경)
  return '127.0.0.1'
}

/**
 * 사전 정의된 rate limit 설정
 */
export const RATE_LIMITS = {
  // 로그인 시도 (5분에 5회)
  login: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 5,
    message: '로그인 시도가 너무 많습니다. 5분 후 다시 시도해주세요.'
  },
  
  // 회원가입 (시간당 3회)
  signup: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    message: '회원가입 시도가 너무 많습니다. 1시간 후 다시 시도해주세요.'
  },
  
  // SMS 발송 (시간당 5회)
  sms: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
    message: 'SMS 발송 한도를 초과했습니다. 1시간 후 다시 시도해주세요.'
  },
  
  // 일반 API (분당 60회)
  api: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: 'API 요청 한도를 초과했습니다.'
  },
  
  // 엄격한 제한 (분당 10회)
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: '요청이 너무 많습니다.'
  }
}

/**
 * IP 기반 차단 리스트
 */
class IPBlocklist {
  private blocklist = new Set<string>()
  private tempBlocklist = new Map<string, number>() // IP -> 차단 만료 시간
  
  /**
   * IP 영구 차단
   */
  block(ip: string) {
    this.blocklist.add(ip)
  }
  
  /**
   * IP 임시 차단
   */
  tempBlock(ip: string, durationMs: number) {
    this.tempBlocklist.set(ip, Date.now() + durationMs)
  }
  
  /**
   * 차단 여부 확인
   */
  isBlocked(ip: string): boolean {
    // 영구 차단 확인
    if (this.blocklist.has(ip)) {
      return true
    }
    
    // 임시 차단 확인
    const expiry = this.tempBlocklist.get(ip)
    if (expiry) {
      if (Date.now() < expiry) {
        return true
      } else {
        this.tempBlocklist.delete(ip)
      }
    }
    
    return false
  }
  
  /**
   * 차단 해제
   */
  unblock(ip: string) {
    this.blocklist.delete(ip)
    this.tempBlocklist.delete(ip)
  }
}

export const ipBlocklist = new IPBlocklist()

/**
 * 보안 이벤트 로깅
 */
export function logSecurityEvent(event: {
  type: 'rate_limit' | 'blocked_ip' | 'suspicious_activity'
  ip: string
  path: string
  details?: any
}) {
  const timestamp = new Date().toISOString()
  
  // 실제 환경에서는 로깅 서비스로 전송
  console.warn(`[SECURITY] ${timestamp}`, event)
  
  // 의심스러운 활동이 반복되면 IP 차단
  if (event.type === 'suspicious_activity') {
    // 실제로는 Redis 등을 사용해 카운트 관리
    ipBlocklist.tempBlock(event.ip, 30 * 60 * 1000) // 30분 차단
  }
}