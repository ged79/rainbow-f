// Product service - DB 연동
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface HomepageProduct {
  id: string
  name: string
  price: number
  image: string
  originalPrice?: number
  category?: string
  description?: string
  imageLeft45?: string
  imageRight45?: string
}

// DB에서 카테고리별 상품 가져오기
export async function getProductsByCategory(category: string): Promise<HomepageProduct[]> {
  try {
    const categoryMap: Record<string, string[]> = {
      'opening': ['개업·행사', '개업.행사', '개업'],
      'wedding': ['결혼식', '결혼'],
      'funeral': ['장례식', '장례'],
      'anniversary': ['승진·기념일', '승진.기념일', '기념일']
    }
    
    const dbCategories = categoryMap[category] || [category]
    console.log(`[Homepage] Fetching ${category}:`, dbCategories)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('category_1', dbCategories)
      .eq('is_active', true)
      .order('sort_order')
      .order('display_name')

    if (error) {
      console.error('Error fetching products:', error)
      return []
    }

    console.log(`[Homepage] Found ${data?.length || 0} products for ${category}`)
    if (data && data.length > 0) {
      console.log('Sample:', data[0].display_name, data[0].category_1)
    }

    return (data || []).map(product => ({
      id: product.id,
      name: product.display_name,
      price: product.customer_price || product.price, // customer_price가 없으면 price 사용
      image: product.image_url || '/placeholder.jpg',
      description: product.description || '',
      category: product.category_1,
      imageLeft45: product.image_left45,
      imageRight45: product.image_right45,
      originalPrice: product.original_price
    }))
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return []
  }
}

// 세부 카테고리로 그룹화
export async function getProductsByCategoryGrouped(category: string) {
  try {
    const categoryMap: Record<string, string[]> = {
      'opening': ['개업·행사', '개업.행사', '개업'],
      'wedding': ['결혼식', '결혼'],
      'funeral': ['장례식', '장례'],
      'anniversary': ['승진·기념일', '승진.기념일', '기념일']
    }
    
    const dbCategories = categoryMap[category] || [category]

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('category_1', dbCategories)
      .eq('is_active', true)
      .order('category_2')
      .order('sort_order')

    if (error) {
      console.error('Error fetching products:', error)
      return {}
    }

    const grouped: Record<string, any[]> = {}
    
    // category_2로 그룹화
    data?.forEach(product => {
      const subcategory = product.category_2 || '기타'
      if (!grouped[subcategory]) {
        grouped[subcategory] = []
      }
      grouped[subcategory].push({
        id: product.id,
        name: product.display_name,
        price: product.customer_price || product.price,
        image: product.image_url || '/placeholder.jpg',
        description: product.description || '',
        category: product.category_1,
        subcategory: product.category_2,
        imageLeft45: product.image_left45,
        imageRight45: product.image_right45,
        originalPrice: product.original_price
      })
    })
    
    return grouped
  } catch (error) {
    console.error('Failed to fetch grouped products:', error)
    return {}
  }
}

// 상품명 기반 세부 카테고리 결정
function determineSubcategory(productName: string, category: string): string {
  if (category === 'funeral' || category === '장례식') {
    if (productName.includes('근조화환')) return '근조화환'
    if (productName.includes('근조장구')) return '근조장구'
    if (productName.includes('근조꽃바구니')) return '근조꽃바구니'
    return '기타'
  }
  
  if (category === 'opening' || category === '개업·행사') {
    if (productName.includes('축하화환')) return '축하화환'
    if (productName.includes('금전수') || productName.includes('나무') || productName.includes('야자')) {
      return '화분·관엽식물'
    }
    return '기타'
  }
  
  if (category === 'wedding' || category === '결혼식') {
    if (productName.includes('축하화환')) return '축하화환'
    if (productName.includes('꽃다발')) return '꽃다발'
    if (productName.includes('꽃바구니')) return '꽃바구니'
    return '기타'
  }
  
  if (category === 'anniversary' || category === '승진·기념일') {
    if (productName.includes('호접란')) return '호접란'
    if (productName.includes('만천홍')) return '만천홍'
    if (productName.includes('금전수')) return '화분'
    return '기타'
  }
  
  return '기타'
}

// ID로 상품 조회
export async function getProductById(id: string): Promise<HomepageProduct | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching product:', error)
      return null
    }

    if (!data) return null

    return {
      id: data.id,
      name: data.display_name,
      price: data.customer_price || data.price,
      image: data.image_url || '/placeholder.jpg',
      description: data.description || '',
      category: data.category_1,
      imageLeft45: data.image_left45,
      imageRight45: data.image_right45,
      originalPrice: data.original_price
    }
  } catch (error) {
    console.error('Failed to fetch product:', error)
    return null
  }
}

// 추천 상품
export async function getRecommendedProducts(currentProduct: any, limit = 4): Promise<HomepageProduct[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .neq('id', currentProduct?.id)
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recommended products:', error)
      return []
    }

    return (data || []).map(product => ({
      id: product.id,
      name: product.display_name,
      price: product.customer_price || product.price,
      image: product.image_url || '/placeholder.jpg',
      description: product.description || '',
      category: product.category_1,
      originalPrice: product.original_price
    }))
  } catch (error) {
    console.error('Failed to fetch recommended products:', error)
    return []
  }
}

// 상품 검색
export async function searchProducts(query: string): Promise<HomepageProduct[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .ilike('display_name', `%${query}%`)
      .limit(20)

    if (error) {
      console.error('Error searching products:', error)
      return []
    }

    return (data || []).map(product => ({
      id: product.id,
      name: product.display_name,
      price: product.customer_price || product.price,
      image: product.image_url || '/placeholder.jpg',
      description: product.description || '',
      category: product.category_1
    }))
  } catch (error) {
    console.error('Failed to search products:', error)
    return []
  }
}

// 하위 호환성을 위한 export
export const getProduct = getProductById
export const getProductFromDB = getProductById
