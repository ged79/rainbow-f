// Order validation custom hook
import { useState } from 'react'

interface ValidationResult {
  valid: boolean
  error?: string
  finalAmount?: number
  pointsVerified?: boolean
}

interface OrderValidationParams {
  productId: string
  quantity: number
  customerPhone: string
  pointsToUse?: number
  referrerPhone?: string
}

export const useOrderValidation = () => {
  const [isValidating, setIsValidating] = useState(false)

  // 주문 검증
  const validateOrder = async (params: OrderValidationParams): Promise<ValidationResult> => {
    setIsValidating(true)
    
    try {
      const res = await fetch('/api/orders/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      if (!res.ok) {
        const error = await res.json()
        return { 
          valid: false, 
          error: error.message || '검증 실패' 
        }
      }

      const data = await res.json()
      return {
        valid: true,
        finalAmount: data.finalAmount,
        pointsVerified: data.pointsVerified
      }
    } catch (error) {
      console.error('Validation error:', error)
      return { 
        valid: false, 
        error: '검증 중 오류가 발생했습니다' 
      }
    } finally {
      setIsValidating(false)
    }
  }

  // 포인트 검증
  const validatePoints = async (phone: string, amount: number): Promise<boolean> => {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount })
      })

      return res.ok
    } catch (error) {
      console.error('Points validation error:', error)
      return false
    }
  }

  // 가격 재계산
  const recalculatePrice = async (
    productId: string, 
    quantity: number, 
    discountAmount: number = 0
  ): Promise<number> => {
    try {
      const res = await fetch('/api/products/price-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId, 
          quantity, 
          discountAmount 
        })
      })

      if (res.ok) {
        const { finalAmount } = await res.json()
        return finalAmount
      }
      
      throw new Error('Price calculation failed')
    } catch (error) {
      console.error('Price calculation error:', error)
      throw error
    }
  }

  // 주소 검증
  const validateAddress = (address: any): boolean => {
    if (!address || typeof address !== 'object') return false
    
    return !!(
      address.sido && 
      address.sigungu && 
      address.dong && 
      address.detail && 
      address.postal_code
    )
  }

  // 전화번호 검증
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[^0-9]/g, '')
    return cleaned.length === 11 && cleaned.startsWith('010')
  }

  return {
    isValidating,
    validateOrder,
    validatePoints,
    recalculatePrice,
    validateAddress,
    validatePhone
  }
}
