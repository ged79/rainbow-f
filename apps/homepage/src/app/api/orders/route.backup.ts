import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role key로 RLS 우회
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 쿠폰 코드 생성 함수
function generateCouponCode(): string {
  return `CP${Date.now().toString(36).toUpperCase()}`
}

// 카카오 알림 발송 함수 (알리고 API 사용)
async function sendKakaoMessage(phone: string, message: string) {
  // 알리고 API 호출 (실제 구현 시 환경변수 설정 필요)
  if (process.env.ALIGO_API_KEY && process.env.ALIGO_USER_ID) {
    try {
      const response = await fetch('https://api.aligo.in/send/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          key: process.env.ALIGO_API_KEY,
          user_id: process.env.ALIGO_USER_ID,
          sender: process.env.BUSINESS_PHONE || '02-1234-5678',
          receiver: phone,
          msg: message,
          msg_type: 'LMS'
        })
      })
      return response.json()
    } catch (error) {
      console.error('카카오 알림 발송 실패:', error)
    }
  } else {
    console.log('카카오 알림 (테스트):', phone, message)
  }
}

// GET: 주문 내역 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const phone = searchParams.get('phone')

  if (!name || !phone) {
    return NextResponse.json({ error: '이름과 전화번호를 입력해주세요' }, { status: 400 })
  }

  try {
    // customer_orders 테이블에서 주문 조회
    const { data: orders, error } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('customer_name', name)
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Order query error:', error)
      throw error
    }

    // 각 주문에 대한 order_items 조회
    const ordersWithItems = []
    for (const order of orders || []) {
      // order_items를 별도로 조회
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)

      if (itemsError) {
        console.error('Order items query error:', itemsError)
      }

      // customer_orders에 직접 저장된 상품 정보를 order_items 형식으로 변환
      const orderItems = items && items.length > 0 ? items : [
        {
          product_id: order.product_id,
          product_name: order.product_name || order.mapped_category,
          product_image: order.product_image,
          price: order.original_price || order.mapped_price,
          quantity: order.quantity || 1
        }
      ]

      ordersWithItems.push({
        ...order,
        order_items: orderItems
      })
    }

    console.log(`Found ${ordersWithItems.length} orders for ${name}/${phone}`)
    return NextResponse.json({ orders: ordersWithItems })
  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json({ error: '주문 조회 실패' }, { status: 500 })
  }
}

// POST: 새 주문 생성
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // 주문번호 생성 (ORD-YYYYMMDD-XXXX)
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const orderNumber = `ORD-${dateStr}-${random}`
  
  // 포인트 계산
  const hasReferrer = body.referrerPhone && body.referrerPhone !== body.customerPhone
  const buyerRate = hasReferrer ? 0.05 : 0.03  // 추천 있으면 5%, 없으면 3%
  const buyerPoints = Math.floor(body.totalAmount * buyerRate)

  // 상품 카테고리 매핑 (4개 카테고리)
  const getMappedCategory = (productId: string, productPrice: number): { category: string, price: number } => {
    // 장례식 화환
    if (productId.includes('funeral')) {
      return { category: '장례식 화환', price: productPrice }
    }
    // 결혼식 화환
    if (productId.includes('wed-') || productId.includes('wedding')) {
      return { category: '결혼식 화환', price: productPrice }
    }
    // 개업.행사
    if (productId.includes('cel-wreath') || productId.includes('plant-') && productPrice > 90000) {
      return { category: '개업.행사', price: productPrice }
    }
    // 승진.기념일
    if (productId.includes('orchid') || productId.includes('birthday') || productId.includes('anniversary')) {
      return { category: '승진.기념일', price: productPrice }
    }
    // 기본값 - 상황에 따라 분류
    if (productPrice >= 80000) {
      return { category: '개업.행사', price: productPrice }
    }
    return { category: '승진.기념일', price: productPrice }
  }

  try {
    // items 배열 확인
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: '주문 상품이 없습니다' }, { status: 400 })
    }

    const mapped = getMappedCategory(body.items[0]?.productId || '', body.items[0]?.price || body.totalAmount)
    
    // customer_orders 테이블에 저장
    const { data: customerOrder, error: customerError } = await supabase
      .from('customer_orders')
      .insert({
        order_number: orderNumber,
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        recipient_name: body.recipientName,
        recipient_phone: body.recipientPhone,
        recipient_address: body.deliveryAddress,
        
        // 상품 정보
        product_id: body.items[0]?.productId,
        product_name: body.items[0]?.productName,
        product_image: body.items[0]?.productImage,
        original_price: body.items[0]?.price,
        quantity: body.items[0]?.quantity || 1,
        
        // 매핑 정보
        mapped_category: mapped.category,
        mapped_price: mapped.price,
        
        // 배송 정보
        delivery_date: body.deliveryDate,
        delivery_time: body.deliveryTime,
        ribbon_text: body.ribbonMessage ? [body.ribbonMessage] : [],
        special_instructions: body.message,
        
        // 추천/포인트
        referrer_phone: body.referrerPhone,
        points_earned: buyerPoints,
        discount_amount: body.discountAmount || 0,
        
        total_amount: body.totalAmount,
        status: 'pending'
      })
      .select()
      .single()

    if (customerError) throw customerError

    // 주문 아이템 생성 (기존 orders 테이블 대신 customer_orders 참조)
    const orderItems = body.items.map((item: any) => ({
      order_id: customerOrder.id,
      product_id: item.productId,
      product_name: item.productName,
      product_image: item.productImage,
      price: item.price,
      quantity: item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // 구매자 쿠폰 생성
    const buyerCouponCode = generateCouponCode()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일 후
    
    const { error: couponError } = await supabase
      .from('coupons')
      .insert({
        code: buyerCouponCode,
        customer_phone: body.customerPhone,
        amount: buyerPoints,
        type: 'purchase',
        expires_at: expiresAt
      })
    
    if (couponError) console.error('쿠폰 생성 오류:', couponError)
    
    // 구매자 카톡 발송
    await sendKakaoMessage(
      body.customerPhone,
      `[꽃배달] 구매 감사드립니다!\n${buyerPoints.toLocaleString()}원 적립 (${hasReferrer ? '추천혜택 5%' : '3%'})\n쿠폰번호: ${buyerCouponCode}\n유효기간: 30일`
    )
    
    // 추천인 처리
    if (hasReferrer) {
      const referrerPoints = Math.floor(body.totalAmount * 0.03)
      const referrerCouponCode = generateCouponCode()
      
      // 추천인 쿠폰 생성
      await supabase.from('coupons').insert({
        code: referrerCouponCode,
        customer_phone: body.referrerPhone,
        amount: referrerPoints,
        type: 'referral',
        expires_at: expiresAt
      })
      
      // 추천 관계 저장 (테이블이 있는 경우만)
      // await supabase.from('referrals').insert({
      //   order_id: customerOrder.id,
      //   buyer_phone: body.customerPhone,
      //   referrer_phone: body.referrerPhone,
      //   buyer_points: buyerPoints,
      //   referrer_points: referrerPoints,
      //   order_amount: body.totalAmount
      // })
      
      // 추천인 카톡 발송
      await sendKakaoMessage(
        body.referrerPhone,
        `[꽃배달] 추천 감사드립니다!\n${referrerPoints.toLocaleString()}원 적립 (추천보상 3%)\n쿠폰번호: ${referrerCouponCode}\n유효기간: 30일`
      )
    }

    return NextResponse.json({ 
      success: true, 
      orderNumber,
      orderId: customerOrder.id,
      pointsEarned: buyerPoints
    })
  } catch (error: any) {
    console.error('Order creation error details:', error)
    return NextResponse.json({ 
      error: '주문 생성 실패', 
      details: error.message 
    }, { status: 500 })
  }
}
