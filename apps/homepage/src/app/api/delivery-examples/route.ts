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
    // 카테고리별 검색어 매핑
    const categoryKeywords: Record<string, string[]> = {
      '결혼식': ['웨딩', '결혼', '신부', '부케'],
      '장례식': ['근조', '장례', '조문'],
      '개업식': ['개업', '축하', '오픈'],
      '생일': ['생일', '축하'],
      '병문안': ['병문안', '쾌유', '회복'],
    }
    
    // 실제 배송 완료 사진 조회
    let query = supabase
      .from('customer_orders')
      .select('id, product_name, completion, created_at')
      .eq('status', 'completed')
      .not('completion', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)

    // 카테고리별 필터링
    if (category && categoryKeywords[category]) {
      const keywords = categoryKeywords[category]
      const orConditions = keywords.map(keyword => `product_name.ilike.%${keyword}%`).join(',')
      query = query.or(orConditions)
    } else if (category) {
      query = query.ilike('product_name', `%${category}%`)
    }

    const { data: orders, error } = await query
    if (error) throw error

    console.log(`Found ${orders?.length} orders for category: ${category}`)

    // 각 상품당 1개 사진만 (중복 제거)
    const uniqueProducts = new Map()
    
    orders?.forEach(order => {
      let photos = []
      try {
        // completion이 문자열이면 파싱
        const completion = typeof order.completion === 'string' 
          ? JSON.parse(order.completion) 
          : order.completion
        photos = completion?.photos || []
      } catch (e) {
        console.error('Parse error for order:', order.id, e)
      }
      
      if (photos[0] && !uniqueProducts.has(order.product_name)) {
        uniqueProducts.set(order.product_name, {
          id: order.id,
          product_name: order.product_name,
          image_url: photos[0],
        })
      }
    })

    const examples = Array.from(uniqueProducts.values()).slice(0, 8)
    
    // 데이터가 없으면 전체에서 랜덤 선택
    if (examples.length === 0) {
      const { data: allOrders } = await supabase
        .from('customer_orders')
        .select('id, product_name, completion, created_at')
        .eq('status', 'completed')
        .not('completion', 'is', null)
        .order('created_at', { ascending: false })
        .limit(8)
      
      const fallbackExamples = allOrders?.map(order => {
        let photos = []
        try {
          const completion = typeof order.completion === 'string'
            ? JSON.parse(order.completion)
            : order.completion
          photos = completion?.photos || []
        } catch (e) {}
        
        return {
          id: order.id,
          product_name: order.product_name,
          image_url: photos[0] || '/placeholder.jpg'
        }
      }).filter(ex => ex.image_url !== '/placeholder.jpg') || []
      
      return NextResponse.json(fallbackExamples)
    }
    
    return NextResponse.json(examples)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json([])
  }
}