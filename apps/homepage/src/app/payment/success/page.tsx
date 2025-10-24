'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const processPayment = async () => {
      const paymentKey = searchParams.get('paymentKey')
      const orderId = searchParams.get('orderId')
      const amount = searchParams.get('amount')

      if (!paymentKey || !orderId || !amount) {
        setStatus('error')
        setMessage('결제 정보가 올바르지 않습니다')
        return
      }

      try {
        // 1. 결제 승인 (토스 API)
        const confirmResponse = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            paymentKey, 
            orderId, 
            amount: Number(amount) 
          }),
        })

        const confirmResult = await confirmResponse.json()

        if (!confirmResult.success) {
          setStatus('error')
          setMessage(confirmResult.error || '결제 승인에 실패했습니다')
          return
        }

        // 2. 주문 데이터 가져오기 (localStorage에서)
        const pendingOrder = localStorage.getItem('pendingOrder')
        if (!pendingOrder) {
          setStatus('error')
          setMessage('주문 정보를 찾을 수 없습니다')
          return
        }

        const orderData = JSON.parse(pendingOrder)

        // 3. 주문 생성 (DB)
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...orderData,
            payment_key: paymentKey,
            transaction_id: paymentKey,
            payment_status: 'completed',
            status: 'paid'
          }),
        })

        const orderResult = await orderResponse.json()

        if (orderResult.success) {
          // 주문 완료 - localStorage 정리
          localStorage.removeItem('pendingOrder')
          
          setStatus('success')
          setMessage(`주문이 완료되었습니다. 주문번호: ${orderResult.orderNumber}`)
          
          // 3초 후 홈으로
          setTimeout(() => router.push('/'), 3000)
        } else {
          setStatus('error')
          setMessage(orderResult.error || '주문 생성에 실패했습니다')
        }
      } catch (error) {
        console.error('Payment processing error:', error)
        setStatus('error')
        setMessage('결제 처리 중 오류가 발생했습니다')
      }
    }

    processPayment()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">결제를 처리중입니다...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-2">결제 완료</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">잠시 후 홈으로 이동합니다...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-600 text-6xl mb-4">✕</div>
            <h2 className="text-2xl font-bold mb-2">결제 실패</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              홈으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  )
}
