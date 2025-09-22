import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST: Create review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, rating, review, customer_phone } = body

    if (!order_id || !rating) {
      return NextResponse.json({ error: '필수 정보가 없습니다' }, { status: 400 })
    }

    // Create review
    const { data, error } = await supabase
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

    // Update order status or add review flag if needed
    await supabase
      .from('customer_orders')
      .update({ has_review: true })
      .eq('id', order_id)

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Review error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// GET: Get reviews for order
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('order_id')

  if (!orderId) {
    return NextResponse.json({ error: '주문 ID 필요' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('order_reviews')
    .select('*')
    .eq('order_id', orderId)
    .single()

  if (error) {
    return NextResponse.json({ review: null })
  }

  return NextResponse.json({ review: data })
}
