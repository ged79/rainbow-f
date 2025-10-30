import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity, customerPhone, pointsToUse = 0, referrerPhone } = body

    // 1. 입력값 검증
    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: '상품 정보가 올바르지 않습니다' },
        { status: 400 }
      )
    }

    if (!customerPhone || !/^010-\d{4}-\d{4}$/.test(customerPhone)) {
      return NextResponse.json(
        { error: '연락처 형식이 올바르지 않습니다' },
        { status: 400 }
      )
    }

    // 2. 상품 가격 조회
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, customer_price, is_active')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (!product.is_active) {
      return NextResponse.json(
        { error: '현재 판매하지 않는 상품입니다' },
        { status: 400 }
      )
    }

    // 3. 기본 금액 계산
    const baseAmount = product.customer_price * quantity

    // 4. 포인트 검증
    let verifiedPoints = 0
    if (pointsToUse > 0) {
      const normalizedPhone = customerPhone.replace(/-/g, '')
      
      const { data: coupons } = await supabase
        .from('coupons')
        .select('amount')
        .eq('customer_phone', normalizedPhone)
        .is('used_at', null)
        .gte('expires_at', new Date().toISOString())

      const availablePoints = coupons?.reduce((sum, c) => sum + c.amount, 0) || 0

      if (pointsToUse > availablePoints) {
        return NextResponse.json(
          { error: '사용 가능한 포인트를 초과했습니다' },
          { status: 400 }
        )
      }

      if (pointsToUse > baseAmount) {
        return NextResponse.json(
          { error: '상품 금액보다 많은 포인트를 사용할 수 없습니다' },
          { status: 400 }
        )
      }

      verifiedPoints = pointsToUse
    }

    // 5. 추천인 검증
    if (referrerPhone && referrerPhone === customerPhone) {
      return NextResponse.json(
        { error: '본인을 추천인으로 등록할 수 없습니다' },
        { status: 400 }
      )
    }

    // 6. 최종 금액 계산
    const finalAmount = baseAmount - verifiedPoints

    // 7. 검증 토큰 생성
    const validationToken = `VAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 검증 정보 저장
    const { error: valError } = await supabase
      .from('order_validations')
      .insert({
        token: validationToken,
        product_id: productId,
        quantity,
        base_amount: baseAmount,
        discount_amount: verifiedPoints,
        final_amount: finalAmount,
        customer_phone: customerPhone.replace(/-/g, ''),
        referrer_phone: referrerPhone?.replace(/-/g, ''),
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      })

    if (valError) {
      console.error('Validation save error:', valError)
      return NextResponse.json(
        { error: '검증 처리 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      valid: true,
      finalAmount,
      baseAmount,
      discountAmount: verifiedPoints,
      pointsVerified: verifiedPoints > 0,
      validationToken,
      expiresIn: 300
    })

  } catch (error: any) {
    console.error('[Order Validation Error]', error)
    return NextResponse.json(
      { error: '검증 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
