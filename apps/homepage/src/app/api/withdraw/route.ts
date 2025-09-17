import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, amount, bankInfo } = body

    if (!phone || !amount || !bankInfo) {
      return NextResponse.json({ error: '필수 정보를 입력해주세요' }, { status: 400 })
    }

    // Normalize phone
    const normalizedPhone = phone.replace(/\D/g, '')
    const phoneWithDash = normalizedPhone.length === 11 
      ? `${normalizedPhone.slice(0,3)}-${normalizedPhone.slice(3,7)}-${normalizedPhone.slice(7)}`
      : phone

    // Get available points
    const { data: coupons } = await supabase
      .from('coupons')
      .select('*')
      .or(`customer_phone.eq.${normalizedPhone},customer_phone.eq.${phoneWithDash}`)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())

    const totalPoints = coupons?.reduce((sum, c) => sum + c.amount, 0) || 0

    // Calculate withdrawable amount (5,000원 단위)
    const withdrawableAmount = Math.floor(totalPoints / 5000) * 5000

    if (amount > withdrawableAmount) {
      return NextResponse.json({ 
        error: `출금 가능 금액을 초과했습니다. 최대 ${withdrawableAmount.toLocaleString()}원 출금 가능`,
        available: withdrawableAmount
      }, { status: 400 })
    }

    if (amount < 5000) {
      return NextResponse.json({ 
        error: '최소 출금 금액은 5,000원입니다' 
      }, { status: 400 })
    }

    if (amount % 5000 !== 0) {
      return NextResponse.json({ 
        error: '5,000원 단위로만 출금 가능합니다' 
      }, { status: 400 })
    }

    // Create withdrawal record
    const { data: withdrawal, error: withdrawError } = await supabase
      .from('withdrawals')
      .insert({
        customer_phone: phoneWithDash,
        amount,
        bank_name: bankInfo.bankName,
        account_number: bankInfo.accountNumber,
        account_holder: bankInfo.accountHolder,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (withdrawError) throw withdrawError

    // Mark coupons as used
    let remaining = amount
    const sortedCoupons = (coupons || []).sort((a, b) => 
      new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
    )

    for (const coupon of sortedCoupons) {
      if (remaining <= 0) break

      await supabase
        .from('coupons')
        .update({ 
          used_at: new Date().toISOString(),
          withdrawal_id: withdrawal.id
        })
        .eq('id', coupon.id)

      remaining -= coupon.amount
    }

    return NextResponse.json({ 
      success: true,
      message: `${amount.toLocaleString()}원 출금 신청이 완료되었습니다`,
      withdrawalId: withdrawal.id,
      remainingPoints: totalPoints - amount
    })

  } catch (error: any) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ 
      error: '출금 처리 실패',
      details: error.message 
    }, { status: 500 })
  }
}

// GET: Check withdrawable amount
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ error: '전화번호를 입력해주세요' }, { status: 400 })
  }

  try {
    const normalizedPhone = phone.replace(/\D/g, '')
    const phoneWithDash = normalizedPhone.length === 11 
      ? `${normalizedPhone.slice(0,3)}-${normalizedPhone.slice(3,7)}-${normalizedPhone.slice(7)}`
      : phone

    const { data: coupons } = await supabase
      .from('coupons')
      .select('*')
      .or(`customer_phone.eq.${normalizedPhone},customer_phone.eq.${phoneWithDash}`)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())

    const totalPoints = coupons?.reduce((sum, c) => sum + c.amount, 0) || 0
    const withdrawableAmount = Math.floor(totalPoints / 5000) * 5000

    return NextResponse.json({
      totalPoints,
      withdrawableAmount,
      canWithdraw: withdrawableAmount >= 5000
    })

  } catch (error) {
    console.error('Withdrawal check error:', error)
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }
}
