import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ipBlocklist } from './src/lib/security/rate-limit'

// 보호할 경로 목록
const protectedPaths = ['/api/orders', '/api/auth', '/api/payment']
const authRequiredPaths = ['/my-page', '/order', '/withdraw']

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1'
  
  // IP 차단 체크
  if (ipBlocklist.isBlocked(ip)) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  }
  
  // API 경로 보호
  if (protectedPaths.some(p => path.startsWith(p))) {
    // 추가 보안 헤더
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
  }
  
  // 인증이 필요한 페이지
  if (authRequiredPaths.some(p => path.startsWith(p))) {
    const token = request.cookies.get('auth-token')
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // TODO: JWT 토큰 검증
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/my-page/:path*',
    '/order/:path*',
    '/withdraw/:path*'
  ]
}