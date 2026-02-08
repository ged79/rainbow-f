import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface DeliveryExample {
  id: string
  product_name: string
  category: string
  image_url: string
  delivery_region: string
  delivery_date: string
}

// 실제 배송 사례 가져오기
export async function getDeliveryExamples(category?: string): Promise<DeliveryExample[]> {
  try {
    let query = supabase
      .from('delivery_examples')
      .select('*')
      .eq('is_active', true)
      .order('delivery_date', { ascending: false })
      .limit(4)
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching delivery examples:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Failed to fetch delivery examples:', error)
    return []
  }
}