/**
 * Validation utilities for consistent data handling
 */

export function validatePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length !== 10 && cleaned.length !== 11) {
    throw new Error('전화번호를 확인하세요. 올바른 형식: 010-1234-5678 또는 02-123-4567')
  }
  return cleaned
}

export function validateOrderAmount(amount: number): void {
  if (amount < 30000) {
    throw new Error('최소 주문금액은 30,000원입니다')
  }
  if (amount > 10000000) {
    throw new Error('최대 주문금액은 10,000,000원입니다')
  }
}

export function validateDeliveryDate(date: string): void {
  const deliveryDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (deliveryDate < today) {
    throw new Error('배송일은 오늘 이후여야 합니다')
  }
}