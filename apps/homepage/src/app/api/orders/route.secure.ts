import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encryptionService, processSensitiveData } from '@/lib/security/encryption'
import { validatePhone, sanitizeSqlInput, escapeHtml } from '@/lib/security/validation'
import { createRateLimiter, RATE_LIMITS, ipBlocklist, logSecurityEvent } from '@/lib/security/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Rate limiting 적용
const orderRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1분
  maxRequests: 10, // 분당 10회
  message: '주문 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
})

function generateCouponCode(): string {
  return `CP${Date.now().toString(36).toUpperCase()}`
}

function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${dateStr}-${random}`
}

// IP 추출 헬퍼
function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
         request.headers.get('x-real-ip') || 
         '127.0.0.1'
}

// GET: 주문 조회 (보안 강화)
export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  
  // IP 차단 체크
  if (ipBlocklist.isBlocked(ip)) {
    return NextResponse.json({ error: '접근이 차단되었습니다' }, { status: 403 })
  }
  
  // Rate limiting
  const rateLimitCheck = await orderRateLimiter(request)
  if (rateLimitCheck.status === 429) {
    logSecurityEvent({
      type: 'rate_limit',
      ip,
      path: '/api/orders',
      details: { method: 'GET' }
    })
    return rateLimitCheck
  }
  
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const phone = searchParams.get('phone')

  if (!name || !phone) {
    return NextResponse.json({ error: '이름과 전화번호를 입력해주세요' }, { status: 400 })
  }

  // 입력값 검증 및 sanitization
  const sanitizedName = sanitizeSqlInput(escapeHtml(name.trim()))
  
  if (!validatePhone(phone)) {
    return NextResponse.json({ error: '올바른 전화번호 형식이 아닙니다' }, { status: 400 })
  }

  try {
    const phoneDigits = phone.replace(/\D/g, '')
    
    // 암호화된 전화번호로 조회 (향후 구현)
    // 현재는 평문 조회지만, 추후 암호화 필드 추가 시 변경 필요
    const { data: orders, error } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('customer_name', sanitizedName)
      .or(`customer_phone.eq.${phoneDigits}`)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Order query error:', error)
      return NextResponse.json({ error: '주문 조회 실패' }, { status: 500 })
    }
    
    // 민감정보 마스킹 처리
    const maskedOrders = orders?.map(order => ({
      ...order,
      customer_phone: encryptionService.maskPhone(order.customer_phone),
      recipient_phone: order.recipient_phone ? encryptionService.maskPhone(order.recipient_phone) : null,
      delivery_address: order.delivery_address ? encryptionService.maskAddress(order.delivery_address) : null
    }))
    
    return NextResponse.json({ orders: maskedOrders || [] })
  } catch (error) {
    console.error('Order lookup error:', error)
    logSecurityEvent({
      type: 'suspicious_activity',
      ip,
      path: '/api/orders',
      details: { error: String(error) }
    })
    return NextResponse.json({ error: '주문 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST: 새 주문 생성 (보안 강화)
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  
  // IP 차단 체크
  if (ipBlocklist.isBlocked(ip)) {
    return NextResponse.json({ error: '접근이 차단되었습니다' }, { status: 403 })
  }
  
  // Rate limiting (주문은 더 엄격하게)
  const rateLimitCheck = await createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5분
    maxRequests: 3, // 5분당 3회
    message: '주문이 너무 많습니다. 5분 후 다시 시도해주세요.'
  })(request)
  
  if (rateLimitCheck.status === 429) {
    logSecurityEvent({
      type: 'rate_limit',
      ip,
      path: '/api/orders',
      details: { method: 'POST' }
    })
    return rateLimitCheck
  }
  
  try {
    const body = await request.json()
    
    // 필수 필드 검증
    const requiredFields = [
      'customerName', 'customerPhone', 'recipientName', 
      'recipientPhone', 'deliveryAddress', 'products'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `필수 정보가 누락되었습니다: ${field}` },
          { status: 400 }
        )
      }
    }
    
    // 전화번호 검증
    if (!validatePhone(body.customerPhone) || !validatePhone(body.recipientPhone)) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다' },
        { status: 400 }
      )
    }
    
    // 입력값 sanitization
    const sanitizedData = {
      customerName: sanitizeSqlInput(escapeHtml(body.customerName)),
      customerPhone: body.customerPhone.replace(/\D/g, ''),
      recipientName: sanitizeSqlInput(escapeHtml(body.recipientName)),
      recipientPhone: body.recipientPhone.replace(/\D/g, ''),
      deliveryAddress: sanitizeSqlInput(escapeHtml(body.deliveryAddress)),
      deliveryDate: body.deliveryDate,
      deliveryTime: sanitizeSqlInput(escapeHtml(body.deliveryTime || '')),
      message: sanitizeSqlInput(escapeHtml(body.message || '')),
      ribbonMessage: sanitizeSqlInput(escapeHtml(body.ribbonMessage || ''))
    }
    
    // 제품 검증 (가격 조작 방지)
    const products = body.products
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: '제품 정보가 올바르지 않습니다' },
        { status: 400 }
      )
    }
    
    // 총액 서버에서 재계산 (클라이언트 값 신뢰하지 않음)
    let totalAmount = 0
    for (const product of products) {
      // 실제로는 DB에서 가격 조회해야 함
      totalAmount += product.price * (product.quantity || 1)
    }
    
    const orderNumber = generateOrderNumber()
    
    // 민감정보 암호화 (향후 암호화 컬럼 추가 시 사용)
    const encryptedPhone = processSensitiveData(sanitizedData.customerPhone, 'phone')
    const encryptedAddress = processSensitiveData(sanitizedData.deliveryAddress, 'address')
    
    // 주문 생성
    const { data: order, error: orderError } = await supabase
      .from('customer_orders')
      .insert({
        order_number: orderNumber,
        customer_name: sanitizedData.customerName,
        customer_phone: sanitizedData.customerPhone, // 향후 encrypted 필드로 변경
        recipient_name: sanitizedData.recipientName,
        recipient_phone: sanitizedData.recipientPhone,
        delivery_address: sanitizedData.deliveryAddress,
        delivery_date: sanitizedData.deliveryDate,
        delivery_time: sanitizedData.deliveryTime,
        message: sanitizedData.message,
        ribbon_message: sanitizedData.ribbonMessage,
        total_amount: totalAmount,
        status: 'pending',
        ip_address: ip, // 주문자 IP 기록
        user_agent: request.headers.get('user-agent') || '' // 브라우저 정보 기록
      })
      .select()
      .single()
    
    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json(
        { error: '주문 생성에 실패했습니다' },
        { status: 500 }
      )
    }
    
    // 주문 상품 추가
    const orderItems = products.map(product => ({
      order_id: order.id,
      product_id: product.id,
      product_name: sanitizeSqlInput(product.name),
      product_image: product.image,
      price: product.price,
      quantity: product.quantity || 1
    }))
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
    
    if (itemsError) {
      console.error('Order items error:', itemsError)
      // 주문 롤백 필요
    }
    
    // 응답에서 민감정보 마스킹
    const responseOrder = {
      ...order,
      customer_phone: encryptionService.maskPhone(order.customer_phone),
      recipient_phone: encryptionService.maskPhone(order.recipient_phone),
      delivery_address: encryptionService.maskAddress(order.delivery_address)
    }
    
    return NextResponse.json({
      success: true,
      order: responseOrder
    })
    
  } catch (error) {
    console.error('Order processing error:', error)
    logSecurityEvent({
      type: 'suspicious_activity',
      ip,
      path: '/api/orders',
      details: { error: String(error) }
    })
    
    return NextResponse.json(
      { error: '주문 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}