import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { recordPageView } from '@/lib/analytics'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // 보안 헤더 추가
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // 방문자 분석 기록 (비동기, 에러는 무시)
  if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false') {
    const pathname = request.nextUrl.pathname
    
    // 제외할 경로 (static files, API 등)
    const excludePaths = [
      '/_next',
      '/api',
      '/favicon.ico',
      '/.well-known',
      '/robots.txt',
      '/sitemap.xml',
    ]
    
    const shouldTrack = !excludePaths.some(path => pathname.startsWith(path))
    
    if (shouldTrack) {
      try {
        const userAgent = request.headers.get('user-agent') || ''
        const referer = request.headers.get('referer') || ''
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
        
        // IP 마스킹 (보안)
        const maskedIp = maskIpAddress(ip)
        
        // 비동기로 기록 (응답을 지연하지 않도록)
        recordPageView({
          pagePath: pathname,
          referrer: referer,
          userAgent,
          ipAddress: maskedIp,
        }).catch(err => {
          // 분석 에러는 무시 (사용자 경험 방해 안 하기)
          console.error('[Middleware] Analytics error:', err)
        })
      } catch (err) {
        console.error('[Middleware] Unexpected error:', err)
      }
    }
  }
  
  return response
}

/**
 * IP 주소 마스킹 (마지막 옥텟 제거)
 * 예: 192.168.1.100 → 192.168.1.xxx
 */
function maskIpAddress(ip: string): string {
  if (!ip || ip === 'unknown') return 'xxx.xxx.xxx.xxx'
  
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`
  }
  
  // IPv6 같은 경우
  return 'xxx.xxx.xxx.xxx'
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
