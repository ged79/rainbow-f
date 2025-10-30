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
        // Confirm payment with Toss
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

        if (confirmResult.success) {
          setStatus('success')
          setMessage('결제가 완료되었습니다!')
          localStorage.removeItem('pendingOrder')
          setTimeout(() => router.push('/'), 3000)
        } else {
          setStatus('error')
          setMessage(confirmResult.error || '결제 실패')
        }
      } catch (error) {
        setStatus('error')
        setMessage('결제 처리 중 오류가 발생했습니다')
      }
    }

    processPayment()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p>결제 처리 중...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-2">결제 완료</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">홈으로 이동합니다...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-red-600 text-5xl mb-4">✗</div>
            <h2 className="text-2xl font-bold mb-2">결제 실패</h2>
            <p className="text-gray-600">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              홈으로
            </button>
          </>
        )}
      </div>
    </div>
  )
}