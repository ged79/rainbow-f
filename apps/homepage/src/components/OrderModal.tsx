'use client'

import { useState, useEffect } from 'react'
import { X, Gift, MapPin, Check, ChevronDown, ChevronUp, User, Users } from 'lucide-react'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  quantity: number
  onSubmit: (orderData: any) => void
  initialOrderData?: any
  userInfo?: any
  totalPoints?: number
}

export default function OrderModal({ 
  isOpen, 
  onClose, 
  product, 
  quantity, 
  onSubmit,
  initialOrderData = {},
  userInfo = null,
  totalPoints = 0
}: OrderModalProps) {
  // 섹션 접기/펼치기 상태
  const [sections, setSections] = useState({
    customer: true,
    recipient: true,
    delivery: true,
    ribbon: false,
    payment: true
  })

  // 주문자=수령인 동일
  const [sameAsCustomer, setSameAsCustomer] = useState(false)
  
  // 포인트 사용
  const [usePoints, setUsePoints] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  
  // 주소 검색 스크립트
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // 폼 데이터
  const [formData, setFormData] = useState({
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
    product_type: initialOrderData.product_type || '근조화환',
    product_name: product?.name || '',
    product_price: product?.price || 0,
    product_quantity: quantity,
    ribbon_text: '',
    special_instructions: '',
    referrer_phone: '',
    ...initialOrderData
  })

  // 섹션 토글
  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // 섹션 완료 체크
  const isCustomerComplete = formData.customer_name && formData.customer_phone
  const isRecipientComplete = formData.recipient_name && formData.recipient_phone
  const isDeliveryComplete = formData.recipient_address.dong && formData.recipient_address.detail
  
  // 로그인 사용자 정보 자동 입력
  useEffect(() => {
    if (userInfo && isOpen) {
      setFormData((prev: typeof formData) => ({
        ...prev,
        customer_name: userInfo.name || '',
        customer_phone: userInfo.phone || ''
      }))
    }
  }, [userInfo, isOpen])

  // 주소 검색 스크립트 로드
  useEffect(() => {
    if (!isOpen) return
    
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    script.onload = () => setScriptLoaded(true)
    
    if (!document.querySelector('script[src*="postcode"]')) {
      document.body.appendChild(script)
    } else {
      setScriptLoaded(true)
    }
  }, [isOpen])

  // 전화번호 포맷
  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // 주문자와 동일 처리
  const handleSameAsCustomer = () => {
    const newValue = !sameAsCustomer
    setSameAsCustomer(newValue)
    
    if (newValue) {
      setFormData((prev: typeof formData) => ({
        ...prev,
        recipient_name: prev.customer_name,
        recipient_phone: prev.customer_phone
      }))
      setSections(prev => ({ ...prev, recipient: false })) // 자동입력 후 접기
    }
  }

  // 포인트 사용 토글
  const handlePointToggle = () => {
    if (!userInfo || totalPoints === 0) return
    
    const newUsePoints = !usePoints
    setUsePoints(newUsePoints)
    
    if (newUsePoints) {
      const maxDiscount = Math.min(totalPoints, product.price * quantity)
      setDiscountAmount(maxDiscount)
    } else {
      setDiscountAmount(0)
    }
  }

  // 주소 검색
  const searchAddress = () => {
    if (!scriptLoaded || !window.daum) return
    
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        setFormData((prev: typeof formData) => ({
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

  // 제출
  const handleSubmit = () => {
    if (!isCustomerComplete) {
      alert('주문자 정보를 입력해주세요')
      setSections(prev => ({ ...prev, customer: true }))
      return
    }
    if (!isRecipientComplete) {
      alert('수령인 정보를 입력해주세요')
      setSections(prev => ({ ...prev, recipient: true }))
      return
    }
    if (!isDeliveryComplete) {
      alert('배송 주소를 입력해주세요')
      setSections(prev => ({ ...prev, delivery: true }))
      return
    }

    const orderData = {
      ...formData,
      total_amount: product.price * quantity - discountAmount,
      discount_amount: discountAmount,
      product_id: product.id,
      product_image: product.image_url || product.image
    }

    onSubmit(orderData)
  }

  if (!isOpen || !product) return null

  const totalAmount = product.price * quantity
  const finalAmount = totalAmount - discountAmount

  // 리본 문구 옵션 (상품 타입별)
  const ribbonOptions = {
    '근조화환': ['삼가 고인의 명복을 빕니다', '깊은 애도를 표합니다', '그리운 마음을 전합니다'],
    '축하화환': ['개업을 축하드립니다', '번창하시길 바랍니다', '대박나세요'],
    '꽃다발': ['사랑합니다', '감사합니다', '축하합니다'],
    '꽃바구니': ['빠른 쾌유를 바랍니다', '건강하세요', '감사합니다'],
    default: ['축하합니다', '감사합니다', '사랑합니다']
  }

  const getCurrentRibbonOptions = () => {
    return ribbonOptions[formData.product_type as keyof typeof ribbonOptions] || ribbonOptions.default
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">주문하기</h2>
            <p className="text-sm text-gray-500">{product.name} x {quantity}</p>
          </div>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 - 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          
          {/* 주문자 정보 섹션 */}
          <div className="bg-white border rounded-lg mb-3 overflow-hidden">
            <button
              onClick={() => toggleSection('customer')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-medium">주문자 정보</span>
                {isCustomerComplete && <Check className="w-4 h-4 text-green-600" />}
              </div>
              {sections.customer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {sections.customer && (
              <div className="px-4 pb-4 pt-2 border-t">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="이름 *"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="tel"
                    placeholder="전화번호 *"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: formatPhone(e.target.value)})}
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    maxLength={13}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 수령인 정보 섹션 */}
          <div className="bg-white border rounded-lg mb-3 overflow-hidden">
            <button
              onClick={() => toggleSection('recipient')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-medium">수령인 정보</span>
                {isRecipientComplete && <Check className="w-4 h-4 text-green-600" />}
              </div>
              {sections.recipient ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {sections.recipient && (
              <div className="px-4 pb-4 pt-2 border-t">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={sameAsCustomer}
                    onChange={handleSameAsCustomer}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm">주문자와 동일</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="이름 *"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({...formData, recipient_name: e.target.value})}
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    disabled={sameAsCustomer}
                  />
                  <input
                    type="tel"
                    placeholder="전화번호 *"
                    value={formData.recipient_phone}
                    onChange={(e) => setFormData({...formData, recipient_phone: formatPhone(e.target.value)})}
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    maxLength={13}
                    disabled={sameAsCustomer}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 배송 정보 섹션 */}
          <div className="bg-white border rounded-lg mb-3 overflow-hidden">
            <button
              onClick={() => toggleSection('delivery')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">배송 정보</span>
                {isDeliveryComplete && <Check className="w-4 h-4 text-green-600" />}
              </div>
              {sections.delivery ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {sections.delivery && (
              <div className="px-4 pb-4 pt-2 border-t space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={formData.delivery_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  />
                  <select
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({...formData, delivery_time: e.target.value})}
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  >
                    <option value="즉시배송">즉시배송</option>
                    <option value="09:00">오전 9시</option>
                    <option value="12:00">오후 12시</option>
                    <option value="15:00">오후 3시</option>
                    <option value="18:00">오후 6시</option>
                  </select>
                </div>
                
                <button
                  onClick={searchAddress}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-2 text-sm"
                >
                  <MapPin className="w-4 h-4" />
                  주소 검색
                </button>
                
                {formData.recipient_address.dong && (
                  <>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">[{formData.recipient_address.postal_code}]</p>
                      <p className="text-sm font-medium">{formData.recipient_address.dong}</p>
                    </div>
                    <input
                      type="text"
                      placeholder="상세주소 * (동/호수)"
                      value={formData.recipient_address.detail}
                      onChange={(e) => setFormData({
                        ...formData,
                        recipient_address: {
                          ...formData.recipient_address,
                          detail: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* 리본 문구 섹션 (선택) */}
          <div className="bg-white border rounded-lg mb-3 overflow-hidden">
            <button
              onClick={() => toggleSection('ribbon')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                <span className="font-medium">리본 문구</span>
                {formData.ribbon_text && (
                  <span className="text-xs text-gray-500 ml-2">{formData.ribbon_text}</span>
                )}
              </div>
              {sections.ribbon ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {sections.ribbon && (
              <div className="px-4 pb-4 pt-2 border-t space-y-3">
                <select
                  value={formData.ribbon_text}
                  onChange={(e) => setFormData({...formData, ribbon_text: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                >
                  <option value="">선택하세요</option>
                  {getCurrentRibbonOptions().map(text => (
                    <option key={text} value={text}>{text}</option>
                  ))}
                  <option value="custom">직접 입력</option>
                </select>
                
                {formData.ribbon_text === 'custom' && (
                  <input
                    type="text"
                    placeholder="리본 문구 입력"
                    onChange={(e) => setFormData({...formData, ribbon_text: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>
            )}
          </div>

          {/* 추가 옵션 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            {/* 추천인 */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">추천인 전화번호 (선택)</label>
              <input
                type="tel"
                placeholder="010-0000-0000"
                value={formData.referrer_phone}
                onChange={(e) => setFormData({...formData, referrer_phone: formatPhone(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                maxLength={13}
              />
              {formData.referrer_phone && (
                <p className="text-xs text-gray-500 mt-1">
                  구매자 5%, 추천인 3% 적립
                </p>
              )}
            </div>

            {/* 포인트 사용 */}
            {userInfo && totalPoints > 0 && (
              <label className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200 cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={handlePointToggle}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm font-medium">포인트 사용</span>
                </div>
                <span className="text-sm font-bold text-yellow-600">
                  {totalPoints.toLocaleString()}원
                </span>
              </label>
            )}
          </div>
        </div>

        {/* 하단 고정 - 금액 및 버튼 */}
        <div className="sticky bottom-0 bg-white border-t px-4 py-3">
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>상품금액</span>
              <span>{totalAmount.toLocaleString()}원</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600 mb-1">
                <span>포인트 할인</span>
                <span>-{discountAmount.toLocaleString()}원</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>총 결제금액</span>
              <span className="text-green-600">{finalAmount.toLocaleString()}원</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              결제하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
