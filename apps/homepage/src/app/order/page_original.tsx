'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import EmotionalNavbar from '../../components/EmotionalNavbar'
import PaymentModal from '../../components/PaymentModal'
import { Heart, ShoppingCart, Minus, Plus, MapPin, Calendar, Clock } from 'lucide-react'
import { getProduct } from '../../lib/products'
import type { CreateOrderInput, ProductType } from '@flower/shared/types'

declare global {
  interface Window {
    daum: any
  }
}

const OrderPage = () => {
  const [quantity, setQuantity] = useState(1)
  const [showPayment, setShowPayment] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState('')
  const [isWishlisted, setIsWishlisted] = useState(false)
  const searchParams = useSearchParams()
  
  // 주소 관련 state
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [detailAddress, setDetailAddress] = useState('')
  
  // 주문 데이터
  const [orderData, setOrderData] = useState<Partial<CreateOrderInput>>({
    customer_name: '',
    customer_phone: '',
    customer_memo: '',
    customer_company: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_address: {
      sido: '',
      sigungu: '',
      dong: '',
      detail: '',
      postal_code: ''
    },
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_time: '14:00',
    product_type: '근조화환' as ProductType,
    product_name: '',
    product_price: 0,
    product_quantity: 1,
    ribbon_text: [],
    special_instructions: '',
    receiver_store_id: undefined,
    additional_fee: 0,
    additional_fee_reason: ''
  })

  useEffect(() => {
    const productId = searchParams.get('id')
    if (productId) {
      const foundProduct = getProduct(productId)
      if (foundProduct) {
        setProduct(foundProduct)
        setSelectedImage(foundProduct.image)
        
        setOrderData(prev => ({
          ...prev,
          product_name: foundProduct.name,
          product_price: foundProduct.price,
          product_type: getProductType(foundProduct.name)
        }))
      }
    }
    setIsLoading(false)
  }, [searchParams])
  
  const getProductType = (productName: string): ProductType => {
    if (productName.includes('근조')) return '근조화환'
    if (productName.includes('축하') || productName.includes('개업')) return '축하화환'
    if (productName.includes('화분')) return '관엽화분'
    if (productName.includes('바구니')) return '꽃바구니'
    if (productName.includes('꽃다발')) return '꽃다발'
    if (productName.includes('서양란')) return '서양란'
    if (productName.includes('동양란')) return '동양란'
    return '기타'
  }
  
  // Daum Postcode script 로드
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    document.body.appendChild(script)
    script.onload = () => {
      setScriptLoaded(true)
    }
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const openAddressSearch = () => {
    if (!scriptLoaded || !window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 로드중입니다. 잠시 후 다시 시도해주세요.')
      return
    }
    
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        const fullAddr = data.roadAddress || data.jibunAddress
        const sido = data.sido
        const sigungu = data.sigungu
        const dong = data.bname
        const detail = fullAddr
        const postal_code = data.zonecode
        
        setOrderData({
          ...orderData,
          recipient_address: {
            sido,
            sigungu,
            dong,
            detail,
            postal_code
          }
        })
      }
    }).open()
  }

  const handleOrder = async () => {
    if (!orderData.customer_name || !orderData.customer_phone) {
      alert('주문자 정보를 입력해주세요.')
      return
    }
    if (!orderData.recipient_name || !orderData.recipient_phone) {
      alert('수령인 정보를 입력해주세요.')
      return
    }
    
    const address = orderData.recipient_address
    if (!address || (typeof address === 'object' && !address.detail)) {
      alert('배송 주소를 입력해주세요.')
      return
    }
    
    if (!orderData.delivery_date) {
      alert('배송 날짜를 선택해주세요.')
      return
    }
    
    setShowPaymentModal(true)
  }
  
  const handlePaymentSuccess = async (transactionId: string) => {
    const finalOrderData = {
      ...orderData,
      product_quantity: quantity,
      transaction_id: transactionId,
      payment_status: 'completed',
      recipient_address: typeof orderData.recipient_address === 'object'
        ? {
            ...orderData.recipient_address,
            detail: orderData.recipient_address.detail + (detailAddress ? ' ' + detailAddress : '')
          }
        : orderData.recipient_address
    }
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalOrderData),
      })

      const result = await response.json()

      if (result.success) {
        alert(`주문 완료! 주문번호: ${result.order?.order_number || 'FLW-' + Date.now().toString().slice(-6)}`)
        setShowPayment(false)
        setShowPaymentModal(false)
      } else {
        alert(result.message || '주문 처리 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('주문 처리 오류:', error)
      alert('주문 처리 중 오류가 발생했습니다.')
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmotionalNavbar showCategories={true} fixed={true} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl text-gray-600">로딩 중...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmotionalNavbar showCategories={true} fixed={true} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">상품을 찾을 수 없습니다</h2>
            <p className="text-gray-600">올바른 상품 링크를 확인해주세요.</p>
          </div>
        </div>
      </div>
    )
  }

  const productImages = [
    product.image,
    product.image,
    product.image,
    product.image,
    product.image,
    product.image
  ]

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted)
  }

  const recommendedProducts = [
    { id: 'featured-2', name: '축하 개업 화환', price: 150000, image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80' },
    { id: 'featured-3', name: '생일 축하 꽃다발', price: 65000, image: 'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=300&q=80' },
    { id: 'wreath-1', name: '소중한 기억을 담은', price: 150000, image: '/꽃목걸이_근조.jpg' },
    { id: 'wreath-4', name: '새로운 출발을 축하하며', price: 180000, image: '/꽃목걸이.jpg' }
  ].filter(item => item.id !== product.id)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <EmotionalNavbar showCategories={true} fixed={true} />
      
      <div className="pt-20 border-b-2 border-green-600"></div>

      {/* PC 레이아웃 */}
      <div className="hidden lg:block">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="grid grid-cols-2">
              {/* 왼쪽: 이미지 섹션 */}
              <div className="p-8">
                <div className="bg-gray-50 rounded-lg overflow-hidden mb-4">
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-auto"
                  />
                </div>
                
                {/* 썸네일 이미지 */}
                <div className="grid grid-cols-6 gap-2">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`border-2 rounded overflow-hidden bg-gray-50 ${
                        selectedImage === img ? 'border-green-600' : 'border-gray-200'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-auto" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 오른쪽: 상품 정보 */}
              <div className="p-8 border-l">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
                <p className="text-gray-600 mb-6 text-lg">{product.description}</p>

                {/* 가격 */}
                <div className="py-4 border-t border-b mb-6">
                  {product.originalPrice && (
                    <p className="text-gray-400 line-through text-lg">
                      {product.originalPrice.toLocaleString()}원
                    </p>
                  )}
                  <p className="text-4xl font-bold text-green-600">
                    {product.price.toLocaleString()}원
                  </p>
                </div>

                {/* 꽃말 및 배송 정보 */}
                <div className="bg-amber-50 p-4 rounded-lg mb-6">
                  <div className="text-amber-700 font-medium mb-2">
                    꽃말: {product.flowerMessage || '사랑'}
                  </div>
                  <div className="text-amber-600 italic mb-3 text-sm">
                    {product.flowerMeaning || "사랑에 빠진 자는 세상에서 가장 아름다운 꽃이 된다"}
                  </div>
                  <div className="flex items-center text-green-600 font-medium">
                    <span>🚚 배송 {product.deliveryCount || 89}건 완료</span>
                  </div>
                </div>

                {/* 상품옵션 */}
                <div className="space-y-3 mb-6">
                  <select className="w-full p-3 border rounded-lg">
                    <option>상품옵션 선택</option>
                    <option>기본 구성</option>
                    <option>특대 구성 (+30,000원)</option>
                    <option>프리미엄 구성 (+50,000원)</option>
                  </select>
                  <select className="w-full p-3 border rounded-lg">
                    <option>추가구성 선택</option>
                    <option>케이크 추가 (+30,000원)</option>
                    <option>초콜릿 추가 (+20,000원)</option>
                    <option>샴페인 추가 (+50,000원)</option>
                  </select>
                </div>

                {/* 수량 선택 */}
                <div className="flex items-center justify-between py-4 mb-4">
                  <span className="text-gray-700 font-medium">수량</span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 border rounded flex items-center justify-center hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 border rounded flex items-center justify-center hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 총 상품금액 */}
                <div className="p-4 bg-gray-50 rounded-lg mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">총 상품금액</span>
                    <span className="text-2xl font-bold text-green-600">
                      {(product.price * quantity).toLocaleString()}원
                    </span>
                  </div>
                </div>

                {/* 구매 버튼 */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={toggleWishlist}
                    className={`py-3 rounded-lg font-medium border ${
                      isWishlisted 
                        ? 'bg-red-50 text-red-600 border-red-200' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 inline mr-2 ${isWishlisted ? 'fill-red-600' : ''}`} />
                    찜하기
                  </button>
                  <button
                    onClick={() => setShowPayment(true)}
                    className="py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                  >
                    구매하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 추천 상품 섹션 */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">추천 상품</h3>
          <div className="grid grid-cols-4 gap-4">
            {recommendedProducts.map((item) => (
              <a key={item.id} href={`/order?id=${item.id}`} className="group">
                <div className="aspect-square rounded-lg overflow-hidden mb-3 border">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
                <p className="text-lg font-bold text-green-600">{item.price.toLocaleString()}원</p>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* 모바일 레이아웃 - 기존 유지 */}
      <div className="lg:hidden max-w-4xl mx-auto px-4 py-6 space-y-6 mt-4">
        
        {/* Product Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-green-600">
          {/* Product Image */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            
            {/* Image Selector */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {productImages.slice(0,3).map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                    selectedImage === img ? 'border-white scale-110' : 'border-white/50 hover:border-white'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          
          {/* Product Info */}
          <div className="p-4 md:p-5">
            <h1 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="text-2xl font-bold text-green-600 mb-3">
              {product.price.toLocaleString()}원
            </div>
            <div className="flex items-center bg-green-50 rounded-lg p-2 mb-3">
              <span className="text-sm font-medium text-green-600">🚚 배송 {product.deliveryCount || 89}건 완료</span>
            </div>
            
            {/* Flower Quote */}
            <div className="bg-amber-50 rounded-lg p-2.5 mb-3">
              <div className="text-amber-700 text-xs font-medium mb-1">
                꽃말: {product.flowerMessage || '사랑'}
              </div>
              <div className="text-sm italic text-amber-600">
                {product.flowerMeaning || "사랑에 빠진 자는 세상에서 가장 아름다운 꽃이 된다"}
              </div>
            </div>
          </div>
        </div>

        {/* Membership Benefits */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-green-600">
          <div className="px-4 py-3 bg-green-50 border-b border-green-600">
            <h3 className="text-lg font-semibold text-gray-900">💎 회원 혜택</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-green-600 border-b border-green-200">🏆 등급</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-green-600 border-b border-green-200">🎁 혜택</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">일반회원</td>
                  <td className="px-4 py-3 text-sm text-gray-600">3% 기본적립</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">새싹</td>
                  <td className="px-4 py-3 text-sm text-gray-600">1% 추가할인 + 3% 기본적립</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">잎사귀</td>
                  <td className="px-4 py-3 text-sm text-gray-600">2% 추가할인 + 3% 기본적립</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">가지</td>
                  <td className="px-4 py-3 text-sm text-gray-600">3% 추가할인 + 3% 기본적립</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">꽃</td>
                  <td className="px-4 py-3 text-sm text-gray-600">4% 추가할인 + 3% 기본적립</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">나무</td>
                  <td className="px-4 py-3 text-sm text-gray-600">5% 추가할인 + 3% 기본적립</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 실제 배송 사진 갤러리 */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-green-600">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📸 오늘 배송된 꽃</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=300&q=80',
              'https://images.unsplash.com/photo-1587556439426-dfcc3adf499b?w=300&q=80',
              'https://images.unsplash.com/photo-1595429035839-c99c298ffdde?w=300&q=80',
              'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=300&q=80',
              'https://images.unsplash.com/photo-1606241057773-1e4660260192?w=300&q=80',
              'https://images.unsplash.com/photo-1609372332255-611485350f25?w=300&q=80'
            ].map((img, idx) => (
              <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                <img src={img} alt={`배송 사진 ${idx + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform" />
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">현재까지 <span className="font-bold text-green-600">2,847건</span> 안전 배송</p>
          </div>
        </div>

        {/* Recommended Products Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-green-600">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">✨ 추천 상품</h3>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-4 pb-2">
              {recommendedProducts.map((item) => (
                <a key={item.id} href={`/order?id=${item.id}`} className="flex-shrink-0 w-32 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-green-600 font-semibold">{item.price.toLocaleString()}원</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Order Bar - 모바일에만 표시 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-green-600 shadow-lg p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-lg font-semibold text-green-600">💰 총 {(product.price * quantity).toLocaleString()}원</span>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 bg-green-100 hover:bg-green-200 text-green-700 px-4 py-3 rounded-lg font-semibold border border-green-600">
              <Heart className="w-5 h-5 text-green-600" />
              <span>찜</span>
            </button>
            <button
              onClick={() => setShowPayment(true)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
              <ShoppingCart className="w-5 h-5" />
              <span>주문하기</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal with Address */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">주문 정보</h3>
            
            {/* 주문자 정보 */}
            <div className="mb-4">
              <h4 className="text-base md:text-lg font-semibold mb-2">주문자 정보</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={orderData.customer_name}
                  onChange={(e) => setOrderData({...orderData, customer_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="이름 *"
                />
                <input
                  type="tel"
                  value={orderData.customer_phone}
                  onChange={(e) => setOrderData({...orderData, customer_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="연락처 * (010-1234-5678)"
                />
              </div>
            </div>
            
            {/* 수령인 정보 */}
            <div className="mb-4">
              <h4 className="text-base md:text-lg font-semibold mb-2">수령인 정보</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={orderData.recipient_name}
                  onChange={(e) => setOrderData({...orderData, recipient_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="수령인 이름 *"
                />
                <input
                  type="tel"
                  value={orderData.recipient_phone}
                  onChange={(e) => setOrderData({...orderData, recipient_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="수령인 연락처 * (010-5678-1234)"
                />
              </div>
            </div>
            
            {/* 배송 정보 */}
            <div className="mb-4">
              <h4 className="text-base md:text-lg font-semibold mb-2">배송 정보</h4>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <input
                    type="date"
                    value={orderData.delivery_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setOrderData({...orderData, delivery_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <select
                    value={orderData.delivery_time}
                    onChange={(e) => setOrderData({...orderData, delivery_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="09:00">오전 9시</option>
                    <option value="10:00">오전 10시</option>
                    <option value="11:00">오전 11시</option>
                    <option value="12:00">오후 12시</option>
                    <option value="13:00">오후 1시</option>
                    <option value="14:00">오후 2시</option>
                    <option value="15:00">오후 3시</option>
                    <option value="16:00">오후 4시</option>
                    <option value="17:00">오후 5시</option>
                    <option value="18:00">오후 6시</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={openAddressSearch}
                disabled={!scriptLoaded}
                className="w-full mb-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
              >
                <MapPin className="w-4 h-4" />
                {scriptLoaded ? '주소 검색' : '로딩중...'}
              </button>
              
              {typeof orderData.recipient_address === 'object' && orderData.recipient_address?.detail && (
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">[{orderData.recipient_address.postal_code}]</p>
                    <p className="text-sm font-medium text-gray-900">{orderData.recipient_address.detail}</p>
                  </div>
                  <input
                    type="text"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="상세주소 입력 (동/호수 등)"
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-lg text-sm font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleOrder}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold"
              >
                주문 완료
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Modal */}
      {product && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderData={orderData}
          totalAmount={product.price * quantity}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

export default OrderPage
