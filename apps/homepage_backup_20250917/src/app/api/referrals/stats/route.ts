import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ error: '전화번호가 필요합니다' }, { status: 400 })
  }

  try {
    const normalizedPhone = phone.replace(/-/g, '')
    const phoneWithDash = normalizedPhone.length === 11 
      ? `${normalizedPhone.slice(0,3)}-${normalizedPhone.slice(3,7)}-${normalizedPhone.slice(7)}`
      : phone

    // Get orders where this phone was the referrer
    const { data: referredOrders } = await supabase
      .from('customer_orders')
      .select('*')
      .or(`referrer_phone.eq.${normalizedPhone},referrer_phone.eq.${phoneWithDash}`)

    // Get referral coupons earned
    const { data: referralCoupons } = await supabase
      .from('coupons')
      .select('*')
      .or(`customer_phone.eq.${normalizedPhone},customer_phone.eq.${phoneWithDash}`)
      .eq('type', 'referral')

    const totalReferrals = referredOrders?.length || 0
    const totalRewards = referralCoupons?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
    const pendingRewards = referralCoupons?.filter(c => !c.used_at)
      .reduce((sum, c) => sum + (c.amount || 0), 0) || 0

    return NextResponse.json({
      stats: {
        total_referrals: totalReferrals,
        successful_referrals: totalReferrals,
        total_rewards: totalRewards,
        pending_rewards: pendingRewards
      }
    })

  } catch (error: any) {
    console.error('Referral stats error:', error)
    return NextResponse.json({ 
      error: '추천 통계 조회 실패' 
    }, { status: 500 })
  }
}
