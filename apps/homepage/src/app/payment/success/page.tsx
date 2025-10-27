'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'virtual_account'>('loading')
  const [message, setMessage] = useState('')
  const [virtualAccountInfo, setVirtualAccountInfo] = useState<any>(null)

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

        // 가상계좌 처리
        const paymentData = confirmResult.payment
        if (paymentData.method === '가상계좌' && paymentData.virtualAccount) {
          setVirtualAccountInfo({
            bankName: paymentData.virtualAccount.bankName,
            accountNumber: paymentData.virtualAccount.accountNumber,
            customerName: paymentData.virtualAccount.customerName,
            dueDate: paymentData.virtualAccount.dueDate
          })
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
            payment_status: paymentData.method === '가상계좌' ? 'pending' : 'completed',
            status: paymentData.method === '가상계좌' ? 'pending_payment' : 'paid'
          }),
        })

        const orderResult = await orderResponse.json()

        if (orderResult.success) {
          localStorage.removeItem('pendingOrder')
          
          if (paymentData.method === '가상계좌') {
            setStatus('virtual_account')
            setMessage(`가상계좌가 발급되었습니다. 주문번호: ${orderResult.orderNumber}`)
          } else {
            setStatus('success')
            setMessage(`주문이 완료되었습니다. 주문번호: ${orderResult.orderNumber}`)
            setTimeout(() => router.push('/'), 3000)
          }
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
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

        {status === 'virtual_account' && virtualAccountInfo && (
          <>
            <div className="text-blue-600 text-6xl mb-4">🏦</div>
            <h2 className="text-2xl font-bold mb-2">가상계좌 발급 완료</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4 text-left">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">입금은행</p>
                  <p className="font-bold">{virtualAccountInfo.bankName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">계좌번호</p>
                  <p className="font-bold text-lg">{virtualAccountInfo.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">예금주</p>
                  <p className="font-medium">{virtualAccountInfo.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">입금기한</p>
                  <p className="font-medium text-red-600">
                    {new Date(virtualAccountInfo.dueDate).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
              <p className="text-xs text-yellow-800">
                💡 입금 기한 내 입금 시 자동으로 배송이 시작됩니다.
              </p>
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
            >
              홈으로 돌아가기
            </button>
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
