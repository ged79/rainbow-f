import { createClient } from '@/lib/supabase/client'
import { mapToClientCategory } from '@/lib/constants/categoryMapping'

const supabase = createClient()

export interface FloristProduct {
  id: string
  name: string
  floristName: string
  customerPrice: number
  floristPrice: number
  category: string
  subcategory: string
  isWreath: boolean
  grade?: string
}

// DB에서 화원용 상품 가져오기 (중복 제거)
export async function getFloristProducts(): Promise<FloristProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('category_1')
    .order('sort_order')

  if (error) {
    console.error('Error fetching products:', error)
    return getFallbackProducts()
  }

  console.log(`Fetched ${data?.length || 0} products from DB`)

  // 중복 제거: display_name과 florist_price가 모두 같은 경우만
  const uniqueProducts = (data || []).reduce((acc: any[], product: any) => {
    const floristPrice = product.florist_price || Math.floor((product.customer_price || product.price) * 0.7)
    if (!acc.find(p => {
      const pFloristPrice = p.florist_price || Math.floor((p.customer_price || p.price) * 0.7)
      return p.display_name === product.display_name && pFloristPrice === floristPrice
    })) {
      acc.push(product)
    }
    return acc
  }, [])
  
  console.log(`After removing duplicates: ${uniqueProducts.length} unique products`)

  return uniqueProducts.map(product => ({
    id: product.id,
    name: product.display_name,
    floristName: product.florist_name || product.display_name,
    customerPrice: product.customer_price || product.price,
    floristPrice: product.florist_price || calculateFloristPrice(product), // DB값 우선 사용
    category: product.category_1,
    subcategory: product.category_2,
    isWreath: product.category_2?.includes('화환'),
    grade: getWreathGrade(product.display_name)
  }))
}

// 화원가 계산 (DB에 florist_price가 없을 때 폴백)
function calculateFloristPrice(product: any): number {
  const customerPrice = product.customer_price || product.price
  // 기본값: 30% 마진 (70% 화원가)
  return Math.floor(customerPrice * 0.7)
}

// 화환 등급 추출
function getWreathGrade(name: string): string | undefined {
  if (name.includes('실속')) return '실속'
  if (name.includes('60송이')) return '기본'
  if (name.includes('80송이')) return '대'
  if (name.includes('100송이')) return '특대'
  return undefined
}

// 카테고리별 그룹화 - 매핑 사용
export async function getProductsByCategory() {
  const products = await getFloristProducts()
  
  const categorized: Record<string, FloristProduct[]> = {
    '근조화환': [],
    '축하화환': [],
    '화분·난': [],
    '꽃상품': []
  }
  
  products.forEach(product => {
    const clientCategory = mapToClientCategory(product.subcategory || '')
    console.log(`Mapping: ${product.name} (${product.subcategory}) -> ${clientCategory}`)
    if (categorized[clientCategory]) {
      categorized[clientCategory].push(product)
    }
  })
  
  return categorized
}

// 하드코딩 폴백 (DB 접속 실패 시)
function getFallbackProducts(): FloristProduct[] {
  return [
    // 근조화환
    { id: 'FW-E', name: '실속 근조화환', floristName: '근조화환 실속형', customerPrice: 55000, floristPrice: 45000, category: '장례식', subcategory: '근조화환', isWreath: true, grade: '실속' },
    { id: 'FW-B', name: '60송이 근조화환', floristName: '근조화환 기본형', customerPrice: 67000, floristPrice: 60000, category: '장례식', subcategory: '근조화환', isWreath: true, grade: '기본' },
    { id: 'FW-S', name: '80송이 근조화환', floristName: '근조화환 대형', customerPrice: 81000, floristPrice: 70000, category: '장례식', subcategory: '근조화환', isWreath: true, grade: '대' },
    { id: 'FW-P', name: '100송이 근조화환', floristName: '근조화환 특대형', customerPrice: 95000, floristPrice: 80000, category: '장례식', subcategory: '근조화환', isWreath: true, grade: '특대' },
    // 축하화환
    { id: 'CW-E', name: '실속 축하화환', floristName: '축하화환 실속형', customerPrice: 55000, floristPrice: 45000, category: '개업·행사', subcategory: '축하화환', isWreath: true, grade: '실속' },
    { id: 'CW-B', name: '60송이 축하화환', floristName: '축하화환 기본형', customerPrice: 67000, floristPrice: 60000, category: '개업·행사', subcategory: '축하화환', isWreath: true, grade: '기본' },
    { id: 'CW-S', name: '80송이 축하화환', floristName: '축하화환 대형', customerPrice: 81000, floristPrice: 70000, category: '개업·행사', subcategory: '축하화환', isWreath: true, grade: '대' },
    { id: 'CW-P', name: '100송이 축하화환', floristName: '축하화환 특대형', customerPrice: 95000, floristPrice: 80000, category: '개업·행사', subcategory: '축하화환', isWreath: true, grade: '특대' }
  ]
}
