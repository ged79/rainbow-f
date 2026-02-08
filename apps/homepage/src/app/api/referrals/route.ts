import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ error: '전화번호를 입력해주세요' }, { status: 400 })
  }

  try {
    const { data: referrals, error } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('referrer_phone', phone)
      .order('created_at', { ascending: false })

    if (error) throw error

    const totalRewards = referrals?.reduce((sum, ref) => sum + (ref.reward_amount || 0), 0) || 0

    return NextResponse.json({
      referrals: referrals || [],
      totalRewards,
      count: referrals?.length || 0
    })

  } catch (error) {
    console.error('Referral query error:', error)
    return NextResponse.json({ error: '추천 내역 조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referrer_phone, referred_phone, referred_name } = body

    if (!referrer_phone || !referred_phone) {
      return NextResponse.json(
        { error: '추천인과 피추천인 정보가 필요합니다' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_phone: referrer_phone.replace(/-/g, ''),
        referred_phone: referred_phone.replace(/-/g, ''),
        referred_name,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      referral: data
    })

  } catch (error) {
    console.error('Referral creation error:', error)
    return NextResponse.json({ error: '추천 등록 실패' }, { status: 500 })
  }
}
