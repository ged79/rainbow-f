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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('wishlist')
    if (saved) {
      setWishlist(JSON.parse(saved))
    }
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const dbProducts = await getProductsByCategoryGrouped('opening')
      
      if (dbProducts && Object.keys(dbProducts).length > 0) {
        setProducts(dbProducts)
        
        const sortedCategories = Object.keys(dbProducts).sort((a, b) => {
          if (a.includes('화환') && !b.includes('화환')) return -1
          if (!a.includes('화환') && b.includes('화환')) return 1
          const countA = dbProducts[a]?.length || 0
          const countB = dbProducts[b]?.length || 0
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
    let updated
    if (exists) {
      updated = wishlist.filter(item => item.id !== product.id)
    } else {
      updated = [...wishlist, product]
    }
    setWishlist(updated)
    localStorage.setItem('wishlist', JSON.stringify(updated))
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      <EmotionalNavbar />
      <CategoryTabs activeCategory="opening" />
      
      <div className="min-h-screen bg-gray-50">
        {/* 페이지 헤더 */}
        <div className="bg-gradient-to-b from-green-50 to-white">
          <div className="max-w-7xl mx-auto px-4 pt-6 pb-4 md:pt-20 md:pb-10">
            <div className="text-center">
              {/* 제목 - PC에서만 표시 */}
              <h1 className="hidden md:block text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                개업·행사 축하
              </h1>
              {/* 설명 - 모바일에서는 간소화 */}
              <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto">
                <span className="md:hidden">새로운 시작을 응원합니다</span>
                <span className="hidden md:block">성공적인 시작을 기원하며 축하의 마음을 전합니다</span>
              </p>
            </div>
          </div>
        </div>

        {/* 빠른 네비게이션 - 서브카테고리 표시 */}
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

        <div className="max-w-7xl mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-4 text-gray-600">상품을 불러오는 중...</p>
            </div>
          ) : Object.keys(products).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">상품을 준비 중입니다.</p>
            </div>
          ) : (
            <>
              {categoryOrder.map((category, index) => (
                <div key={category} id={category} className={index > 0 ? 'mt-12' : ''}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-gray-800">{category}</h2>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        {products[category]?.length || 0}개 상품
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {products[category]?.map((product: any) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isWishlisted={wishlist.some(item => item.id === product.id)}
                        onWishlistToggle={() => toggleWishlist(product)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>


      </div>
    </>
  )
}
