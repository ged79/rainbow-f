import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rateLimit'

// POST: Create review
export async function POST(request: NextRequest) {
  // Rate limiting: 리뷰 작성 (분당 5회)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const rateLimitKey = `review-create:${clientIp}`
  
  if (!(await checkRateLimit(rateLimitKey))) {
    return NextResponse.json(
      { error: '리뷰 작성 요청이 너무 많습니다.' },
      { status: 429 }
    )
  }
  
  try {
    const body = await request.json()
    const { order_id, rating, review, customer_phone } = body

    if (!order_id || !rating) {
      return NextResponse.json({ error: '필수 정보가 없습니다' }, { status: 400 })
    }
    
    // 보안: rating 범위 검증 (1-5)
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: '유효하지 않은 별점입니다' }, { status: 400 })
    }
    
    // 보안: 리뷰 중복 체크
    const { data: existing } = await supabaseAdmin
      .from('order_reviews')
      .select('id')
      .eq('order_id', order_id)
      .single()
    
    if (existing) {
      return NextResponse.json({ error: '이미 리뷰가 작성되었습니다' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('order_reviews')
      .insert({
        order_id,
        customer_phone,
        rating,
        review: review || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Review creation error:', error)
      return NextResponse.json({ error: '리뷰 등록 실패' }, { status: 500 })
    }

    await supabaseAdmin
      .from('customer_orders')
      .update({ has_review: true })
      .eq('id', order_id)

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('[Review Creation Error]', {
      error: error.message,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({ 
      error: '리뷰 등록 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

// GET: Get reviews for order
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('order_id')

  if (!orderId) {
    return NextResponse.json({ error: '주문 ID 필요' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('order_reviews')
    .select('*')
    .eq('order_id', orderId)
    .single()

  if (error) {
    return NextResponse.json({ review: null })
  }

  return NextResponse.json({ review: data })
}
