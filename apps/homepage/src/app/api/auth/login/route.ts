import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Session token generation
function generateSessionToken(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const random2 = Math.random().toString(36).substring(2, 15)
  return `session_${timestamp}_${random}${random2}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body

    // Validation
    if (!phone || !password) {
      return NextResponse.json(
        { error: '전화번호와 비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }

    // Clean phone format
    const cleanPhone = phone.replace(/-/g, '')
    
    // Fetch member
    const { data: member, error: fetchError } = await supabase
      .from('members')
      .select('*')
      .eq('phone', cleanPhone)
      .single()

    if (fetchError || !member) {
      return NextResponse.json(
        { error: '전화번호 또는 비밀번호가 일치하지 않습니다' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, member.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '전화번호 또는 비밀번호가 일치하지 않습니다' },
        { status: 401 }
      )
    }

    // Generate session
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Set cookie
    cookies().set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/'
    })

    // Return user data (without password)
    const { password: _, ...safeUser } = member
    
    return NextResponse.json({
      success: true,
      user: safeUser,
      sessionToken
    })
    
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
