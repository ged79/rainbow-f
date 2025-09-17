import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET: User's available coupons/points
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ error: '전화번호를 입력해주세요' }, { status: 400 })
  }

  try {
    // Normalize phone formats
    const normalizedPhone = phone.replace(/-/g, '')
    const phoneWithDash = normalizedPhone.length === 11 
      ? `${normalizedPhone.slice(0,3)}-${normalizedPhone.slice(3,7)}-${normalizedPhone.slice(7)}`
      : normalizedPhone.length === 10 
      ? `${normalizedPhone.slice(0,3)}-${normalizedPhone.slice(3,6)}-${normalizedPhone.slice(6)}`
      : phone

    // Query ALL coupons (including welcome) with both formats
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .or(`customer_phone.eq.${normalizedPhone},customer_phone.eq.${phoneWithDash}`)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    const totalPoints = coupons?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
    
    // Calculate breakdown by type
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
    console.error('Coupon query error:', error)
    return NextResponse.json({ 
      error: '포인트 조회 실패' 
    }, { status: 500 })
  }
}
