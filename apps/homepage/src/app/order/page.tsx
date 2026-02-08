'use client'

import DeliveryExamples from '../../components/DeliveryExamples'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import EmotionalNavbar from '../../components/EmotionalNavbar'
import PaymentModal from '../../components/PaymentModal'
import SecureOrderModal from '../../components/SecureOrderModal'
import ProductImageGallery from '../../components/ProductImageGallery'
import Button from '../../components/ui/Button'
import { Heart, ShoppingCart, Minus, Plus, MapPin, Calendar, Clock, Gift, LogIn } from 'lucide-react'
import { getProductFromDB, getProduct } from '../../lib/products'
import { getProductById } from '../../services/productService'
import type { ProductType, CreateOrderInput, HomepageProduct } from '../../types'

declare global {
  interface Window {
    daum: any
  }
}

const getRibbonMessages = (productType: ProductType) => {
  switch(productType) {
    case '근조화환':
      return ['삼가 고인의 명복을 빕니다', '깊은 애도를 표합니다', '그리운 마음을 전합니다', '편안히 잠드소서']
    case '축하화환':
      return ['개업을 축하드립니다', '번창하시길 바랍니다', '대박나세요', '축하합니다']
    case '꽃다발':
      return ['사랑합니다', '감사합니다', '축하합니다', '행복하세요']
    case '꽃바구니':
      return ['빠른 쾌유를 바랍니다', '건강하세요', '감사합니다', '축하합니다']
    case '관엽화분':
      return ['새로운 시작을 응원합니다', '번창하시길 바랍니다', '행운을 빕니다', '축하합니다']
    case '서양란':
    case '동양란':
      return ['축하합니다', '감사합니다', '번영하시길 바랍니다', '사랑합니다']
    default:
      return ['축하합니다', '감사합니다', '사랑합니다', '행복하세요']
  }
}

const OrderPage = () => {
  const [quantity, setQuantity] = useState(1)
  const [showPayment, setShowPayment] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [productReviews, setProductReviews] = useState<any[]>([])
  const searchParams = useSearchParams()
  
  const autoOrder = searchParams.get('autoOrder') === 'true'
  const isFuneral = searchParams.get('funeral') === 'true'
  const funeralId = searchParams.get('funeral_id')
  const funeralRoom = searchParams.get('room')
  const deceasedName = searchParams.get('deceased')
  const funeralAddress = searchParams.get('address')
  const funeralPostal = searchParams.get('postal')
  
  const getProductType = (productName: string): ProductType => {
    if (productName.includes('근조') || productName.includes('장례')) return '근조화환'
    if (productName.includes('축하') || productName.includes('개업')) return '축하화환'
    if (productName.includes('꽃다발')) return '꽃다발'
    if (productName.includes('꽃바구니')) return '꽃바구니'
    if (productName.includes('서양란') || productName.includes('호접란')) return '서양란'
    if (productName.includes('동양란')) return '동양란'
    if (productName.includes('화분') || productName.includes('관엽')) return '관엽화분'
    return '축하화환'
  }
  
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [usePoints, setUsePoints] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  const [referrerPhone, setReferrerPhone] = useState('')
  const [showReferralBenefit, setShowReferralBenefit] = useState(false)
  const [autoReferrer, setAutoReferrer] = useState(false)
  
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (field: string, value: string) => {
    const formatted = formatPhoneNumber(value)
    setOrderData((prev: any) => ({ ...prev, [field]: formatted }))
  }
  
  const fetchProductReviews = async (productName: string) => {
    try {
      const res = await fetch(`/api/products/reviews?name=${encodeURIComponent(productName)}`)
      if (res.ok) {
        const { reviews } = await res.json()
        setProductReviews(reviews || [])
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    }
  }

  const fetchAvailablePoints = async (phone: string) => {
    try {
      console.log('[DEBUG] Fetching points for:', phone)
      const res = await fetch(`/api/coupons/available?phone=${phone}`, {
        credentials: 'include'
      })
      
      console.log('[DEBUG] API Response status:', res.status)
      
      if (res.status === 401) {
        console.log('[DEBUG] 401 - Not authenticated')
        setTotalPoints(0)
        setAvailableCoupons([])
        setIsLoggedIn(false)
        return
      }
      
      if (res.ok) {
        const data = await res.json()
        console.log('[DEBUG] Points data:', data)
        setAvailableCoupons(data.coupons || [])
        setTotalPoints(data.totalPoints || 0)
        setIsLoggedIn(true)
        console.log(`Found ${data.count} coupons, total: ${data.totalPoints} points`)
      }
    } catch (error) {
      console.error('Failed to fetch points:', error)
      setTotalPoints(0)
      setIsLoggedIn(false)
    }
  }

  const togglePoints = () => {
    if (!isLoggedIn) {
      alert('포인트는 회원만 사용할 수 있습니다. 로그인 해주세요.')
      return
    }
    
    if (totalPoints === 0) return
    
    const newUsePoints = !usePoints
    setUsePoints(newUsePoints)
    
    if (newUsePoints && product) {
      const baseAmount = product.price * quantity
      const maxDiscount = Math.min(totalPoints, baseAmount)
      setDiscountAmount(maxDiscount)
    } else {
      setDiscountAmount(0)
    }
  }

  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [detailAddress, setDetailAddress] = useState('')
  
  const [orderData, setOrderData] = useState<CreateOrderInput>({
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
    delivery_time: '즉시배송',
    product_type: '근조화환',
    product_name: '',
    product_price: 0,
    product_quantity: 1,
    ribbon_text: '',
    special_instructions: '',
    receiver_store_id: undefined,
    additional_fee: 0,
    additional_fee_reason: ''
  })

  useEffect(() => {
    const memberSession = localStorage.getItem('flower-member')
    if (memberSession) {
      try {
        const member = JSON.parse(memberSession)
        if (member.phone) {
          setIsLoggedIn(true)
          fetchAvailablePoints(member.phone)
        }
      } catch (e) {
        console.error('Failed to parse member session:', e)
        setIsLoggedIn(false)
      }
    } else {
      setIsLoggedIn(false)
    }
    
    const savedReferrer = localStorage.getItem('referrer_phone')
    if (savedReferrer) {
      setReferrerPhone(savedReferrer)
      setShowReferralBenefit(true)
      setAutoReferrer(true)
      console.log('Auto-loaded referrer:', savedReferrer)
    }
  }, [])

  useEffect(() => {
    const loadProduct = async () => {
      const directOrderData = localStorage.getItem('directOrder')
      if (directOrderData) {
        try {
          const orderProduct = JSON.parse(directOrderData)
          console.log('Direct order product:', orderProduct)
          setProduct(orderProduct)
          setQuantity(orderProduct.quantity || 1)
          
          setOrderData(prev => ({
            ...prev,
            product_name: orderProduct.name,
            product_price: orderProduct.price,
            product_type: getProductType(orderProduct.name),
            special_instructions: orderProduct.message || ''
          }))
          
          fetchProductReviews(orderProduct.name)
          localStorage.removeItem('directOrder')
          setIsLoading(false)
          return
        } catch (error) {
          console.error('Failed to parse directOrder:', error)
        }
      }
      
      const productId = searchParams.get('id')
      if (productId) {
        try {
          let foundProduct = null
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)
          
          if (isUUID) {
            foundProduct = await getProductById(productId)
          } else {
            const staticProduct = getProduct(productId)
            if (staticProduct) {
              foundProduct = staticProduct
            }
          }
          
          if (foundProduct) {
            console.log('Product loaded from ID:', foundProduct)
            setProduct(foundProduct)
            
            const productType = getProductType(foundProduct.name)
            const initialOrderData: any = {
              ...orderData,
              product_name: foundProduct.name,
              product_price: foundProduct.price,
              product_type: productType
            }
            
            if (isFuneral && deceasedName) {
              initialOrderData.recipient_name = deceasedName
              initialOrderData.special_instructions = funeralRoom ? `${funeralRoom} 배송` : ''
              if (productType === '근조화환') {
                initialOrderData.ribbon_text = '삼가 고인의 명복을 빕니다'
              }
            }
            
            setOrderData(initialOrderData)
            fetchProductReviews(foundProduct.name)
          } else {
            console.error('Product not found:', productId)
          }
        } catch (error) {
          console.error('Failed to load product:', error)
        }
      } else {
        console.error('No product ID provided')
      }
      setIsLoading(false)
    }
    
    loadProduct()
  }, [searchParams])
  
  useEffect(() => {
    if (autoOrder && product && !isLoading) {
      // autoOrder일 때는 SecureOrderModal을 바로 열기
      setTimeout(() => {
        setShowPayment(true)
      }, 300)
    }
  }, [autoOrder, product, isLoading])
  
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
        const sido = data.sido
        const sigungu = data.sigungu
        const dong = data.bname || data.dong
        const roadAddress = data.roadAddress || data.jibunAddress
        const postal_code = data.zonecode
        
        setOrderData({
          ...orderData,
          recipient_address: {
            sido,
            sigungu,
            dong: roadAddress,
            detail: '',
            postal_code
          }
        })
      }
    }).open()
  }

  const handleOrder = async () => {
    if (!product || !product.name) {
      alert('상품 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }
    if (!orderData.customer_name || !orderData.customer_phone) {
      alert('주문자 정보를 입력해주세요.')
      return
    }
    if (!orderData.recipient_name || !orderData.recipient_phone) {
      alert('수령인 정보를 입력해주세요.')
      return
    }
    
    const address = orderData.recipient_address
    if (!address || (typeof address === 'object' && !address.dong)) {
      alert('배송 주소를 입력해주세요.')
      return
    }
    
    if (!detailAddress || detailAddress.trim() === '') {
      alert('상세주소를 입력해주세요. (예: 101동 202호, 2층, ○○아파트 등)')
      return
    }
    
    if (orderData.delivery_time === '즉시배송') {
      const now = new Date()
      const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}))
      orderData.delivery_date = koreaTime.toISOString().split('T')[0]
      const hours = koreaTime.getHours().toString().padStart(2, '0')
      const minutes = koreaTime.getMinutes().toString().padStart(2, '0')
      orderData.delivery_time = `${hours}:${minutes}`
    }
    
    if (!orderData.delivery_date) {
      alert('배송 날짜를 선택해주세요.')
      return
    }
    
    console.log('Order submitted with discount:', discountAmount, 'usePoints:', usePoints)
    
    const pendingOrderData = {
      ...orderData,
      recipient_address: {
        ...orderData.recipient_address,
        detail: detailAddress
      },
      product_id: product.id,
      product_image: product.image_url || product.image || '/placeholder.jpg',
      product_quantity: quantity,
      product_price: product.price,
      product_name: product.name,
      total_amount: product.price * quantity - discountAmount,
      discount_amount: discountAmount,
      referrerPhone: referrerPhone
    }

    console.log('[DEBUG pendingOrder]', {
      product_name: product.name,
      product_image: product.image_url || product.image,
      product_id: product.id
    })
    
    localStorage.setItem('pendingOrder', JSON.stringify(pendingOrderData))
    setShowPaymentModal(true)
  }
  
  const handlePaymentSuccess = async (transactionId: string) => {
    console.log('Payment success, preparing order with discount:', discountAmount)
    
    const fullAddress = {
      ...orderData.recipient_address,
      detail: detailAddress
    }
    
    const finalOrderData = {
      ...orderData,
      product_quantity: quantity,
      transaction_id: transactionId,
      payment_status: 'completed',
      referrerPhone: referrerPhone,
      customerPhone: orderData.customer_phone,
      customer_phone: orderData.customer_phone,
      customerName: orderData.customer_name,
      customer_name: orderData.customer_name,
      recipientName: orderData.recipient_name,
      recipientPhone: orderData.recipient_phone,
      deliveryAddress: fullAddress,
      deliveryDate: orderData.delivery_date,
      deliveryTime: orderData.delivery_time,
      message: orderData.special_instructions,
      ribbonMessage: orderData.ribbon_text || '',
      totalAmount: product.price * quantity - discountAmount,
      total_amount: product.price * quantity - discountAmount,
      discountAmount: discountAmount,
      discount_amount: discountAmount,
      funeral_id: funeralId || null,
      items: [{
        productId: product.id,
        productName: product.name,
        productImage: product.image_url || product.image || '/placeholder.jpg',
        price: product.price,
        quantity: quantity
      }]
    }
    
    console.log('[DEBUG finalOrderData]', {
      customer_phone: finalOrderData.customer_phone,
      discount_amount: finalOrderData.discount_amount,
      items: finalOrderData.items,
      product_name_from_items: finalOrderData.items[0]?.productName,
      product_image_from_items: finalOrderData.items[0]?.productImage
    })
    
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
        alert(`주문 완료! 주문번호: ${result.orderNumber || 'FLW-' + Date.now().toString().slice(-6)}`)
        setShowPayment(false)
        setShowPaymentModal(false)
        window.location.href = '/'
      } else {
        alert(result.message || '주문 처리 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('주문 처리 오류:', error)
      alert('주문 처리 중 오류가 발생했습니다.')
    }
  }
  
  if (isLoading) {
    if (autoOrder) {
      return (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl text-gray-600">결제 준비중...</h2>
          </div>
        </div>
      )
    }
    
    return (
      <div className="min-h-screen bg-gray-50">
        <EmotionalNavbar showCategories={true} fixed={true} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl text-gray-600">상품 정보를 불러오는 중...</h2>
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
          <p className="text-gray-600 mb-4">올바른 상품 링크를 확인해주세요.</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => window.location.href = '/'}
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  )
}

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
    {!autoOrder && <EmotionalNavbar showCategories={true} fixed={true} />}
    {!autoOrder && <div className="pt-20 border-b-2 border-green-600"></div>}

    {!autoOrder && (
      <>
        <div className="hidden lg:block">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="grid grid-cols-2">
                <div className="p-8">
                  <ProductImageGallery 
                    images={{
                      main: product.image_url || product.image || '/placeholder.jpg',
                      left45: product.image_left45,
                      right45: product.image_right45
                    }}
                    productName={product.name}
                  />
                </div>
                <div className="p-8 border-l">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
                <p className="text-gray-600 mb-6 text-lg">{product.description}</p>

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

                {product.description && (
                  <div className="bg-amber-50 p-4 rounded-lg mb-6">
                    <div className="text-amber-700 font-medium mb-2">
                      상품 설명
                    </div>
                    <div className="text-amber-600 text-sm">
                      {product.description}
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="text-blue-700 font-semibold mb-3">
                    📦 배송 안내
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-600 text-lg">🚚</span>
                      <div>
                        <p className="text-sm font-medium text-blue-900">당일배송</p>
                        <p className="text-sm text-blue-700">주문 후 3~6시간 이내 배송</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-blue-600 text-lg">⏰</span>
                      <div>
                        <p className="text-sm font-medium text-blue-900">예약배송</p>
                        <p className="text-sm text-blue-700">지정 시간으로부터 3~6시간 이내 배송</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-blue-600 text-lg">📅</span>
                      <div>
                        <p className="text-sm font-medium text-blue-900">최대 배송기간</p>
                        <p className="text-sm text-blue-700">1일 이내 배송 (예약 주문 시점으로부터 1일이내)</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-blue-200">
                      <p className="text-sm text-blue-600">
                        ※ 지역 및 날씨에 따라 배송시간이 다소 변동될 수 있습니다
                      </p>
                    </div>
                  </div>
                </div>

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

                <div className="p-4 bg-gray-50 rounded-lg mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">상품금액</span>
                    <span className="text-gray-800">
                      {(product.price * quantity).toLocaleString()}원
                    </span>
                  </div>
                  {usePoints && discountAmount > 0 && (
                    <div className="flex justify-between items-center mb-2 text-red-600">
                      <span>포인트 할인</span>
                      <span>-{discountAmount.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-lg font-medium">총 결제금액</span>
                    <span className="text-2xl font-bold text-green-600">
                      {(product.price * quantity - discountAmount).toLocaleString()}원
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="ghost" size="md" onClick={toggleWishlist}>
                    <Heart className={`w-5 h-5 mr-2 ${isWishlisted ? 'fill-red-600' : ''}`} />
                    찜하기
                  </Button>
                  <Button variant="primary" size="md" onClick={() => setShowPayment(true)}>
                    구매하기
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {productReviews.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm mt-6">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">구매 리뷰 ({productReviews.length})</h3>
                <div className="space-y-4">
                  {productReviews.map((review: any, idx: number) => (
                    <div key={idx} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      {review.review && (
                        <p className="text-gray-700">{review.review}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          <DeliveryExamples category={product?.category} />
        </div>
      </div>

      <div className="lg:hidden max-w-4xl mx-auto px-4 py-6 space-y-6 mt-4">
        <div className="bg-white shadow-lg overflow-hidden">
          <div className="p-4">
            <ProductImageGallery 
              images={{
                main: product.image_url || product.image || '/placeholder.jpg',
                left45: product.image_left45,
                right45: product.image_right45
              }}
              productName={product.name}
            />
          </div>
          
          <div className="p-4">
            <h1 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="text-2xl font-bold text-green-600 mb-3">
              {product.price.toLocaleString()}원
            </div>
            
            {product.description && (
              <div className="bg-amber-50 rounded-lg p-2 mb-2">
                <div className="text-amber-700 text-xs font-medium mb-1">
                  상품 설명
                </div>
                <div className="text-xs text-amber-600">
                  {product.description}
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <div className="text-blue-700 text-xs font-semibold mb-2">
                📦 배송 안내
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-xs">🚚</span>
                  <div>
                    <p className="text-xs font-medium text-blue-900">당일배송</p>
                    <p className="text-xs text-blue-700">주문 후 3~6시간 이내 배송</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-xs">⏰</span>
                  <div>
                    <p className="text-xs font-medium text-blue-900">예약배송</p>
                    <p className="text-xs text-blue-700">지정 시간으로부터 3~6시간 이내 배송</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-xs">📅</span>
                  <div>
                    <p className="text-xs font-medium text-blue-900">최대 배송기간</p>
                    <p className="text-xs text-blue-700">1일 이내 배송 (예약 주문 시점으로부터 1일이내)</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-blue-200">
                  <p className="text-xs text-blue-600">
                    ※ 지역 및 날씨에 따라 배송시간이 다소 변동될 수 있습니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-green-50">
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
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">비회원</td>
                  <td className="px-4 py-3 text-sm text-gray-600">3% 기본적립</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">회원</td>
                  <td className="px-4 py-3 text-sm text-gray-600">5% 적립 + 포인트 사용</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">추천인</td>
                  <td className="px-4 py-3 text-sm text-gray-600">3% 추가 적립</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white shadow-sm p-6">
          <DeliveryExamples category={product?.category} />
        </div>
        
        {productReviews.length > 0 && (
          <div className="bg-white shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">구매 리뷰 ({productReviews.length})</h3>
            <div className="space-y-3">
              {productReviews.slice(0, 5).map((review: any, idx: number) => (
                <div key={idx} className="border-b pb-3 last:border-b-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  {review.review && (
                    <p className="text-sm text-gray-700">{review.review}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">총 금액</p>
            <p className="text-xl font-bold text-gray-900">
              {usePoints && discountAmount > 0 ? (
                <>
                  <span className="text-sm line-through text-gray-400">{(product.price * quantity).toLocaleString()}</span>
                  <span className="ml-2">{(product.price * quantity - discountAmount).toLocaleString()}원</span>
                </>
              ) : (
                `${(product.price * quantity).toLocaleString()}원`
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="md"
              onClick={toggleWishlist}
              className="p-3"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowPayment(true)}
              className="px-8"
            >
              주문하기
            </Button>
          </div>
        </div>
      </div>

      {/* 기존 showPayment 모달 제거 - SecureOrderModal로 대체 */}
      {false && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">주문 정보 입력</h3>
            
            <div className="mb-4">
              <h4 className="text-base md:text-lg font-semibold mb-2">주문자 정보</h4>
              <div className="grid grid-cols-2 gap-2">
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
                  onChange={(e) => handlePhoneChange('customer_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="연락처 * (010-1234-5678)"
                  maxLength={13}
                />
              </div>
            </div>
            
            {/* 포인트 사용 */}
            {isLoggedIn && totalPoints > 0 && (
              <label className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200 cursor-pointer mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={togglePoints}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <Gift className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium">포인트 사용</span>
                </div>
                <span className="text-sm font-bold text-orange-600">
                  {totalPoints.toLocaleString()}원 사용 가능
                </span>
              </label>
            )}
            
            {/* 추천인 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추천인 전화번호 (선택)
              </label>
              <input
                type="tel"
                placeholder="010-0000-0000"
                value={referrerPhone}
                onChange={(e) => setReferrerPhone(formatPhoneNumber(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                maxLength={13}
              />
            </div>
            
            <div className="mb-4">
              <h4 className="text-base md:text-lg font-semibold mb-2">수령인 정보</h4>
              <div className="grid grid-cols-2 gap-2">
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
                  onChange={(e) => handlePhoneChange('recipient_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="수령인 연락처 * (010-5678-1234)"
                  maxLength={13}
                />
              </div>
            </div>
            
            {/* 리본 문구 */}
            <div className="mb-4">
              <h4 className="text-base md:text-lg font-semibold mb-2">리본 문구</h4>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {getRibbonMessages(orderData.product_type).map((message, index) => (
                    <label key={index} className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="ribbon"
                        value={message}
                        checked={orderData.ribbon_text === message}
                        onChange={(e) => setOrderData({...orderData, ribbon_text: e.target.value})}
                        className="mr-2"
                      />
                      <span className="text-xs">{message}</span>
                    </label>
                  ))}
                </div>
                <input
                  type="text"
                  value={orderData.ribbon_text === '' || !getRibbonMessages(orderData.product_type).includes(orderData.ribbon_text || '') ? orderData.ribbon_text || '' : ''}
                  onChange={(e) => setOrderData({...orderData, ribbon_text: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="직접 입력"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-base md:text-lg font-semibold mb-2">배송 정보</h4>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="date"
                  value={orderData.delivery_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setOrderData({...orderData, delivery_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <select
                  value={orderData.delivery_time}
                  onChange={(e) => setOrderData({...orderData, delivery_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="즉시배송">즉시배송 (3시간 내)</option>
                  <option value="09:00">오전 9시</option>
                  <option value="12:00">오후 12시</option>
                  <option value="15:00">오후 3시</option>
                  <option value="18:00">오후 6시</option>
                </select>
              </div>
              <button
                onClick={openAddressSearch}
                disabled={!scriptLoaded}
                className="w-full mb-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
              >
                <MapPin className="w-4 h-4" />
                {scriptLoaded ? '주소 검색' : '로딩중...'}
              </button>
              
              {typeof orderData.recipient_address === 'object' && orderData.recipient_address?.dong && (
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">[{orderData.recipient_address.postal_code}]</p>
                    <p className="text-sm font-medium text-gray-900">{orderData.recipient_address.dong}</p>
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
            
            {/* 금액 정보 */}
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">상품금액</span>
                <span className="text-gray-800">
                  {(product.price * quantity).toLocaleString()}원
                </span>
              </div>
              {usePoints && discountAmount > 0 && (
                <div className="flex justify-between items-center mb-2 text-red-600">
                  <span>포인트 할인</span>
                  <span>-{discountAmount.toLocaleString()}원</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-medium">총 결제금액</span>
                <span className="text-2xl font-bold text-green-600">
                  {(product.price * quantity - discountAmount).toLocaleString()}원
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowPayment(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleOrder}
                className="flex-1"
              >
                주문 완료
              </Button>
            </div>
          </div>
        </div>
      )}
      
      </>
    )}
      
      {product && (
        <SecureOrderModal
          isOpen={showPayment}
          onClose={() => {
            console.log('Modal closing with product:', product)
            setShowPayment(false)
          }}
          product={{
            id: product.id || product.product_id || '',
            name: product.name || product.display_name || '',
            price: product.price || product.customer_price || 0,
            image: product.image || product.image_url || '/placeholder.jpg'
          }}
          quantity={quantity}
          onSuccess={handlePaymentSuccess}
          funeralId={funeralId}
          funeralAddress={funeralAddress || undefined}
          funeralPostal={funeralPostal || undefined}
        />
      )}
    </div>
  )
}

export default OrderPage
