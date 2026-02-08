'use client'

import { useState, useEffect } from 'react'
import EmotionalNavbar from '../../../components/EmotionalNavbar'
import CategoryTabs from '../../../components/CategoryTabs'
import ProductCard from '../../../components/ui/ProductCard'
import { ChevronRight, Sparkles } from 'lucide-react'
import { getProductsByCategoryGrouped } from '../../../services/productService'

export default function OpeningPage() {
  const [wishlist, setWishlist] = useState<any[]>([])
  const [products, setProducts] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('wishlist')
    if (saved) {
      setWishlist(JSON.parse(saved))
    }
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      // opening과 anniversary 카테고리 모두 가져오기
      const [openingProducts, anniversaryProducts] = await Promise.all([
        getProductsByCategoryGrouped('opening'),
        getProductsByCategoryGrouped('anniversary')
      ])
      
      // 두 카테고리 상품 병합
      const mergedProducts = { ...openingProducts }
      
      Object.entries(anniversaryProducts).forEach(([key, items]) => {
        if (mergedProducts[key]) {
          mergedProducts[key] = [...mergedProducts[key], ...items]
        } else {
          mergedProducts[key] = items
        }
      })
      
      if (mergedProducts && Object.keys(mergedProducts).length > 0) {
        setProducts(mergedProducts)
        
        const sortedCategories = Object.keys(mergedProducts).sort((a, b) => {
          if (a.includes('화환') && !b.includes('화환')) return -1
          if (!a.includes('화환') && b.includes('화환')) return 1
          const countA = mergedProducts[a]?.length || 0
          const countB = mergedProducts[b]?.length || 0
          return countB - countA
        })
        
        setCategoryOrder(sortedCategories)
      } else {
        setProducts({})
        setCategoryOrder([])
      }
    } catch (error) {
      console.error('Error loading products:', error)
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
      <div className="bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-4 md:pt-20 md:pb-10">
          <div className="text-center">
            {/* 제목 - PC에서만 표시 */}
            <h1 className="hidden md:block text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              개업·승진·행사 축하
            </h1>
            {/* 설명 - 모바일에서는 간소화 */}
            <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto">
              <span className="md:hidden">새로운 시작과 성공을 축하합니다</span>
              <span className="hidden md:block">새로운 시작과 특별한 성취를 화환과 꽃으로 축하합니다</span>
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
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-green-600 whitespace-nowrap transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
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
              <Sparkles className="w-10 h-10 text-gray-400" />
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
                    {subCategory === '축하화환' && '성공과 번창을 기원하는 축하화환'}
                    {subCategory === '개업화분' && '새로운 시작을 축하하는 화분'}
                    {subCategory === '공기정화식물' && '실내를 정화하는 건강한 식물'}
                    {subCategory === '호접란' && '품격있는 축하의 선물'}
                    {subCategory === '탁상용화분' && '공간을 밝히는 아름다운 화분'}
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
                    originalPrice={product.originalPrice}
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
    </div>
  )
}