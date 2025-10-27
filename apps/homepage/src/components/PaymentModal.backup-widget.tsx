'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  orderData: any
  totalAmount: number
  discountAmount?: number
  onSuccess: (transactionId: string) => void
}

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
  const [isWidgetReady, setIsWidgetReady] = useState(false)
  const paymentWidgetRef = useRef<any>(null)
  const paymentMethodsWidgetRef = useRef<any>(null)

  useEffect(() => {
    if (!isOpen) return

    const initWidget = async () => {
      try {
        setIsWidgetReady(false)
        
        const pendingOrder = localStorage.getItem('pendingOrder')
        if (!pendingOrder) {
          setError('주문 정보를 찾을 수 없습니다')
          return
        }

        const parsedOrder = JSON.parse(pendingOrder)
        const customerKey = parsedOrder.customer_phone?.replace(/\D/g, '') || 'GUEST'

        // 환경변수 디버깅 (하드코딩 테스트)
        const clientKey = 'test_ck_yL0qZ4G1VOdm2dzkPzqoroWb2MQY' // 하드코딩 테스트
        console.log('[TOSS DEBUG - HARDCODED]', {
          clientKey: clientKey ? `${clientKey.substring(0, 20)}...` : 'undefined',
          customerKey,
          hasClientKey: !!clientKey,
          envKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
        })

        if (!clientKey) {
          setError('토스 클라이언트 키가 설정되