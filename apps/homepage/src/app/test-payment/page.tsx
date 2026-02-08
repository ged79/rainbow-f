'use client'

import { useState, useEffect, useRef } from 'react'
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk'

export default function TestPaymentPage() {
  const [paymentWidget, setPaymentWidget] = useState<PaymentWidgetInstance | null>(null)
  const paymentMethodsWidgetRef = useRef<any>(null)
  const [amount] = useState(100000)
  const [ready, setReady] = useState(false)
  
  useEffect(() => {
    const loadWidget = async () => {
      try {
        const clientKey = 'test_gck_DLJOpm5QrlWWw2a05a5qVPNdxbWn'
        const customerKey = `customer-${Date.now()}`
        const widget = await loadPaymentWidget(clientKey, customerKey)
        setPaymentWidget(widget)
      } catch (error) {
        console.error('Failed to load widget:', error)
      }
    }
    loadWidget()
  }, [])
  
  useEffect(() => {
    if (!paymentWidget) return
    
    const renderWidget = async () => {
      try {
        console.log('Rendering payment methods...')
        paymentMethodsWidgetRef.current = await paymentWidget.renderPaymentMethods(
          '#payment-methods',
          { value: amount },
          { variantKey: 'DEFAULT' }
        )
        
        console.log('Rendering agreement...')
        await paymentWidget.renderAgreement('#agreement', { variantKey: 'AGREEMENT' })
        
        console.log('Widget ready!')
        setReady(true)
      } catch (error) {
        console.error('Render error:', error)
      }
    }
    
    // 타이밍 테스트
    setTimeout(renderWidget, 1000)
  }, [paymentWidget, amount])
  
  const handlePayment = async () => {
    if (!paymentWidget) {
      alert('Widget not loaded')
      return
    }
    
    if (!ready) {
      alert('Widget not ready')
      return
    }
    
    try {
      console.log('Requesting payment...')
      await paymentWidget.requestPayment({
        orderId: `TEST-${Date.now()}`,
        orderName: '테스트 상품',
        customerName: '홍길동',
        customerEmail: 'test@test.com',
        customerMobilePhone: '01012345678',
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`
      })
    } catch (error: any) {
      console.error('Payment error:', error)
      alert(error.message || '결제 실패')
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">토스페이먼츠 위젯 테스트</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p>금액: {amount.toLocaleString()}원</p>
        <p>상태: {ready ? '✅ 준비됨' : '⏳ 로딩중...'}</p>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded p-4">
          <h2 className="font-bold mb-2">결제 수단</h2>
          <div id="payment-methods" style={{ minHeight: '200px' }} />
        </div>
        
        <div className="border rounded p-4">
          <h2 className="font-bold mb-2">이용약관</h2>
          <div id="agreement" style={{ minHeight: '100px' }} />
        </div>
        
        <button
          onClick={handlePayment}
          disabled={!ready}
          className={`w-full py-3 rounded font-medium ${
            ready 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500'
          }`}
        >
          {ready ? '결제하기' : '위젯 로딩중...'}
        </button>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h3 className="font-bold mb-2">디버그 정보</h3>
        <ul className="text-sm space-y-1">
          <li>Widget loaded: {paymentWidget ? '✅' : '❌'}</li>
          <li>Methods rendered: {paymentMethodsWidgetRef.current ? '✅' : '❌'}</li>
          <li>Ready state: {ready ? '✅' : '❌'}</li>
        </ul>
      </div>
    </div>
  )
}
