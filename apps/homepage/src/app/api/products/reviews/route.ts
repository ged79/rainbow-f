import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productName = searchParams.get('name')

  if (!productName) {
    return NextResponse.json({ reviews: [] })
  }

  try {
    // 해당 상품의 모든 주문 찾기
    const { data: orders } = await supabase
      .from('customer_orders')
      .select('id')
      .eq('product_name', productName)

    if (!orders || orders.length === 0) {
      return NextResponse.json({ reviews: [] })
    }

    const orderIds = orders.map(o => o.id)

    // 해당 주문들의 리뷰 가져오기
    const { data: reviews } = await supabase
      .from('order_reviews')
      .select('rating, review, created_at')
      .in('order_id', orderIds)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ reviews: reviews || [] })

  } catch (error) {
    console.error('Error fetching product reviews:', error)
    return NextResponse.json({ reviews: [] })
  }
}
