'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Heart, Search } from 'lucide-react'
import EmotionalNavbar from '../../components/EmotionalNavbar'
import { searchProducts } from '../../services/productService'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [wishlist, setWishlist] = useState<string[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // 검색 실행
  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setSearchResults([])
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      try {
        const results = await searchProducts(query)
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }
    
    performSearch()
  }, [query])
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wishlist')
      if (saved) {
        setWishlist(JSON.parse(saved))
      }
      
      // Load cart count
      const cart = JSON.parse(localStorage.getItem('flowerCart') || '[]')
      setCartCount(cart.length)
    }
    
    window.addEventListener('cartUpdated', loadCartCount)
    return () => window.removeEventListener('cartUpdated', loadCartCount)
  }, [])
  
  const loadCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('flowerCart') || '[]')
    setCartCount(cart.length)
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }
  
  const toggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const newWishlist = wishlist.includes(productId)
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId]
    
    setWishlist(newWishlist)
    localStorage.setItem('wishlist', JSON.stringify(newWishlist))
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* EmotionalNavbar with categories - same as order page */}
      <EmotionalNavbar showCategories={true} fixed={true} />
      
      {/* Main Content */}
      <div className="pt-24 md:pt-28">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              "{query}" 검색 결과
            </h1>
            <p className="text-sm text-gray-500">
              {searchResults.length}개의 상품을 찾았습니다
            </p>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">검색 결과가 없습니다</p>
              <Link href="/" className="text-pink-600 hover:text-pink-700 font-medium">
                홈으로 돌아가기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
              {searchResults.map((product) => (
                <Link key={product.id} href={`/order?id=${product.id}`}>
                  <div className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={(e) => toggleWishlist(e, product.id)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-md"
                      >
                        <Heart 
                          className={`w-4 h-4 transition-colors ${
                            wishlist.includes(product.id) 
                              ? 'fill-red-500 text-red-500' 
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                        />
                      </button>
                      {product.tag && (
                        <span className="absolute top-3 left-3 px-2 py-1 bg-black/70 text-white text-xs rounded">
                          {product.tag}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">
                        {product.flowerMessage || '사랑을 전해요'}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {product.price.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">검색 중...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}