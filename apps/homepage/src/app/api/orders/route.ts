import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rateLimit'

function generateCouponCode(): string {
  return `CP${Date.now().toString(36).toUpperCase()}`
}

function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${dateStr}-${random}`
}

// GET: Order lookup - SECURE
export async function GET(request: NextRequest) {
  // Rate limiting: 조회 API (분당 20회)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const rateLimitKey = `order-lookup:${clientIp}`
  
  if (!(await checkRateLimit(rateLimitKey))) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }
  
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const phone = searchParams.get('phone')

  if (!name || !phone) {
    return NextResponse.json({ error: '이름과 전화번호를 입력해주세요' }, { status: 400 })
  }

  try {
    const phoneDigits = phone.replace(/\D/g, '')
    const phoneWithDash = phoneDigits.length === 11 
      ? `${phoneDigits.slice(0,3)}-${phoneDigits.slice(3,7)}-${phoneDigits.slice(7)}`
      : phoneDigits.length === 10
      ? `${phoneDigits.slice(0,3)}-${phoneDigits.slice(3,6)}-${phoneDigits.slice(6)}`
      : phone
    
    const { data: orders, error } = await supabaseAdmin
      .from('customer_orders')
      .select('*')
      .eq('customer_name', name.trim())
      .or(`customer_phone.eq.${phoneDigits},customer_phone.eq.${phoneWithDash}`)
      .order('created_at', { ascending: false })
    
    if (error) {
      // Remove console.error for production
      throw error
    }
    
    const { data: allCoupons } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
    
    console.log('All coupons:', allCoupons?.length, 'Phone searching:', phoneDigits)
    
    const coupons = (allCoupons || []).filter(coupon => {
      const couponPhone = (coupon.customer_phone || '').replace(/\D/g, '')
      return couponPhone === phoneDigits
    })
    
    const totalPoints = coupons.reduce((sum, c) => sum + (c.amount || 0), 0)
    
    console.log('Found coupons:', coupons.length, 'Total points:', totalPoints)

    const ordersWithItems = (orders || []).map(order => ({
      ...order,
      order_items: [{
        product_name: order.product_name || order.mapped_category,
        product_image: order.product_image || '/placeholder.jpg',
        price: order.original_price || order.total_amount,
        quantity: order.quantity || 1
      }]
    }))

    const ordersWithReviews = await Promise.all(
      ordersWithItems.map(async (order) => {
        const { data: review } = await supabaseAdmin
          .from('order_reviews')
          .select('*')
          .eq('order_id', order.id)
          .single()
        
        return { ...order, review }
      })
    )

    return NextResponse.json({ 
      success: true,
      orders: ordersWithReviews,
      points: {
        total: totalPoints,
        available: totalPoints,
        coupons: coupons
      }
    })

  } catch (error) {
    return NextResponse.json({ error: '조회 중 오류' }, { status: 500 })
  }
}

// POST: Create order - SECURE & ATOMIC
export async function POST(request: NextRequest) {
  // Rate limiting: 주문 생성 (IP당 분당 5회)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const rateLimitKey = `order-create:${clientIp}`
  
  if (!(await checkRateLimit(rateLimitKey))) {
    return NextResponse.json(
      { error: '주문 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }
  
  try {
    const body = await request.json()
    const orderNumber = generateOrderNumber()
    
    const customerPhone = body.customerPhone || body.customer_phone || ''
    const customerName = body.customerName || body.customer_name || ''
    const recipientPhone = body.recipientPhone || body.recipient_phone || ''
    const recipientName = body.recipientName || body.recipient_name || ''
    const deliveryAddress = body.deliveryAddress || body.recipient_address || ''
    const totalAmount = body.totalAmount || body.total_amount || 0
    const discountAmount = body.discountAmount || body.discount_amount || 0
    
    const formatPhone = (phone: string) => {
      if (!phone) return ''
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.length === 11) {
        return `${cleaned.slice(0,3)}-${cleaned.slice(3,7)}-${cleaned.slice(7)}`
      } else if (cleaned.length === 10) {
        return `${cleaned.slice(0,3)}-${cleaned.slice(3,6)}-${cleaned.slice(6)}`
      }
      return phone
    }

    const formattedCustomerPhone = formatPhone(customerPhone)
    const productInfo = body.items?.[0] || {}
    
    // CRITICAL FIX: Complete price validation
    if (productInfo.productId) {
      const { data: dbProduct, error: productError } = await supabaseAdmin
        .from('products')
        .select('customer_price, is_active')
        .eq('id', productInfo.productId)
        .single()
      
      if (productError || !dbProduct) {
        return NextResponse.json({ 
          error: '상품 정보를 찾을 수 없습니다' 
        }, { status: 404 })
      }
      
      if (!dbProduct.is_active) {
        return NextResponse.json({ 
          error: '현재 판매하지 않는 상품입니다' 
        }, { status: 400 })
      }
      
      // Complete price verification
      const expectedPrice = dbProduct.customer_price
      const receivedPrice = productInfo.price
      
      if (Math.abs(expectedPrice - receivedPrice) > 1) {
        return NextResponse.json({ 
          error: '가격 정보가 일치하지 않습니다' 
        }, { status: 400 })
      }
      
      // Verify total calculation
      const expectedTotal = expectedPrice * (productInfo.quantity || 1)
      const calculatedTotal = totalAmount + discountAmount
      
      if (Math.abs(expectedTotal - calculatedTotal) > 1) {
        return NextResponse.json({ 
          error: '총액 계산이 잘못되었습니다' 
        }, { status: 400 })
      }
    }
    
    let addressString = ''
    if (typeof deliveryAddress === 'object' && deliveryAddress) {
      const roadAddress = deliveryAddress.dong || ''
      const detailAddress = deliveryAddress.detail || ''
      addressString = detailAddress ? `${roadAddress} ${detailAddress}`.trim() : roadAddress
    } else {
      addressString = deliveryAddress || ''
    }
    
    // Create order first
    const { data: order, error: orderError } = await supabaseAdmin
      .from('customer_orders')
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: formattedCustomerPhone,
        recipient_name: recipientName,
        recipient_phone: formatPhone(recipientPhone),
        recipient_address: addressString,
        product_id: productInfo.productId,
        product_name: productInfo.productName,
        product_image: productInfo.productImage,
        original_price: productInfo.price,
        quantity: productInfo.quantity || 1,
        delivery_date: body.deliveryDate || body.delivery_date,
        delivery_time: body.deliveryTime || body.delivery_time,
        ribbon_text: Array.isArray(body.ribbonMessage) ? body.ribbonMessage : (body.ribbonMessage ? [body.ribbonMessage] : []),
        special_instructions: body.message || body.special_instructions || '',
        referrer_phone: body.referrerPhone ? formatPhone(body.referrerPhone) : null,
        funeral_id: body.funeral_id || null,
        points_earned: 0, // Will update after successful payment
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: 'pending'
      })
      .select()
      .single()

    if (orderError) throw orderError

    // CRITICAL FIX: Atomic point deduction
    if (discountAmount > 0 && formattedCustomerPhone) {
      const { data: deductResult, error: deductError } = await supabaseAdmin.rpc(
        'deduct_points_atomic', 
        {
          p_phone: formattedCustomerPhone,
          p_amount: discountAmount,
          p_order_id: order.id
        }
      )
      
      if (deductError) {
        // Rollback order if points failed
        await supabaseAdmin
          .from('customer_orders')
          .delete()
          .eq('id', order.id)
        
        return NextResponse.json({ 
          error: '포인트 차감 실패. 다시 시도해주세요.' 
        }, { status: 400 })
      }
    }
    
    // Calculate points after successful order
    let buyerPoints = 0
    let referrerPoints = 0
    const hasReferrer = body.referrerPhone && body.referrerPhone !== customerPhone
    
    if (discountAmount === 0) {
      const buyerRate = hasReferrer ? 0.05 : 0.03
      buyerPoints = Math.floor(totalAmount * buyerRate)
      if (hasReferrer) {
        referrerPoints = Math.floor(totalAmount * 0.03)
      }
    }
    
    // Update order with points
    if (buyerPoints > 0) {
      await supabaseAdmin
        .from('customer_orders')
        .update({ points_earned: buyerPoints })
        .eq('id', order.id)
      
      await supabaseAdmin
        .from('coupons')
        .insert({
          code: generateCouponCode(),
          customer_phone: formattedCustomerPhone,
          amount: buyerPoints,
          type: 'purchase',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          order_id: order.id
        })
    }

    if (referrerPoints > 0 && hasReferrer) {
      await supabaseAdmin
        .from('coupons')
        .insert({
          code: generateCouponCode(),
          customer_phone: formatPhone(body.referrerPhone),
          amount: referrerPoints,
          type: 'referral',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          order_id: order.id
        })
    }
    
    // SMS notification (non-blocking)
    try {
      const smsMessage = `[무지개꽃] 주문이 완료되었습니다.\n주문번호: ${orderNumber}\n금액: ${totalAmount.toLocaleString()}원\n배송일: ${body.deliveryDate || body.delivery_date}`
      
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formattedCustomerPhone,
          message: smsMessage
        })
      })
    } catch (smsError) {
      // Silent fail for SMS
    }
    
    return NextResponse.json({ 
      success: true, 
      orderNumber,
      orderId: order.id,
      pointsEarned: buyerPoints
    })

  } catch (error: any) {
    // Log internally, return generic message
    return NextResponse.json({ 
      error: '주문 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }, { status: 500 })
  }
}