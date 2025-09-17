import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }
    const cookieStore = cookies()
    // Create response first to properly set cookies
    let response = NextResponse.json({ success: false })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options) {
            cookieStore.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options) {
            cookieStore.set({ name, value: '', ...options })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      return NextResponse.json(
        { error: error.message || '로그인 실패' },
        { status: 401 }
      )
    }
    if (!data?.user) {
      return NextResponse.json(
        { error: '로그인 실패' },
        { status: 401 }
      )
    }
    // Get store info
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', data.user.id)
      .single()
    if (storeError) {
    }
    // Create new response with proper data and cookies
    response = NextResponse.json({
      success: true,
      user: data.user,
      store: store || null,
      session: data.session
    })
    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}