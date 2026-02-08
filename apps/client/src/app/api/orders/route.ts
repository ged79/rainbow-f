import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { 
  createOrderSchema, 
  orderQuerySchema,
  formatValidationErrors 
} from '@/lib/validation/schemas'
import { BUSINESS_RULES, validatePhone, validateOrderAmount } from '@flower/shared'
import { z } from 'zod'

// GET handler for fetching orders (WITH VALIDATION)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // VALIDATION: Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const validationResult = orderQuerySchema.safeParse(searchParams)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: formatValidationErrors(validationResult.error)
        },
        { status: 400 }
      )
    }

    const { type, status, page, limit, start_date, end_date } = validationResult.data
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('orders')
      .select(`
        *,
        sender_store:stores!sender_store_id(id, business_name, phone),
        receiver_store:stores!receiver_store_id(id, business_name, phone)
      `, { count: 'exact' })

    // Apply filters
    if (type === 'sent') {
      query = query.eq('sender_store_id', store.id)
    } else if (type === 'received') {
      query = query.eq('receiver_store_id', store.id)
    } else {
      query = query.or(`sender_store_id.eq.${store.id},receiver_store_id.eq.${store.id}`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (start_date) {
      query = query.gte('created_at', `${start_date}T00:00:00`)
    }

    if (end_date) {
      query = query.lte('created_at', `${end_date}T23:59:59`)
    }

    const { data: orders, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      data: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    logger.error('Get orders error', error)
    
    // Don't expose internal errors
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST handler for creating orders (WITH VALIDATION)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // VALIDATION: Validate input data
    const validationResult = createOrderSchema.safeParse(body)
    
    if (!validationResult.success) {
      // Check if it's a phone number error
      const phoneErrors = validationResult.error.errors.filter(err => 
        err.path.includes('customer_phone') || err.path.includes('recipient_phone')
      )
      
      if (phoneErrors.length > 0) {
        return NextResponse.json(
          { 
            error: '전화번호를 확인하세요. 올바른 형식: 010-1234-5678'
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          error: '입력 정보를 확인해주세요',
          details: formatValidationErrors(validationResult.error)
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Validate and clean phone numbers
    try {
      validatedData.customer_phone = validatePhone(validatedData.customer_phone)
      validatedData.recipient_phone = validatePhone(validatedData.recipient_phone)
      validateOrderAmount(validatedData.product_price * validatedData.product_quantity)
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Additional business logic validation
    if (validatedData.receiver_store_id === store.id) {
      return NextResponse.json(
        { error: '자신의 가게로는 주문할 수 없습니다' },
        { status: 400 }
      )
    }

    // Verify receiver store exists (if delivery order)
    if (validatedData.receiver_store_id) {
      const { data: receiverStore } = await supabase
        .from('stores')
        .select('id, status')
        .eq('id', validatedData.receiver_store_id)
        .single()

      if (!receiverStore) {
        return NextResponse.json(
          { error: '받는 가게를 찾을 수 없습니다' },
          { status: 400 }
        )
      }

      if (receiverStore.status !== 'active') {
        return NextResponse.json(
          { error: '받는 가게가 현재 주문을 받을 수 없는 상태입니다' },
          { status: 400 }
        )
      }
    }

    // Calculate without commission for sender
    const subtotal = validatedData.product_price * validatedData.product_quantity
    const additionalFee = validatedData.additional_fee || 0
    const commission = 0 // NO commission for sender
    const total = subtotal + additionalFee

    // Check if store has enough points
    const { data: storePoints } = await supabase
      .from('stores')
      .select('points_balance')
      .eq('id', store.id)
      .single()

    if (!storePoints || storePoints.points_balance < total) {
      return NextResponse.json(
        { 
          error: '포인트가 부족합니다',
          required: total,
          current: storePoints?.points_balance || 0
        },
        { status: 400 }
      )
    }

    // Keep address object structure intact
    let recipientAddress = validatedData.recipient_address;

    // Convert delivery_time if it's '즉시배송'
    let deliveryTime = validatedData.delivery_time;
    if (deliveryTime === '즉시배송') {
      const now = new Date();
      now.setHours(now.getHours() + 3);
      deliveryTime = `${String(now.getHours()).padStart(2, '0')}:00`;
    }

    // Prepare order data
    const orderData = {
      sender_store_id: store.id,
      receiver_store_id: validatedData.receiver_store_id || null,
      type: validatedData.receiver_store_id ? 'send' : 'send',
      delivery_date: validatedData.delivery_date,
      delivery_time: deliveryTime,
      customer: {
        name: validatedData.customer_name,
        phone: validatedData.customer_phone,
        memo: validatedData.customer_memo || null,
      },
      recipient: {
        name: validatedData.recipient_name,
        phone: validatedData.recipient_phone,
        address: recipientAddress,
      },
      product: {
        type: validatedData.product_type,
        name: validatedData.product_name,
        price: validatedData.product_price,
        quantity: validatedData.product_quantity,
        ribbon_text: Array.isArray(validatedData.ribbon_text) ? validatedData.ribbon_text[0] : validatedData.ribbon_text || null,
        special_instructions: validatedData.special_instructions || null,
      },
      payment: {
        subtotal: subtotal,
        additional_fee: additionalFee,
        additional_fee_reason: validatedData.additional_fee_reason || null,
        commission: 0,
        total,
        points_used: total,
      }
    }

    // Create order with transaction (using RPC for atomicity)
    console.log('Calling RPC with:', { orderData, store_id: store.id, total });
    
    const { data, error } = await supabase.rpc('create_order_with_payment', {
      p_order_data: orderData,
      p_sender_store_id: store.id,
      p_total_amount: total
    })

    if (error) {
      console.error('RPC Error:', error);
      logger.error('Order creation RPC error', error)
      
      // Check for specific error types
      if (error.message?.includes('insufficient points')) {
        return NextResponse.json(
          { error: '포인트가 부족합니다' },
          { status: 400 }
        )
      }
      
      throw error
    }
    
    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error || '주문 생성에 실패했습니다' },
        { status: 400 }
      )
    }

    // Fetch the created order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', data.order_id)
      .single()

    // Log successful order creation
    logger.info('Order created successfully', {
      order_id: data.order_id,
      store_id: store.id,
      total: total
    })

    return NextResponse.json({ data: order }, { status: 201 })
    
  } catch (error: any) {
    logger.error('Create order error', error)
    
    // In development, return detailed error
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: error.message || '주문 생성 중 오류가 발생했습니다',
          details: error.toString(),
          stack: error.stack
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: '주문 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}