'use client'

import { useState } from 'react'
import { PAYMENT_METHODS, PaymentService } from '../lib/payment'
import { X } from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  orderData: any
  totalAmount: number
  discountAmount?: number
  onSuccess: (transactionId: string) => void
}

export default function PaymentModal({ isOpen, onClose, orderData, totalAmount, discountAmount, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('결제 방법을 선택해주세요')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const result = await PaymentService.processPayment(
        selectedMethod,
        totalAmount,
        orderData
      )

      if (result.success) {
        alert(result.message)
        onSuccess(result.transactionId || '')
      } else {
        setError(result.message || '결제 처리 중 오류가 발생했습니다')
      }
    } catch (err) {
      setError('결제 처리 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">결제하기</h3>
          <button onClick={onClose} className="p-1">
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

        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-gray-700">결제 방법 선택</p>
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.id}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedMethod === method.id
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-pink-300'
              } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="payment"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={(e) => setSelectedMethod(e.target.value)}
                disabled={!method.available || isProcessing}
                className="text-pink-500 mr-3"
              />
              <span className={method.available ? 'text-gray-900' : 'text-gray-400'}>
                {method.name}
              </span>
            </label>
          ))}
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
            disabled={isProcessing || !selectedMethod}
            className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold"
          >
            {isProcessing ? '처리중...' : '결제하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
