'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PaymentFailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const message = searchParams.get('message') || '결제에 실패했습니다'

  useEffect(() => {
    // localStorage 클리어
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pendingOrder')
      localStorage.removeItem('orderData')
      localStorage.removeItem('cartItems')
    }
    
    setTimeout(() => router.push('/'), 5000)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="text-red-600 text-6xl mb-4">✕</div>
        <h2 className="text-2xl font-bold mb-2">결제 실패</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <button
          onClick={() => {
            // localStorage 클리어
            localStorage.removeItem('pendingOrder')
            localStorage.removeItem('orderData')
            localStorage.removeItem('cartItems')
            router.push('/')
          }}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}
