'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Heart, Share2, Truck, Shield, Clock, Minus, Plus } from 'lucide-react'
import EmotionalNavbar from '@/components/EmotionalNavbar'
import ProductImageGallery from '@/components/ProductImageGallery'

import { getProductById, getRecommendedProducts } from '@/services/productService'

export default function ProductDetailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const productId = searchParams.get('id')
  
  const [product, setProduct] = useState<any | null>(null)
  const [quantity, setQuantity] = useState(1)

  const [isWishlisted, setIsWishlisted] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) {
      router.push('/')
      return
    }
    
    loadProductData()
  }, [productId])

  const loadProductData = async () => {
    try {
      setLoading(true)
      
      // DB에서 상품 정보 가져오기
      const productData = await getProductById(productId!)
      
      if (!productData) {
        alert('상품을 찾을 수 없습니다.')
        router.push('/')
        return
      }
      
      setProduct(productData)
      setMessage((productData as any)?.flowerMessage || '')
      
      // 관련 상품 가져오기
      const recommended = await getRecommendedProducts(productData, 4)
      setRelatedProducts(recommended)
      
      // 위시리스트 확인
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setIsWishlisted(wishlist.some((item: any) => item.id === productId))
    } catch (error) {
      console.error('Failed to load product:', error)
      alert('상품 정보를 불러오는데 실패했습니다.')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity)
    }
  }

  const toggleWishlist = () => {
    if (!product) return
    
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    
    if (isWishlisted) {
      const newWishlist = wishlist.filter((item: any) => item.id !== productId)
      localStorage.setItem('wishlist', JSON.stringify(newWishlist))
      setIsWishlisted(false)
    } else {
      wishlist.push(product)
      localStorage.setItem('wishlist', JSON.stringify(wishlist))
      setIsWishlisted(true)
    }
    
    // 위시리스트 업데이트 이벤트 발생
    window.dispatchEvent(new Event('wishlistUpdated'))
  }

  const addToCart = () => {
    if (!product) return
    
    const cart = JSON.parse(localStorage.getItem('flowerCart') || '[]')
    const existingItem = cart.find((item: any) => item.id === product.id)
    
    if (existingItem) {
      existingItem.quantity += quantity
      existingItem.message = message // 메시지도 업데이트
    } else {
      cart.push({
        ...product,
        quantity,
        message
      })
    }
    
    localStorage.setItem('flowerCart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    alert('장바구니에 추가되었습니다.')
  }

  const handleDirectOrder = () => {
    if (!product) return
    
    // 바로 구매 정보 저장
    localStorage.setItem('directOrder', JSON.stringify({
      ...product,
      quantity,
      message
    }))
    // product ID를 query parameter로 전달
    router.push(`/order?id=${product.id}`)
  }

  const handleShare = async () => {
    if (!product) return
    
    const shareData = {
      title: product.name,
      text: `${product.name} - ${product.price.toLocaleString()}원`,
      url: window.location.href
    }
    
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // 클립보드에 복사
        await navigator.clipboard.writeText(window.location.href)
        alert('링크가 복사되었습니다.')
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <EmotionalNavbar fixed />
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-20 pb-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-24 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  // 이미지 URL 처리 - DB에서 가져온 이미지 사용
  const productImages = {
    main: product.image_url || product.image || '/placeholder.jpg',
    left45: product.image_url || product.image || '/placeholder.jpg',  // 추후 다각도 이미지 추가 시 수정
    right45: product.image_url || product.image || '/placeholder.jpg'  // 추후 다각도 이미지 추가 시 수정
  }

  return (
    <div className="min-h-screen bg-white">
      <EmotionalNavbar fixed />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-20 pb-12">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">뒤로가기</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* 이미지 갤러리 */}
          <div>
            <ProductImageGallery 
              images={productImages}
              productName={product.name || product.display_name}
            />
          </div>

          {/* 상품 정보 */}
          <div>
            <h1 className="text-2xl md:text-3xl font-light text-neutral-900 mb-2">
              {product.name || product.display_name}
            </h1>
            
            {/* 상품 설명 */}
            <p className="text-neutral-600 mb-4">
              {product.description || '아름다운 꽃으로 마음을 전해보세요'}
            </p>

            {/* 등급 및 꽃 수량 정보 (있을 경우) */}
            {(product.grade || product.flower_count) && (
              <div className="flex gap-4 mb-4">
                {product.grade && (
                  <span className="px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                    {product.grade}급
                  </span>
                )}
                {product.flower_count && (
                  <span className="px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                    {product.flower_count}송이
                  </span>
                )}
              </div>
            )}

            {/* 가격 */}
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-semibold text-neutral-900">
                {(product.price * quantity).toLocaleString()}
              </span>
              <span className="text-lg text-neutral-500">원</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-neutral-400 line-through">
                  {(product.originalPrice * quantity).toLocaleString()}원
                </span>
              )}
            </div>

            {/* 배송 정보 - 수정된 부분 */}
            <div className="bg-neutral-50 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">배송 안내</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-neutral-600 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">당일배송</p>
                    <p className="text-xs text-neutral-500">주문 후 3~6시간 이내 배송</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-neutral-600 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">예약배송</p>
                    <p className="text-xs text-neutral-500">지정 시간으로부터 3~6시간 이내 배송</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-neutral-600 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">최대 배송기간</p>
                    <p className="text-xs text-neutral-500">7일 이내 배송 (예약 주문 포함)</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-200">
                <p className="text-xs text-neutral-500">
                  ※ 지역 및 날씨에 따라 배송시간이 다소 변동될 수 있습니다
                </p>
              </div>
            </div>

            {/* 메시지 카드 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                메시지 카드 문구
              </label>
              <textarea 
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400 text-sm"
                rows={3}
                placeholder="전하고 싶은 메시지를 입력하세요"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* 수량 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                수량
              </label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleQuantityChange(-1)}
                  className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(1)}
                  className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                  disabled={quantity >= 99}
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={toggleWishlist}
                className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-all ${
                  isWishlisted 
                    ? 'bg-primary-500 border-primary-500 text-white' 
                    : 'border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} strokeWidth={1.5} />
              </button>
              <button
                onClick={addToCart}
                className="flex-1 px-6 py-3 bg-white border border-neutral-900 text-neutral-900 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                장바구니 담기
              </button>
              <button
                onClick={handleDirectOrder}
                className="flex-1 px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                바로 구매하기
              </button>
            </div>

            {/* 공유하기 */}
            <div className="flex gap-4 justify-center">
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <Share2 className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-sm">공유하기</span>
              </button>
            </div>
          </div>
        </div>

        {/* 관련 상품 */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-medium text-neutral-900 mb-6">함께 보면 좋은 상품</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((item) => (
                <Link key={item.id} href={`/order?id=${item.id}`}>
                  <div className="group cursor-pointer">
                    <div className="aspect-square rounded-lg overflow-hidden bg-neutral-50 mb-3">
                      <img 
                        src={item.image_url || item.image || '/placeholder.jpg'}
                        alt={item.name || item.display_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-1 truncate">
                      {item.name || item.display_name}
                    </h3>
                    <p className="text-sm font-semibold text-neutral-900">
                      {item.price.toLocaleString()}원
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
