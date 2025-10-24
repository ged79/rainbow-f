'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  orderData: any
  totalAmount: number
  discountAmount?: number
  onSuccess: (transactionId: string) => void
}

const PAYMENT_METHODS = [
  { id: 'card', name: '신용/체크카드', available: true },
  { id: 'transfer', name: '계좌이체', available: true },
  { id: 'vbank', name: '가상계좌', available: true },
  { id: 'mobile', name: '휴대폰 소액결제', available: true },
]

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  orderData, 
  totalAmount, 
  discountAmount, 
  onSuccess 
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('card')
  const [error, setError] = useState('')

  const handlePayment = async () => {
    setIsProcessing(true)
    setError('')

    try {
      const orderId = `ORD-${Date.now()}`
      
      // 테스트: 결제 확인 없이 주문 직접 생성
      const pendingOrder = localStorage.getItem('pendingOrder')
      if (!pendingOrder) {
        setError('주문 정보를 찾을 수 없습니다')
        setIsProcessing(false)
        return
      }

      const orderData = JSON.parse(pendingOrder)

      // items 배열 생성
      const items = [{
        productId: orderData.product_id,
        productName: orderData.product_name,
        productImage: orderData.product_image,
        price: orderData.product_price,
        quantity: orderData.product_quantity || 1
      }]

      console.log('[PaymentModal] Sending order:', {
        product_name: orderData.product_name,
        product_image: orderData.product_image,
        items: items
      })

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          items: items,
          customerPhone: orderData.customer_phone,
          customerName: orderData.customer_name,
          recipientPhone: orderData.recipient_phone,
          recipientName: orderData.recipient_name,
          deliveryAddress: orderData.recipient_address,
          deliveryDate: orderData.delivery_date,
          deliveryTime: orderData.delivery_time,
          totalAmount: orderData.total_amount,
          discountAmount: orderData.discount_amount || 0,
          ribbonMessage: orderData.ribbon_text,
          message: orderData.special_instructions,
          payment_key: 'test_payment',
          transaction_id: orderId,
          payment_status: 'test',
          status: 'pending'
        }),
      })

      const orderResult = await orderResponse.json()

      if (orderResult.success) {
        localStorage.removeItem('pendingOrder')
        alert(`테스트 주문 완료! 주문번호: ${orderResult.orderNumber}`)
        window.location.href = '/'
      } else {
        setError(orderResult.error || '주문 생성 실패')
        setIsProcessing(false)
      }
      
    } catch (err: any) {
      setError('결제 처리 중 오류가 발생했습니다')
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">결제하기</h3>
          <button onClick={onClose} disabled={isProcessing}>
            <X className="w-5 h-5" />
          </button>
        </div>

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
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900 font-medium mb-1">📦 배송 정보</p>
          <p className="text-xs text-blue-700">
            {orderData.delivery_time === '즉시배송' 
              ? '주문 후 3~6시간 내 배송 예정' 
              : `${orderData.delivery_date} ${orderData.delivery_time} 기준 3~6시간 내 배송`}
          </p>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-gray-700">결제 방법 선택</p>
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.id}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedMethod === method.id
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-pink-300'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={(e) => setSelectedMethod(e.target.value)}
                disabled={isProcessing}
                className="text-pink-500 mr-3"
              />
              <span className="text-gray-900">{method.name}</span>
            </label>
          ))}
        </div>
        
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            ⚠️ 테스트 모드: 실제 결제는 진행되지 않습니다
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold"
          >
            {isProcessing ? '처리중...' : '결제하기 (테스트)'}
          </button>
        </div>
      </div>
    </div>
  )
}
