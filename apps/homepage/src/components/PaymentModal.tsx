'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, Building2, Landmark } from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  orderData: any
  totalAmount: number
  discountAmount?: number
  onSuccess: (transactionId: string) => void
}

declare global {
  interface Window {
    TossPayments: any
  }
}

type PaymentMethod = '카드' | '계좌이체' | '가상계좌'

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  orderData, 
  totalAmount, 
  discountAmount, 
  onSuccess 
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('카드')

  useEffect(() => {
    if (!isOpen) return

    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment'
    script.async = true
    script.onload = () => {
      console.log('[TOSS] SDK loaded')
      setIsReady(true)
    }
    script.onerror = () => setError('SDK 로드 실패')
    
    if (!document.querySelector('script[src="https://js.tosspayments.com/v1/payment"]')) {
      document.head.appendChild(script)
    } else {
      setIsReady(true)
    }
  }, [isOpen])

  const handlePayment = async () => {
    if (!isReady) {
      setError('결제 시스템 준비중')
      return
    }

    if (!selectedMethod) {
      setError('결제 수단을 선택해주세요')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const pendingOrder = localStorage.getItem('pendingOrder')
      if (!pendingOrder) {
        throw new Error('주문 정보 없음')
      }

      const parsedOrder = JSON.parse(pendingOrder)
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_yL0qZ4G1VOdm2dzkPzqoroWb2MQY'
      const tossPayments = window.TossPayments(clientKey)
      
      // 공통 파라미터
      const paymentOptions: any = {
        amount: totalAmount,
        orderId,
        orderName: parsedOrder.product_name || '꽃 주문',
        customerName: parsedOrder.customer_name,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      }

      // 가상계좌 추가 파라미터
      if (selectedMethod === '가상계좌') {
        paymentOptions.validHours = 72
        if (parsedOrder.customer_phone) {
          // 숫자만 추출 (하이픈 제거)
          paymentOptions.customerMobilePhone = parsedOrder.customer_phone.replace(/[^0-9]/g, '')
        }
        if (parsedOrder.customer_email) {
          paymentOptions.customerEmail = parsedOrder.customer_email
        }
      }
      
      await tossPayments.requestPayment(selectedMethod, paymentOptions)
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || '결제 실패')
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  const paymentMethods = [
    { id: '카드' as PaymentMethod, name: '신용/체크카드', icon: CreditCard, color: 'pink' },
    { id: '계좌이체' as PaymentMethod, name: '계좌이체', icon: Building2, color: 'blue' },
    { id: '가상계좌' as PaymentMethod, name: '가상계좌', icon: Landmark, color: 'green' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">결제하기</h3>
          <button onClick={onClose} disabled={isProcessing}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 결제 금액 */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">결제 금액</p>
          {discountAmount && discountAmount > 0 ? (
            <div>
              <p className="text-sm text-gray-500 line-through">
                {(totalAmount + discountAmount).toLocaleString()}원
              </p>
              <p className="text-2xl font-bold text-pink-600">
                {totalAmount.toLocaleString()}원
                <span className="text-sm text-green-600 ml-2">
                  ({discountAmount.toLocaleString()}원 할인)
                </span>
              </p>
            </div>
          ) : (
            <p className="text-2xl font-bold text-pink-600">{totalAmount.toLocaleString()}원</p>
          )}
        </div>

        {/* 배송 정보 */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900 font-medium mb-1">📦 배송 정보</p>
          <p className="text-xs text-blue-700">
            {orderData.delivery_time === '즉시배송' 
              ? '주문 후 3~6시간 내 배송' 
              : `${orderData.delivery_date} ${orderData.delivery_time} 기준 3~6시간 내`}
          </p>
        </div>

        {/* 결제 수단 선택 */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">결제 수단 선택</p>
          <div className="space-y-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isSelected = selectedMethod === method.id
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  disabled={isProcessing}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center ${
                    isSelected
                      ? `border-${method.color}-600 bg-${method.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  } disabled:opacity-50`}
                >
                  <Icon className={`w-6 h-6 mr-3 ${isSelected ? `text-${method.color}-600` : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <p className="font-medium">{method.name}</p>
                    {method.id === '가상계좌' && (
                      <p className="text-xs text-gray-500">입금 기한: 3일</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 가상계좌 안내 */}
        {selectedMethod === '가상계좌' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              💡 가상계좌는 발급 후 3일 이내 입금해주세요. 입금 확인 후 배송이 시작됩니다.
            </p>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 로딩 */}
        {!isReady && !error && (
          <div className="mb-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <p className="text-sm text-gray-600 mt-2">준비중...</p>
          </div>
        )}

        {/* 버튼 */}
        <div className="space-y-3">
          <button
            onClick={handlePayment}
            disabled={isProcessing || !isReady}
            className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            {isProcessing ? '처리중...' : `${selectedMethod} 결제`}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
