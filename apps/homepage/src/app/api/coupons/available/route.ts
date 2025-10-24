import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rateLimit'

// GET: User's available coupons/points
export async function GET(request: NextRequest) {
  // Rate limiting: 포인트 조회 (IP당 분당 30회)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const rateLimitKey = `coupon-check:${clientIp}`
  
  if (!(await checkRateLimit(rateLimitKey))) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }
  
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ error: '전화번호를 입력해주세요' }, { status: 400 })
  }

  try {
    const normalizedPhone = phone.replace(/-/g, '')
    const phoneWithDash = normalizedPhone.length === 11 
      ? `${normalizedPhone.slice(0,3)}-${normalizedPhone.slice(3,7)}-${normalizedPhone.slice(7)}`
      : normalizedPhone.length === 10 
      ? `${normalizedPhone.slice(0,3)}-${normalizedPhone.slice(3,6)}-${normalizedPhone.slice(6)}`
      : phone

    const { data: coupons, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .or(`customer_phone.eq.${normalizedPhone},customer_phone.eq.${phoneWithDash}`)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    const totalPoints = coupons?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
    
    const breakdown = {
      purchase: 0,
      referral: 0,
      welcome: 0
    }
    
    coupons?.forEach(coupon => {
      if (coupon.type === 'purchase') breakdown.purchase += coupon.amount
      else if (coupon.type === 'referral') breakdown.referral += coupon.amount
      else if (coupon.type === 'welcome') breakdown.welcome += coupon.amount
    })

    return NextResponse.json({
      coupons: coupons || [],
      totalPoints,
      count: coupons?.length || 0,
      breakdown
    })

  } catch (error: any) {
    console.error('[Coupon Query Error]', {
      error: error.message,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({ 
      error: '포인트 조회 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
