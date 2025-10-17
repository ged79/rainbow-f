import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function generateCouponCode(): string {
  return `CP${Date.now().toString(36).toUpperCase()}`
}

function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${dateStr}-${random}`
}

// GET: Order lookup - FIXED to match partial phone
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const phone = searchParams.get('phone')

  if (!name || !phone) {
    return NextResponse.json({ error: '이름과 전화번호를 입력해주세요' }, { status: 400 })
  }

  try {
    // Normalize phone for exact matching
    const phoneDigits = phone.replace(/\D/g, '')
    const phoneWithDash = phoneDigits.length === 11 
      ? `${phoneDigits.slice(0,3)}-${phoneDigits.slice(3,7)}-${phoneDigits.slice(7)}`
      : phoneDigits.length === 10
      ? `${phoneDigits.slice(0,3)}-${phoneDigits.slice(3,6)}-${phoneDigits.slice(6)}`
      : phone
    
    console.log(`Searching orders for: name='${name}', phone='${phoneWithDash}' or '${phoneDigits}'`)
    
    // Get orders with exact phone match
    const { data: orders, error } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('customer_name', name.trim())
      .or(`customer_phone.eq.${phoneDigits},customer_phone.eq.${phoneWithDash}`)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Order query error:', error)
    }
    
    console.log(`Found ${orders?.length || 0} orders for ${name}/${phoneWithDash}`)
    
    // Get coupons with flexible phone matching
    const { data: allCoupons } = await supabase
      .from('coupons')
      .select('*')
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
    
    const coupons = (allCoupons || []).filter(coupon => {
      const couponPhone = (coupon.customer_phone || '').replace(/\D/g, '')
      return couponPhone === phoneDigits
    })
    
    const totalPoints = coupons.reduce((sum, c) => sum + (c.amount || 0), 0)

    const ordersWithItems = (orders || []).map(order => ({
      ...order,
      order_items: [{
        product_name: order.product_name || order.mapped_category,
        product_image: order.product_image || '/placeholder.jpg',
        price: order.original_price || order.total_amount,
        quantity: order.quantity || 1
      }]
    }))

    return NextResponse.json({ 
      success: true,
      orders: ordersWithItems,
      points: {
        total: totalPoints,
        available: totalPoints,
        coupons: coupons
      }
    })

  } catch (error) {
    console.error('Order lookup error:', error)
    return NextResponse.json({ error: '조회 중 오류' }, { status: 500 })
  }
}

// POST: Create order - FIXED with individual updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('=== ORDER START ===')
    console.log('Raw body received:', JSON.stringify(body, null, 2))
    console.log('Customer:', body.customerName || body.customer_name, body.customerPhone || body.customer_phone)
    console.log('Discount:', body.discountAmount || body.discount_amount)
    
    const orderNumber = generateOrderNumber()
    
    const customerPhone = body.customerPhone || body.customer_phone || ''
    const customerName = body.customerName || body.customer_name || ''
    const recipientPhone = body.recipientPhone || body.recipient_phone || ''
    const recipientName = body.recipientName || body.recipient_name || ''
    const deliveryAddress = body.deliveryAddress || body.recipient_address || ''
    const totalAmount = body.totalAmount || body.total_amount || 0
    const discountAmount = body.discountAmount || body.discount_amount || 0
    console.log('=== DISCOUNT CHECK ===', { discountAmount, usePoints: body.usePoints, totalPoints: body.totalPoints })
    
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
    
    let addressString = ''
    if (typeof deliveryAddress === 'object' && deliveryAddress) {
      // dong에 도로명 주소가, detail에 상세주소가 저장됨
      const roadAddress = deliveryAddress.dong || ''
      const detailAddress = deliveryAddress.detail || ''
      addressString = detailAddress ? `${roadAddress} ${detailAddress}`.trim() : roadAddress
    } else {
      addressString = deliveryAddress || ''
    }
    
    // NO POINTS if discount used
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
    
    // Create order
    const { data: order, error } = await supabase
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
        ribbon_text: body.ribbonMessage ? [body.ribbonMessage] : body.ribbon_text || [],
        special_instructions: body.message || body.special_instructions || '',
        referrer_phone: body.referrerPhone ? formatPhone(body.referrerPhone) : null,
        points_earned: buyerPoints,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    console.log('Order created:', { orderNumber, dbOrderNumber: order.order_number })
    console.log('Order created:', { orderNumber, customer_phone: formattedCustomerPhone, discount: discountAmount })

    // Process coupon deduction if discount is applied
    if (discountAmount > 0 && formattedCustomerPhone) {
      console.log(`Processing ${discountAmount}원 coupon usage for ${formattedCustomerPhone}`)
      
      const normalizedPhone = customerPhone.replace(/\D/g, '')
      
      // Get ALL coupons (including welcome) with BOTH phone formats
      const { data: coupons1 } = await supabase
        .from('coupons')
        .select('*')
        .eq('customer_phone', formattedCustomerPhone)
        .is('used_at', null)
        .gte('expires_at', new Date().toISOString())
      
      const { data: coupons2 } = await supabase
        .from('coupons')
        .select('*')
        .eq('customer_phone', normalizedPhone)
        .is('used_at', null)
        .gte('expires_at', new Date().toISOString())
      
      // Combine and deduplicate
      const allCoupons = [...(coupons1 || []), ...(coupons2 || [])]
      const uniqueCoupons = allCoupons.filter((coupon, index, self) =>
        index === self.findIndex(c => c.id === coupon.id)
      ).sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())  // Use coupons expiring first
      
      console.log(`Found ${uniqueCoupons.length} available coupons for ${formattedCustomerPhone}`)
      
      if (uniqueCoupons.length > 0) {
        let remaining = discountAmount
        let successCount = 0
        const usedCoupons = []
        
        // Use coupons up to discount amount
        for (const coupon of uniqueCoupons) {
          if (remaining <= 0) break
          
          const { error: updateError } = await supabase
            .from('coupons')
            .update({ 
              used_at: new Date().toISOString(), 
              order_id: order.id 
            })
            .eq('id', coupon.id)
          
          if (!updateError) {
            const usedAmount = Math.min(coupon.amount, remaining)
            remaining -= coupon.amount
            successCount++
            usedCoupons.push(`${coupon.code}(${coupon.type}:${coupon.amount}원)`)
            console.log(`✓ Used coupon ${coupon.code} (${coupon.type}): ${coupon.amount}원`)
          } else {
            console.error(`✗ Failed to use coupon ${coupon.code}:`, updateError)
          }
        }
        
        console.log(`Used ${successCount} coupons: [${usedCoupons.join(', ')}], Remaining: ${remaining}원`)
      } else {
        console.log('⚠️ No available coupons found despite discount amount!')
      }
    }
    
    console.log('포인트 적립 조건:', { discountAmount, buyerPoints, hasReferrer, formattedCustomerPhone })
    
    // Create points only if no discount
    if (buyerPoints > 0) {
      const result = await supabase
        .from('coupons')
        .insert({
          code: generateCouponCode(),
          customer_phone: formattedCustomerPhone,
          amount: buyerPoints,
          type: 'purchase',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          order_id: order.id
        })
      console.log('구매 포인트 적립:', formattedCustomerPhone, buyerPoints, result.error || '성공')
    }

    if (referrerPoints > 0 && hasReferrer) {
      const result = await supabase
        .from('coupons')
        .insert({
          code: generateCouponCode(),
          customer_phone: formatPhone(body.referrerPhone),
          amount: referrerPoints,
          type: 'referral',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          order_id: order.id
        })
      console.log('추천 포인트 적립:', formatPhone(body.referrerPhone), referrerPoints, result.error || '성공')
    }

    console.log('=== ORDER END ===')
    
    return NextResponse.json({ 
      success: true, 
      orderNumber,
      orderId: order.id,
      pointsEarned: buyerPoints
    })

  } catch (error: any) {
    console.error('Order error:', error)
    return NextResponse.json({ 
      error: '주문 처리 실패',
      details: error.message 
    }, { status: 500 })
  }
}
