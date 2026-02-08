import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcryptjs'
import { createPublicClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rateLimit'
import { validatePhone, validateEmail } from '@/lib/security/validation'

export async function POST(request: NextRequest) {
  // Rate limiting: 회원가입 (분당 3회)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const rateLimitKey = `signup:${clientIp}`
  
  if (!(await checkRateLimit(rateLimitKey))) {
    return NextResponse.json(
      { error: '회원가입 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }
  
  try {
    const body = await request.json()
    const { phone, password, name, email, existingPoints, existingCoupons } = body

    console.log('Signup attempt:', { phone, name, email, existingPoints })

    // Validation
    if (!phone || !password || !name) {
      return NextResponse.json(
        { error: '필수 정보를 모두 입력해주세요' },
        { status: 400 }
      )
    }
    
    // 보안: 전화번호 형식 검증
    if (!validatePhone(phone)) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다' },
        { status: 400 }
      )
    }
    
    // 보안: 이메일 형식 검증
    if (email && !validateEmail(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다' },
        { status: 400 }
      )
    }

    // Password length check
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 6자 이상이어야 합니다' },
        { status: 400 }
      )
    }

    // Clean phone format
    const cleanPhone = phone.replace(/-/g, '')

    // Get Supabase client
    const supabase = createPublicClient()

    // Check existing member
    const { data: existingMember } = await supabase
      .from('members')
      .select('id')
      .eq('phone', cleanPhone)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: '이미 가입된 전화번호입니다' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create member
    const { data: newMember, error: insertError } = await supabase
      .from('members')
      .insert({
        phone: cleanPhone,
        password: hashedPassword,
        name,
        email: email || null,
        points: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Member creation error:', insertError)
      return NextResponse.json(
        { error: '회원가입 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    // Process existing points/coupons if any
    if (existingPoints && existingCoupons && newMember) {
      try {
        // Update coupons to new member
        const couponCodes = existingCoupons.map((c: any) => c.code)
        
        const { error: couponError } = await supabase
          .from('coupons')
          .update({ 
            member_id: newMember.id,
            customer_phone: cleanPhone 
          })
          .in('code', couponCodes)
          .is('used_at', null)

        if (couponError) {
          console.error('Coupon transfer error:', couponError)
        }

        console.log(`Transferred ${couponCodes.length} coupons to member ${newMember.id}`)
      } catch (error) {
        console.error('Point/coupon processing error:', error)
        // Continue with signup even if transfer fails
      }
    }

    // Create welcome points (4,900원)
    const welcomeCode = `WC${Date.now().toString(36).toUpperCase()}`
    const { error: welcomeError } = await supabase
      .from('coupons')
      .insert({
        code: welcomeCode,
        customer_phone: cleanPhone,
        member_id: newMember.id,
        amount: 4900,
        type: 'welcome',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1년 유효
      })
    
    if (welcomeError) {
      console.error('Welcome points creation error:', welcomeError)
    } else {
      console.log(`Created 4,900원 welcome points for ${cleanPhone}`)
    }

    // Return success (without password)
    const { password: _, ...safeUser } = newMember

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다',
      user: safeUser
    })

  } catch (error: any) {
    console.error('[Signup Error]', {
      error: error.message,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
