'use client'

import { useState, useEffect, useRef } from 'react'
import { loadPaymentWidget, ANONYMOUS } from '@tosspayments/payment-widget-sdk'
import { X, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react'
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
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
  const [isWidgetReady, setIsWidgetReady] = useState(false)

  const paymentWidgetRef = useRef<any>(null)
  const paymentMethodsWidgetRef = useRef<any>(null)

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
    if (product.name.includes('영정')) {
      return ['삼가 고인의 명복을 빕니다', '깊은 애도를 표합니다', '편안히 잠드소서']
    }
    
    switch(type) {
      case '근조화환':
        return ['삼가 고인의 명복을 빕니다', '깊은 애도를 표합니다', '편안히 잠드소서']
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
      setCurrentPage(1)
      return
    }
    
    if (funeralId) {
      setIsLoggedIn(false)
      setAvailablePoints(0)
      setPointsToUse(0)
      
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
    
    if (memberSession) {
      try {
        const member = JSON.parse(memberSession)
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

  // 주소 검색
  useEffect(() => {
    if (!isOpen) return
    
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    
    if (!document.querySelector('script[src*="postcode.v2.js"]')) {
      document.head.appendChild(script)
    }
  }, [isOpen])

  // 결제 위젯 로드 (2단계 진입 시)
  useEffect(() => {
    if (currentPage !== 2) {
      setIsWidgetReady(false)
      return
    }

    const finalAmount = validatedPrice || (product.price * quantity - pointsToUse)

    const initWidget = async () => {
      try {
        const clientKey = process.env.NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY || 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm'
        const customerKey = orderData.customer_phone?.replace(/[^0-9]/g, '') || ANONYMOUS

        const paymentWidget = await loadPaymentWidget(clientKey, customerKey)
        paymentWidgetRef.current = paymentWidget

        const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
          '#payment-widget',
          finalAmount
        )
        paymentMethodsWidgetRef.current = paymentMethodsWidget

        paymentWidget.renderAgreement('#agreement')
        setIsWidgetReady(true)
      } catch (error) {
        console.error('Failed to load payment widget:', error)
      }
    }

    initWidget()
  }, [currentPage])

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
    
    setIsProcessing(true)
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
      setIsProcessing(false)
    }
  }

  const handlePayment = async () => {
    if (!paymentWidgetRef.current) {
      alert('결제 위젯을 로드하는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setIsProcessing(true)
    try {
      // 주문 생성
      const orderRes = await fetch('/api/orders/secure-create', {
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

      if (!orderRes.ok) {
        const error = await orderRes.json()
        throw new Error(error.error || '주문 생성 실패')
      }

      const orderData_response = await orderRes.json()
      const orderId = orderData_response.paymentSessionId || orderData_response.orderNumber

      // 결제 위젯으로 결제 요청
      await paymentWidgetRef.current.requestPayment({
        orderId: String(orderId),
        orderName: product.name,
        customerName: orderData.customer_name || 'Customer',
        customerMobilePhone: orderData.customer_phone?.replace(/[^0-9]/g, ''),
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (error) {
      console.error('Payment error:', error)
      alert(error instanceof Error ? error.message : '결제 요청 중 오류가 발생했습니다')
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {currentPage === 1 ? '주문 정보' : '결제 확인'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* 진행도 */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold">
                {currentPage === 1 ? '1단계: 주문 정보' : '2단계: 결제'}
              </span>
              <span className="text-sm text-gray-500">{currentPage}/2</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentPage / 2) * 100}%` }}
              />
            </div>
          </div>

          {/* Page 1: 주문 정보 */}
          {currentPage === 1 && (
            <div className="space-y-6">
              {/* 주문자 정보 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">주문자 정보</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">이름 *</label>
                    <input
                      type="text"
                      value={orderData.customer_name}
                      onChange={(e) => setOrderData(prev => ({ ...prev, customer_name: e.target.value }))}
                      className={`w-full border rounded p-2 ${errors.customer_name ? 'border-red-500' : ''}`}
                      placeholder="이름"
                    />
                    {errors.customer_name && <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">연락처 *</label>
                    <input
                      type="tel"
                      value={orderData.customer_phone}
                      onChange={(e) => setOrderData(prev => ({ ...prev, customer_phone: formatPhone(e.target.value) }))}
                      className={`w-full border rounded p-2 ${errors.customer_phone ? 'border-red-500' : ''}`}
                      placeholder="010-0000-0000"
                    />
                    {errors.customer_phone && <p className="text-red-500 text-sm mt-1">{errors.customer_phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">회사명</label>
                    <input
                      type="text"
                      value={orderData.customer_company}
                      onChange={(e) => setOrderData(prev => ({ ...prev, customer_company: e.target.value }))}
                      className="w-full border rounded p-2"
                      placeholder="회사명 (선택)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">특수요청사항</label>
                    <textarea
                      value={orderData.customer_memo}
                      onChange={(e) => setOrderData(prev => ({ ...prev, customer_memo: e.target.value }))}
                      className="w-full border rounded p-2"
                      placeholder="추가 요청사항을 입력해주세요"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">추천인 전화번호</label>
                    <input
                      type="tel"
                      value={referrerPhone}
                      onChange={(e) => setReferrerPhone(formatPhone(e.target.value))}
                      className="w-full border rounded p-2"
                      placeholder="010-0000-0000 (선택)"
                    />
                    <p className="text-xs text-green-600 mt-1">추천인 입력 시 포인트 5% 적립 (일반 3%)</p>
                  </div>
                </div>
              </div>

              {/* 수령인 정보 */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">수령인 정보</h3>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sameAsCustomer}
                      onChange={(e) => {
                        setSameAsCustomer(e.target.checked)
                        if (e.target.checked) {
                          setOrderData(prev => ({
                            ...prev,
                            recipient_name: prev.customer_name,
                            recipient_phone: prev.customer_phone
                          }))
                        }
                      }}
                    />
                    <span className="text-sm">주문자와 동일</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">이름 *</label>
                    <input
                      type="text"
                      value={orderData.recipient_name}
                      onChange={(e) => setOrderData(prev => ({ ...prev, recipient_name: e.target.value }))}
                      className={`w-full border rounded p-2 ${errors.recipient_name ? 'border-red-500' : ''}`}
                      placeholder="수령인 이름"
                    />
                    {errors.recipient_name && <p className="text-red-500 text-sm mt-1">{errors.recipient_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">연락처 *</label>
                    <input
                      type="tel"
                      value={orderData.recipient_phone}
                      onChange={(e) => setOrderData(prev => ({ ...prev, recipient_phone: formatPhone(e.target.value) }))}
                      className={`w-full border rounded p-2 ${errors.recipient_phone ? 'border-red-500' : ''}`}
                      placeholder="010-0000-0000"
                    />
                    {errors.recipient_phone && <p className="text-red-500 text-sm mt-1">{errors.recipient_phone}</p>}
                  </div>
                </div>
              </div>

              {/* 배송 정보 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">배송 정보</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">주소 *</label>
                    <button
                      onClick={openAddressSearch}
                      className="w-full border border-blue-500 text-blue-500 rounded p-2 hover:bg-blue-50"
                    >
                      {orderData.recipient_address.dong ? 
                        `${orderData.recipient_address.sido} ${orderData.recipient_address.sigungu} ${orderData.recipient_address.dong}` : 
                        '주소 검색'}
                    </button>
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">상세주소 *</label>
                    <input
                      type="text"
                      value={orderData.recipient_address.detail}
                      onChange={(e) => setOrderData(prev => ({
                        ...prev,
                        recipient_address: { ...prev.recipient_address, detail: e.target.value }
                      }))}
                      className={`w-full border rounded p-2 ${errors.detail ? 'border-red-500' : ''}`}
                      placeholder="상세주소"
                    />
                    {errors.detail && <p className="text-red-500 text-sm mt-1">{errors.detail}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">배송날짜</label>
                    <input
                      type="date"
                      value={orderData.delivery_date}
                      onChange={(e) => setOrderData(prev => ({ ...prev, delivery_date: e.target.value }))}
                      className="w-full border rounded p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">배송시간</label>
                    <select
                      value={orderData.delivery_time}
                      onChange={(e) => setOrderData(prev => ({ ...prev, delivery_time: e.target.value }))}
                      className="w-full border rounded p-2"
                    >
                      <option>즉시배송</option>
                      <option>오전 (10:00~12:00)</option>
                      <option>오후 (14:00~18:00)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 리본 문구 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">리본 문구</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {getRibbonMessages(orderData.product_type as ProductType).map((msg) => (
                    <button
                      key={msg}
                      onClick={() => setOrderData(prev => ({ ...prev, ribbon_text: msg }))}
                      className={`p-2 text-sm border rounded ${
                        orderData.ribbon_text === msg 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {msg}
                    </button>
                  ))}
                </div>
                <textarea
                  value={orderData.ribbon_text}
                  onChange={(e) => setOrderData(prev => ({ ...prev, ribbon_text: e.target.value }))}
                  className="w-full border rounded p-2"
                  placeholder="또는 직접 입력 (20자 이내)"
                  maxLength={20}
                  rows={2}
                />
              </div>

              {/* 포인트 */}
              {availablePoints > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">보유 포인트: {availablePoints.toLocaleString()}P</h3>
                  <div>
                    <label className="block text-sm font-medium mb-2">사용할 포인트</label>
                    <input
                      type="number"
                      value={pointsToUse}
                      onChange={(e) => setPointsToUse(Math.min(parseInt(e.target.value) || 0, availablePoints))}
                      max={availablePoints}
                      className="w-full border rounded p-2"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      최대 {availablePoints.toLocaleString()}P 사용 가능
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Page 2: 결제 확인 */}
          {currentPage === 2 && (
            <div className="space-y-6">
              {/* 주문 요약 */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-4">주문 요약</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>상품명</span>
                    <span className="font-medium">{orderData.product_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>수량</span>
                    <span className="font-medium">{quantity}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>단가</span>
                    <span className="font-medium">₩{(product.price).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                    <span>소계</span>
                    <span>₩{(product.price * quantity).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 가격 정보 */}
              <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>상품 금액</span>
                    <span>₩{(product.price * quantity).toLocaleString()}</span>
                  </div>
                  {pointsToUse > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>포인트 할인</span>
                      <span>-₩{pointsToUse.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-blue-300 pt-3 flex justify-between text-lg font-bold text-blue-600">
                    <span>🔴 최종 결제액</span>
                    <span>₩{((validatedPrice || (product.price * quantity - pointsToUse))).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 배송 정보 확인 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">배송 정보 확인</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">수령인</span>
                    <span className="font-medium">{orderData.recipient_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">연락처</span>
                    <span className="font-medium">{orderData.recipient_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">주소</span>
                    <span className="font-medium text-right">
                      {orderData.recipient_address.dong} {orderData.recipient_address.detail}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">배송일</span>
                    <span className="font-medium">{orderData.delivery_date}</span>
                  </div>
                </div>
              </div>

              {/* 결제 수단 선택 (토스 결제 위젯) */}
              <div className="border rounded-lg overflow-hidden">
                <div id="payment-widget" className="w-full" />
              </div>

              {/* 이용약관 (토스 위젯) */}
              <div id="agreement" className="w-full" />

              {!isWidgetReady && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600 mt-2">결제 위젯 로드 중...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="sticky bottom-0 bg-white border-t p-6 flex gap-3">
          {currentPage === 2 && (
            <button
              onClick={() => setCurrentPage(1)}
              disabled={isProcessing}
              className="flex-1 border border-gray-300 rounded-lg py-3 hover:bg-gray-50 disabled:opacity-50"
            >
              이전
            </button>
          )}
          
          <button
            onClick={currentPage === 1 ? handleNextPage : handlePayment}
            disabled={isProcessing || (currentPage === 2 && !isWidgetReady)}
            className="flex-1 bg-blue-600 text-white rounded-lg py-3 hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {isProcessing ? '처리 중...' : currentPage === 1 ? '다음' : isWidgetReady ? '결제하기' : '위젯 로드 중...'}
          </button>
        </div>
      </div>
    </div>
  )
}
