import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // === RATE LIMITING FOR API ROUTES ===
  if (pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const identifier = `api:${ip}`
    
    const allowed = await checkRateLimit(identifier)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
  }
  
  // === PUBLIC ROUTES - MUST REMAIN ACCESSIBLE ===
  // These routes are intentionally public and must work without authentication
  const publicRoutes = [
    '/',                    // Landing page
    '/login',              // Login page
    '/register',           // Registration page
    '/api/auth/login',     // Login API endpoint - CRITICAL
    '/api/health',         // Health check for monitoring
    '/api/storage/init',   // Storage initialization
  ]
  // === STATIC ASSETS - ALWAYS BYPASS ===
  // Next.js internals, images, styles, etc must always be accessible
  const isStaticAsset = 
    pathname.startsWith('/_next') ||      // Next.js internals
    pathname.startsWith('/favicon') ||    // Favicons
    pathname.includes('.') &&             // Files with extensions
    !pathname.startsWith('/api')          // But not API routes with dots
  // === BYPASS AUTH CHECK FOR PUBLIC ROUTES AND STATIC ASSETS ===
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || 
    (route !== '/' && pathname.startsWith(`${route}/`))
  )
  if (isPublicRoute || isStaticAsset) {
    return NextResponse.next()
  }
  // === PROTECTED ROUTES - CHECK AUTHENTICATION ===
  // All dashboard routes and API endpoints (except public ones) require auth
  try {
    // Create a response object to handle cookie operations
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
    // Initialize Supabase client with cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // Set cookie on both request and response
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            // Remove cookie from both request and response
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )
    // Check if user has valid session
    const { data: { session }, error } = await supabase.auth.getSession()
    // === HANDLE AUTHENTICATION RESULTS ===
    // For API routes: return 401 Unauthorized
    if (!session && pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }
    // For dashboard/protected pages: redirect to login
    if (!session && (
      pathname.startsWith('/dashboard') || 
      pathname.startsWith('/orders') ||
      pathname.startsWith('/points') ||
      pathname.startsWith('/settlements') ||
      pathname.startsWith('/settings')
    )) {
      // Preserve the original URL to redirect back after login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    // === SESSION REFRESH ===
    // If session exists, it may need refreshing (handled by Supabase automatically)
    // Just pass through the response with updated cookies
    return response
  } catch (error) {
    // Log error but don't expose internal details
    // For API routes, return error
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication check failed' },
        { status: 500 }
      )
    }
    // For pages, redirect to login as safety measure
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}