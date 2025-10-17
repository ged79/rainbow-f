import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  
  try {
    // 실제 배송 완료 사진 조회
    let query = supabase
      .from('customer_orders')
      .select('id, product_name, completion, created_at')
      .eq('status', 'completed')
      .not('completion', 'is', null)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.ilike('product_name', `%${category}%`)
    }

    const { data: orders, error } = await query
    if (error) throw error

    // 각 상품당 1개 사진만 (중복 제거)
    const uniqueProducts = new Map()
    
    orders?.forEach(order => {
      const photos = order.completion?.photos || []
      if (photos[0] && !uniqueProducts.has(order.product_name)) {
        uniqueProducts.set(order.product_name, {
          id: order.id,
          product_name: order.product_name,
          image_url: photos[0],
          // 리본 블러 처리된 URL (CloudFlare Images 등 CDN 활용)
          // image_url: `${photos[0]}?blur=ribbon` // CDN 파라미터 예시
        })
      }
    })

    const examples = Array.from(uniqueProducts.values()).slice(0, 8)
    
    return NextResponse.json(examples)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json([])
  }
}
