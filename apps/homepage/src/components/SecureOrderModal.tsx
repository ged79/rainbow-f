'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, AlertCircle, Gift } from 'lucide-react'
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk'
import { useOrderValidation } from '../hooks/useOrderValidation'
import type { CreateOrderInput, ProductType } from '../types'

interface SecureOrderModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    price: number
    image: string
  }
  quantity: number
  onSuccess: (orderId: string) => void
  funeralId?: string | null
  funeralAddress?: string
  funeralPostal?: string
}

export default function SecureOrderModal({ 
  isOpen, 
  onClose, 
  product, 
  quantity, 
  onSuccess,
  funeralId,
  funeralAddress,
  funeralPostal
}: SecureOrderModalProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [isValidating, setIsValidating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Payment Widget
  const [paymentWidget, setPaymentWidget] = useState<PaymentWidgetInstance | null>(null)
  const [widgetReady, setWidgetReady] = useState(false)
  
  // 회원 정보
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [memberInfo, setMemberInfo] = useState<any>(null)
  const [availablePoints, setAvailablePoints] = useState(0)
  const [pointsToUse, setPointsToUse] = useState(0)
  
  // Order data
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
    product_type: getProductType(product.name),
    product_name: product.name,
    product_price: product.price,
    product_quantity: quantity,
    ribbon_text: '',
    special_instructions: ''
  })
  
  const [sameAsCustomer, setSameAsCustomer] = useState(false)
  const [referrerPhone, setReferrerPhone] = useState('')
  const [validatedPrice, setValidatedPrice] = useState<number | null>(null)
  
  const { validateOrder } = useOrderValidation()

  function getProductType(name: string): ProductType {
    if (name.includes('근조')) return '근조화환'
    if (name.includes('축하')) return '축하화환'
    if (name.includes('꽃다발')) return '꽃다발'
    if (name.includes('꽃바구니')) return '꽃바구니'
    if (name.includes('동양란')) return '동양란'
    if (name.includes('서양란')) return '서양란'
    return '축하화환'
  }

  const getRibbonMessages = (type: ProductType) => {
    // Check for 영정바구니 specifically
    if (product.name.includes('영정')) {
      return ['삼가 고인의 명복을 빕니다', '깊은 애도를 표합니다', '편안히 잠드소서', '삼가 故人의 冥福을 빕니다']
    }
    
    switch(type) {
      case '근조화환':
        return ['삼가 고인의 명복을 빕니다', '깊은 애도를 표합니다', '편안히 잠드소서', '삼가 故人의 冥福을 빕니다']
      case '축하화환':
        return ['개업을 축하드립니다', '번창하시길 바랍니다', '축하합니다', '대박나세요']
      default:
        return ['축하합니다', '감사합니다', '사랑합니다']
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // 회원 정보 로드
  useEffect(() => {
    if (!isOpen) {
      // 모달 닫힐 때 상태 초기화
      setCurrentPage(1)
      setPaymentWidget(null)
      setWidgetReady(false)
      return
    }
    
    // funeral 주문은 항상 비회원
    if (funeralId) {
      setIsLoggedIn(false)
      setAvailablePoints(0)
      setPointsToUse(0)
      
      // funeral 주소 자동 입력
      if (funeralAddress && funeralPostal) {
        setOrderData(prev => ({
          ...prev,
          recipient_address: {
            sido: '충청북도',
            sigungu: '영동군',
            dong: funeralAddress,
            detail: '',
            postal_code: funeralPostal
          }
        }))
      }
      return
    }
    
    const memberSession = localStorage.getItem('flower-member')
    console.log('Login check - session:', memberSession)
    
    if (memberSession) {
      try {
        const member = JSON.parse(memberSession)
        console.log('Member:', member)
        setMemberInfo(member)
        setIsLoggedIn(true)
        setOrderData(prev => ({
          ...prev,
          customer_name: member.name || '',
          customer_phone: formatPhone(member.phone || '')
        }))
        fetchAvailablePoints(member.phone)
      } catch (e) {
        console.error('Failed to load member:', e)
      }
    }
  }, [isOpen, funeralId, funeralAddress, funeralPostal])

  // 포인트 조회
  const fetchAvailablePoints = async (phone: string) => {
    try {
      const res = await fetch(`/api/coupons/available?phone=${phone}`)
      if (res.ok) {
        const data = await res.json()
        setAvailablePoints(data.totalPoints || 0)
      }
    } catch (error) {
      console.error('Failed to fetch points:', error)
    }
  }

  // Load and render widget when on page 2
  useEffect(() => {
    if (!isOpen || currentPage !== 2) return
    
    const loadAndRenderWidget = async () => {
      try {
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
        const customerKey = `customer-${Date.now()}`
        const widget = await loadPaymentWidget(clientKey, customerKey)
        setPaymentWidget(widget)
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const finalAmount = validatedPrice || (product.price * quantity - pointsToUse)
        await widget.renderPaymentMethods('#payment-methods', { value: finalAmount })
        await widget.renderAgreement('#agreement')
        
        setWidgetReady(true)
      } catch (error) {
        console.error('Widget error:', error)
      }
    }
    
    loadAndRenderWidget()
  }, [isOpen, currentPage, validatedPrice, product.price, quantity, pointsToUse])

  // Address search
  useEffect(() => {
    if (!isOpen) return
    
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    
    if (!document.querySelector('script[src*="postcode.v2.js"]')) {
      document.head.appendChild(script)
    }
  }, [isOpen])

  const openAddressSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        setOrderData(prev => ({
          ...prev,
          recipient_address: {
            sido: data.sido,
            sigungu: data.sigungu,
            dong: data.roadAddress || data.jibunAddress,
            detail: '',
            postal_code: data.zonecode
          }
        }))
      }
    }).open()
  }

  const validatePage1 = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!orderData.customer_name) newErrors.customer_name = '주문자 이름 필수'
    if (!orderData.customer_phone || orderData.customer_phone.replace(/-/g, '').length !== 11) {
      newErrors.customer_phone = '올바른 연락처'
    }
    if (!orderData.recipient_name) newErrors.recipient_name = '수령인 이름 필수'
    if (!orderData.recipient_phone) newErrors.recipient_phone = '수령인 연락처 필수'
    if (!orderData.recipient_address.dong) newErrors.address = '주소 검색 필수'
    if (!orderData.recipient_address.detail) newErrors.detail = '상세주소 필수'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextPage = async () => {
    if (!validatePage1()) return
    
    setIsValidating(true)
    try {
      const validation = await validateOrder({
        productId: product.id,
        quantity,
        customerPhone: orderData.customer_phone,
        pointsToUse,
        referrerPhone
      })
      
      if (validation.valid) {
        setValidatedPrice(validation.finalAmount ?? null)
        setCurrentPage(2)
      } else {
        alert(validation.error || '주문 정보를 다시 확인해주세요')
      }
    } catch (error) {
      alert('검증 중 오류가 발생했습니다')
    } finally {
      setIsValidating(false)
    }
  }

  const handlePayment = async () => {
    if (!paymentWidget || !widgetReady) {
      alert('결제 시스템을 준비중입니다. 잠시 후 다시 시도해주세요.')
      return
    }
    
    setIsValidating(true)
    try {
      const res = await fetch('/api/orders/secure-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          productId: product.id,
          product_name: product.name,
          quantity,
          referrerPhone,
          pointsToUse,
          validatedPrice,
          funeral_id: funeralId
        })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '주문 생성 실패')
      }
      
      const data = await res.json()
      console.log('Order created:', data)
      
      await paymentWidget.requestPayment({
        orderId: data.paymentSessionId || data.orderNumber,
        orderName: product.name,
        customerName: orderData.customer_name,
        customerEmail: '',
        customerMobilePhone: orderData.customer_phone.replace(/-/g, ''),
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`
      })
    } catch (error: any) {
      console.error('Payment error:', error)
      alert(error.message || '결제 처리 중 오류가 발생했습니다')
      setIsValidating(false)
    }
  }

  if (!isOpen) return null

  const baseAmount = product.price * quantity
  const finalAmount = validatedPrice || (baseAmount - pointsToUse)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl">
          <div className="absolute top-4 right-4">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="pt-2 px-6 pb-6">
            {currentPage === 1 ? (
              <div className="space-y-3">
                {/* 주문자 정보 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={orderData.customer_name}
                        onChange={(e) => setOrderData(prev => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="이름"
                        className={`w-full px-3 py-2 border rounded-lg ${errors.customer_name ? 'border-red-500' : ''}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        회사명/이름/직책
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="tel"
                        value={orderData.customer_phone}
                        onChange={(e) => setOrderData(prev => ({ ...prev, customer_phone: formatPhone(e.target.value) }))}
                        placeholder="연락처"
                        className={`w-full px-3 py-2 border rounded-lg ${errors.customer_phone ? 'border-red-500' : ''}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        010-1234-5678
                      </span>
                    </div>
                  </div>
                </div>

                {/* 수령인 정보 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={orderData.recipient_name}
                        onChange={(e) => setOrderData(prev => ({ ...prev, recipient_name: e.target.value }))}
                        placeholder="이름"
                        className={`w-full px-3 py-2 border rounded-lg ${errors.recipient_name ? 'border-red-500' : ''}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        수령인 이름
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="tel"
                        value={orderData.recipient_phone}
                        onChange={(e) => setOrderData(prev => ({ ...prev, recipient_phone: formatPhone(e.target.value) }))}
                        placeholder="연락처"
                        className={`w-full px-3 py-2 border rounded-lg ${errors.recipient_phone ? 'border-red-500' : ''}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        010-1234-5678
                      </span>
                    </div>
                  </div>
                </div>

                {/* 배송 주소 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={openAddressSearch}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm w-16"
                    >
                      검색
                    </button>
                    <input
                      type="text"
                      value={orderData.recipient_address.dong}
                      placeholder="주소가 표시됩니다"
                      readOnly
                      className={`flex-1 px-3 py-2 border rounded-lg bg-gray-50 ${errors.address ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20"></div>
                    <input
                      type="text"
                      value={orderData.recipient_address.detail}
                      onChange={(e) => setOrderData(prev => ({
                        ...prev,
                        recipient_address: { ...prev.recipient_address, detail: e.target.value }
                      }))}
                      placeholder="상세주소"
                      className={`flex-1 px-3 py-2 border rounded-lg ${errors.detail ? 'border-red-500' : ''}`}
                    />
                  </div>
                </div>

                {/* 배송 일시 */}
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={orderData.delivery_date}
                    onChange={(e) => setOrderData(prev => ({ ...prev, delivery_date: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <select
                    value={orderData.delivery_time}
                    onChange={(e) => {
                      if (e.target.value === '즉시배송') {
                        const now = new Date()
                        const hours = now.getHours().toString().padStart(2, '0')
                        const minutes = now.getMinutes().toString().padStart(2, '0')
                        setOrderData(prev => ({ 
                          ...prev, 
                          delivery_time: `즉시(${hours}:${minutes})` 
                        }))
                      } else {
                        setOrderData(prev => ({ ...prev, delivery_time: e.target.value }))
                      }
                    }}
                    className="w-40 px-3 py-2 border rounded-lg"
                  >
                    <option value="즉시배송">즉시배송 (3시간 내)</option>
                    <option value="09:00">오전 9시</option>
                    <option value="10:00">오전 10시</option>
                    <option value="11:00">오전 11시</option>
                    <option value="12:00">오후 12시</option>
                    <option value="13:00">오후 1시</option>
                    <option value="14:00">오후 2시</option>
                    <option value="15:00">오후 3시</option>
                    <option value="16:00">오후 4시</option>
                    <option value="17:00">오후 5시</option>
                  </select>
                </div>

                {/* 리본 문구 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <select
                      value={orderData.ribbon_text}
                      onChange={(e) => setOrderData(prev => ({ ...prev, ribbon_text: e.target.value }))}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    >
                      <option value="">리본문구 선택하세요</option>
                      {getRibbonMessages(orderData.product_type).map((msg, idx) => (
                        <option key={idx} value={msg}>{msg}</option>
                      ))}
                      <option value="custom">직접 입력</option>
                    </select>
                  </div>
                  {orderData.ribbon_text === 'custom' && (
                    <div className="flex items-center gap-3">
                      <div className="w-20"></div>
                      <input
                        type="text"
                        placeholder="리본 문구를 입력하세요"
                        onChange={(e) => setOrderData(prev => ({ ...prev, ribbon_text: e.target.value }))}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* 추천인 */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      value={referrerPhone}
                      onChange={(e) => setReferrerPhone(formatPhone(e.target.value))}
                      placeholder="추천인 전화번호"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                      포인트 추가 적립
                    </span>
                  </div>
                </div>

                {/* 포인트 안내 정보 */}
                <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                  {isLoggedIn
                    ? `로그인: O / 포인트: ${availablePoints.toLocaleString()}원`
                    : '포인트는 회원가입후 사용가능'}
                </div>

                {/* 포인트 사용 (로그인 시에만) */}
                {isLoggedIn && availablePoints > 0 && (
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium">포인트 사용</span>
                      </div>
                      <span className="text-xs text-amber-700">사용 가능: {availablePoints.toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={pointsToUse}
                        onChange={(e) => {
                          const value = Math.min(Number(e.target.value), availablePoints, baseAmount)
                          setPointsToUse(value)
                        }}
                        placeholder="사용할 포인트"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <button
                        onClick={() => setPointsToUse(Math.min(availablePoints, baseAmount))}
                        className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
                      >
                        전액 사용
                      </button>
                    </div>
                  </div>
                )}

                {/* 금액 요약 */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span>상품 금액</span>
                      <span>{baseAmount.toLocaleString()}원</span>
                    </div>
                    {pointsToUse > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>포인트 할인</span>
                        <span>-{pointsToUse.toLocaleString()}원</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1.5 border-t">
                      <span>최종 결제 금액</span>
                      <span className="text-green-600">{(baseAmount - pointsToUse).toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">주문 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>상품</span>
                      <span>{product.name} × {quantity}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>결제 금액</span>
                      <span>{finalAmount.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">결제 수단 선택</h3>
                  <div id="payment-methods" style={{ minHeight: '200px' }} />
                  <div id="agreement" style={{ minHeight: '100px', marginTop: '20px' }} />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 p-6 border-t">
            {currentPage === 1 ? (
              <>
                <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border rounded-lg hover:bg-gray-50">
                  취소
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={isValidating}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isValidating ? '검증 중...' : '다음'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="flex-1 px-4 py-3 bg-white border rounded-lg hover:bg-gray-50"
                >
                  이전
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isValidating || !widgetReady}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isValidating ? '처리 중...' : !widgetReady ? '준비 중...' : '결제하기'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
