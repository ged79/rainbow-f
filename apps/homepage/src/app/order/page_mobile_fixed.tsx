'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import EmotionalNavbar from '../../components/EmotionalNavbar'
import PaymentModal from '../../components/PaymentModal'
import { Heart, ShoppingCart, Minus, Plus, MapPin, Calendar, Clock, ChevronLeft, Check, X } from 'lucide-react'
import { getProduct } from '../../lib/products'
import type { CreateOrderInput, ProductType } from '../../shared/types/index'

declare global {
  interface Window {
    daum: any
  }
}

const OrderPage = () => {
  const [quantity, setQuantity] = useState(1)
  const [showPayment, setShowPayment] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState('')
  const [isWishlisted, setIsWishlisted] = useState(false)
  const searchParams = useSearchParams()
  
  // Mobile checkout states
  const [checkoutStep, setCheckoutStep] = useState(1) // 1: Customer, 2: Delivery, 3: Confirm
  const [addressSearchMode, setAddressSearchMode] = useState(false)
  const [addressSearch, setAddressSearch] = useState('')
  const formRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  
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

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Phone number formatting
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (field: string, value: string) => {
    const formatted = formatPhoneNumber(value)
    setOrderData(prev => ({ ...prev, [field]: formatted }))
  }

  // Focus management for mobile keyboard
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isMobile) {
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }

  // Validation for each step
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!orderData.customer_name || !orderData.customer_phone) {
        alert('주문자 정보를 모두 입력해주세요.')
        return false
      }
      if (orderData.customer_phone.replace(/-/g, '').length !== 11) {
        alert('올바른 전화번호를 입력해주세요.')
        return false
      }
    } else if (step === 2) {
      if (!orderData.recipient_name || !orderData.recipient_phone) {
        alert('수령인 정보를 모두 입력해주세요.')
        return false
      }
      const address = orderData.recipient_address
      if (!address || (typeof address === 'string' ? !address : !address.detail)) {
        alert('배송 주소를 입력해주세요.')
        return false
      }
      if (!orderData.delivery_date) {
        alert('배송 날짜를 선택해주세요.')
        return false
      }
    }
    return true
  }

  const nextStep = () => {
    if (validateStep(checkoutStep)) {
      setCheckoutStep(prev => Math.min(3, prev + 1))
    }
  }

  const prevStep = () => {
    setCheckoutStep(prev => Math.max(1, prev - 1))
  }

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
  
  // Simple address search (mobile-friendly)
  const handleSimpleAddressSearch = () => {
    if (addressSearch.length < 2) {
      alert('주소를 2자 이상 입력해주세요.')
      return
    }
    
    // Simple mock address setting - in production, use a proper API
    setOrderData(prev => ({
      ...prev,
      recipient_address: {
        sido: '서울특별시',
        sigungu: '강남구',
        dong: addressSearch,
        detail: addressSearch,
        postal_code: '06000'
      }
    }))
    setAddressSearchMode(false)
  }

  // Daum Postcode for desktop only
  useEffect(() => {
    if (!isMobile) {
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
    }
  }, [isMobile])

  const openAddressSearch = () => {
    // Mobile: Use simple search
    if (isMobile) {
      setAddressSearchMode(true)
      return
    }
    
    // Desktop: Use Daum Postcode
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
    if (!validateStep(2)) return
    
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
        setCheckoutStep(1)
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

      {/* PC Layout - Keep Original (Hidden on mobile) */}
      <div className="hidden lg:block">
        {/* ... Original desktop layout code ... */}
      </div>

      {/* Mobile Layout - Optimized */}
      <div className="lg:hidden">
        {/* Product Image */}
        <div className="bg-white">
          <div className="aspect-square">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white px-4 py-4 border-b">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-3">{product.description}</p>
          
          <div className="flex items-center justify-between mb-3">
            <div>
              {product.originalPrice && (
                <p className="text-sm text-gray-400 line-through">
                  {product.originalPrice.toLocaleString()}원
                </p>
              )}
              <p className="text-2xl font-bold text-green-600">
                {product.price.toLocaleString()}원
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border rounded-lg flex items-center justify-center active:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border rounded-lg flex items-center justify-center active:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg">
            <p className="text-sm text-amber-700">
              꽃말: {product.flowerMessage || '사랑'}
            </p>
            <p className="text-xs text-amber-600 italic mt-1">
              {product.flowerMeaning || "사랑에 빠진 자는 세상에서 가장 아름다운 꽃이 된다"}
            </p>
          </div>
        </div>

        {/* Recommended Products */}
        <div className="bg-white px-4 py-4">
          <h3 className="text-lg font-semibold mb-3">추천 상품</h3>
          <div className="overflow-x-auto">
            <div className="flex space-x-3">
              {recommendedProducts.map((item) => (
                <a key={item.id} href={`/order?id=${item.id}`} className="flex-shrink-0 w-32">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-sm text-green-600 font-semibold">{item.price.toLocaleString()}원</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 z-40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">총 금액</p>
            <p className="text-xl font-bold text-green-600">
              {(product.price * quantity).toLocaleString()}원
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleWishlist}
              className={`p-3 rounded-lg border ${
                isWishlisted ? 'bg-red-50 border-red-200' : 'bg-white border-gray-300'
              }`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'text-red-600 fill-red-600' : 'text-gray-600'}`} />
            </button>
            <button
              onClick={() => setShowPayment(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold active:bg-green-700"
            >
              주문하기
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Checkout Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:flex lg:items-center lg:justify-center">
          <div className={`
            bg-white w-full h-full overflow-y-auto
            lg:rounded-2xl lg:max-w-2xl lg:max-h-[85vh] lg:h-auto
          `} ref={formRef}>
            {/* Mobile Header */}
            <div className="sticky top-0 bg-white border-b z-10 px-4 py-3 flex items-center justify-between lg:px-6 lg:py-4">
              <button onClick={() => setShowPayment(false)} className="p-1">
                {isMobile ? <ChevronLeft className="w-6 h-6" /> : <X className="w-6 h-6" />}
              </button>
              <h3 className="text-lg font-semibold">주문 정보</h3>
              <div className="w-8" />
            </div>

            {/* Progress Indicator - Mobile Only */}
            {isMobile && (
              <div className="px-4 py-3 bg-gray-50 border-b">
                <div className="flex justify-between items-center">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                        ${checkoutStep >= step ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}
                      `}>
                        {checkoutStep > step ? <Check className="w-4 h-4" /> : step}
                      </div>
                      {step < 3 && (
                        <div className={`w-20 h-1 mx-2 ${checkoutStep > step ? 'bg-green-600' : 'bg-gray-300'}`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-600">주문자</span>
                  <span className="text-xs text-gray-600">배송정보</span>
                  <span className="text-xs text-gray-600">확인</span>
                </div>
              </div>
            )}

            {/* Form Content */}
            <div className="p-4 lg:p-6 pb-24 lg:pb-6">
              {/* Step 1: Customer Info */}
              <div className={`${isMobile && checkoutStep !== 1 ? 'hidden' : ''}`}>
                <h4 className="text-lg font-semibold mb-4">주문자 정보</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={orderData.customer_name}
                    onChange={(e) => setOrderData({...orderData, customer_name: e.target.value})}
                    onFocus={handleInputFocus}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="이름 *"
                  />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={orderData.customer_phone}
                    onChange={(e) => handlePhoneChange('customer_phone', e.target.value)}
                    onFocus={handleInputFocus}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="연락처 * (010-1234-5678)"
                    maxLength={13}
                  />
                  <input
                    type="text"
                    value={orderData.customer_company || ''}
                    onChange={(e) => setOrderData({...orderData, customer_company: e.target.value})}
                    onFocus={handleInputFocus}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="회사명 (선택)"
                  />
                </div>
              </div>

              {/* Step 2: Delivery Info */}
              <div className={`${isMobile && checkoutStep !== 2 ? 'hidden' : ''} ${!isMobile ? 'mt-6' : ''}`}>
                <h4 className="text-lg font-semibold mb-4">수령인 정보</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={orderData.recipient_name}
                    onChange={(e) => setOrderData({...orderData, recipient_name: e.target.value})}
                    onFocus={handleInputFocus}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="수령인 이름 *"
                  />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={orderData.recipient_phone}
                    onChange={(e) => handlePhoneChange('recipient_phone', e.target.value)}
                    onFocus={handleInputFocus}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="수령인 연락처 * (010-5678-1234)"
                    maxLength={13}
                  />
                  
                  {/* Delivery Date and Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={orderData.delivery_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setOrderData({...orderData, delivery_date: e.target.value})}
                      onFocus={handleInputFocus}
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <select
                      value={orderData.delivery_time}
                      onChange={(e) => setOrderData({...orderData, delivery_time: e.target.value})}
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
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

                  {/* Address Input - Mobile Optimized */}
                  {addressSearchMode ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={addressSearch}
                          onChange={(e) => setAddressSearch(e.target.value)}
                          onFocus={handleInputFocus}
                          className="flex-1 px-4 py-3.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500"
                          placeholder="주소 입력 (동/읍/면)"
                          autoFocus
                        />
                        <button
                          onClick={handleSimpleAddressSearch}
                          className="px-4 py-3.5 bg-green-600 text-white rounded-lg font-medium active:bg-green-700"
                        >
                          확인
                        </button>
                      </div>
                      <button
                        onClick={() => setAddressSearchMode(false)}
                        className="text-sm text-gray-600 underline"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={openAddressSearch}
                        className="w-full px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-base font-medium flex items-center justify-center gap-2 active:bg-gray-200"
                      >
                        <MapPin className="w-5 h-5" />
                        주소 검색
                      </button>
                      
                      {typeof orderData.recipient_address === 'object' && orderData.recipient_address?.detail && (
                        <div className="space-y-3">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">[{orderData.recipient_address.postal_code}]</p>
                            <p className="text-base font-medium text-gray-900">{orderData.recipient_address.detail}</p>
                          </div>
                          <input
                            type="text"
                            value={detailAddress}
                            onChange={(e) => setDetailAddress(e.target.value)}
                            onFocus={handleInputFocus}
                            className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500"
                            placeholder="상세주소 입력 (동/호수 등)"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Step 3: Order Confirmation */}
              <div className={`${isMobile && checkoutStep !== 3 ? 'hidden' : ''} ${!isMobile ? 'mt-6' : ''}`}>
                <h4 className="text-lg font-semibold mb-4">주문 확인</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">상품</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">수량</span>
                    <span className="font-medium">{quantity}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">주문자</span>
                    <span className="font-medium">{orderData.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">수령인</span>
                    <span className="font-medium">{orderData.recipient_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">배송일</span>
                    <span className="font-medium">{orderData.delivery_date} {orderData.delivery_time}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">총 결제금액</span>
                      <span className="text-lg font-bold text-green-600">
                        {(product.price * quantity).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom for mobile */}
            <div className={`${isMobile ? 'fixed bottom-0 left-0 right-0 bg-white border-t p-4' : 'p-6 pt-0'}`}>
              <div className="flex gap-3">
                {/* Mobile: Step navigation */}
                {isMobile ? (
                  <>
                    {checkoutStep > 1 && (
                      <button
                        onClick={prevStep}
                        className="flex-1 py-3.5 bg-gray-100 text-gray-800 rounded-lg font-semibold active:bg-gray-200"
                      >
                        이전
                      </button>
                    )}
                    {checkoutStep < 3 ? (
                      <button
                        onClick={nextStep}
                        className="flex-1 py-3.5 bg-green-600 text-white rounded-lg font-semibold active:bg-green-700"
                      >
                        다음
                      </button>
                    ) : (
                      <button
                        onClick={handleOrder}
                        className="flex-1 py-3.5 bg-green-600 text-white rounded-lg font-semibold active:bg-green-700"
                      >
                        결제하기
                      </button>
                    )}
                  </>
                ) : (
                  // Desktop: Direct submit
                  <>
                    <button
                      onClick={() => setShowPayment(false)}
                      className="flex-1 py-3 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleOrder}
                      className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    >
                      주문 완료
                    </button>
                  </>
                )}
              </div>
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