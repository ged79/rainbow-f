'use client'

import { useState, useEffect } from 'react'
import EmotionalNavbar from '../../../components/EmotionalNavbar'
import CategoryTabs from '../../../components/CategoryTabs'
import ProductCard from '../../../components/ui/ProductCard'
import { ChevronRight, Gift } from 'lucide-react'
import { getProductsByCategoryGrouped } from '../../../services/productService'

export default function CelebrationPage() {
  const [wishlist, setWishlist] = useState<any[]>([])
  const [products, setProducts] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('wishlist')
    if (saved) {
      setWishlist(JSON.parse(saved))
    }
    
    // DB에서 상품 데이터 가져오기 - anniversary로 수정!
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      // celebration이 아닌 anniversary로 호출해야 함!
      const dbProducts = await getProductsByCategoryGrouped('anniversary')
      
      if (dbProducts && Object.keys(dbProducts).length > 0) {
        setProducts(dbProducts)
        
        // 카테고리 순서 정렬: 화환 먼저, 그 다음 상품 수가 많은 순
        const sortedCategories = Object.keys(dbProducts).sort((a, b) => {
          // 1. 화환이 있으면 먼저
          if (a.includes('화환') && !b.includes('화환')) return -1
          if (!a.includes('화환') && b.includes('화환')) return 1
          
          // 2. 화환이 둘 다 있거나 둘 다 없으면 상품 수로 정렬
          const countA = dbProducts[a]?.length || 0
          const countB = dbProducts[b]?.length || 0
          return countB - countA // 많은 것부터
        })
        
        setCategoryOrder(sortedCategories)
      } else {
        // DB가 비어있으면 빈 상태 표시
        setProducts({})
        setCategoryOrder([])
      }
    } catch (error) {
      console.error('Failed to load products:', error)
      setProducts({})
      setCategoryOrder([])
    } finally {
      setLoading(false)
    }
  }

  const toggleWishlist = (product: any) => {
    const exists = wishlist.some(item => item.id === product.id)
    let newWishlist: any[]
    
    if (exists) {
      newWishlist = wishlist.filter(item => item.id !== product.id)
    } else {
      newWishlist = [...wishlist, product]
    }
    
    setWishlist(newWishlist)
    localStorage.setItem('wishlist', JSON.stringify(newWishlist))
    window.dispatchEvent(new Event('wishlistUpdated'))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmotionalNavbar />
        <CategoryTabs />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmotionalNavbar />
      <CategoryTabs />
      
      {/* 페이지 헤더 */}
      <div className="bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-4 md:pt-20 md:pb-10">
          <div className="text-center">
            {/* 제목 - PC에서만 표시 */}
            <h1 className="hidden md:block text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              승진·기념일 축하
            </h1>
            {/* 설명 - 모바일에서는 간소화 */}
            <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto">
              <span className="md:hidden">특별한 날을 더욱 특별하게</span>
              <span className="hidden md:block">승진과 기념일, 특별한 순간을 아름다운 꽃으로 축하합니다</span>
            </p>
          </div>
        </div>
      </div>

      {/* 빠른 네비게이션 - CategoryTabs 아래에 위치 */}
      {categoryOrder.length > 0 && (
        <div className="sticky top-[104px] md:top-[112px] z-10 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-6 py-4 overflow-x-auto scrollbar-hide">
              {categoryOrder.map((subCategory) => (
                <a
                  key={subCategory}
                  href={`#${subCategory}`}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-purple-600 whitespace-nowrap transition-colors"
                >
                  <Gift className="w-4 h-4" />
                  {subCategory}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 상품 섹션들 - 종류별로 그룹화 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {categoryOrder.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4 mx-auto">
              <Gift className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">상품을 준비 중입니다</h3>
            <p className="text-gray-500">곧 다양한 상품을 만나보실 수 있습니다</p>
          </div>
        ) : (
          categoryOrder.map((subCategory, idx) => (
            <div key={subCategory} id={subCategory} className="mb-16">
              {/* 서브 카테고리 헤더 */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {subCategory}
                  </h2>
                  <p className="text-gray-600">
                    {subCategory === '호접란' && '품격있는 축하를 위한 고급 난'}
                    {subCategory === '탁상용화분' && '사무실과 가정을 위한 미니 화분'}
                    {subCategory === '특별한선물' && '마음을 전하는 특별한 선물'}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {products[subCategory]?.length || 0}개 상품
                </div>
              </div>

              {/* 상품 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products[subCategory]?.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image}
                    description={product.description}
                    isWishlisted={wishlist.some(item => item.id === product.id)}
                    onWishlistToggle={() => toggleWishlist(product)}
                  />
                ))}
              </div>

              {/* 섹션 구분선 */}
              {idx < categoryOrder.length - 1 && (
                <div className="mt-12 border-t border-gray-200"></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 하단 CTA */}
      <div className="bg-gradient-to-t from-gray-100 to-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            원하시는 상품을 찾지 못하셨나요?
          </h3>
          <p className="text-gray-600 mb-8">
            맞춤 주문으로 특별한 선물을 준비해드립니다
          </p>
          <button className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors">
            맞춤 주문 상담
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
