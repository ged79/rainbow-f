import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 로그인 페이지, API, 부고장, 현황판은 검증 제외 (공개 접근 가능)
  if (
    pathname === '/login' || 
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/obituary') ||
    pathname.startsWith('/status-board')
  ) {
    return NextResponse.next();
  }

  // 세션 확인 (브라우저 쿠키 사용)
  const isAuthenticated = request.cookies.get('funeral_authenticated')?.value;
  const funeralHomeId = request.cookies.get('funeral_home_id')?.value;

  if (!isAuthenticated || !funeralHomeId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-512x512.png).*)'],
};
