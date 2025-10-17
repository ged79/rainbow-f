import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// POST: Create review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, rating, review, customer_phone } = body

    if (!order_id || !rating) {
      return NextResponse.json({ error: '필수 정보가 없습니다' }, { status: 400 })
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
