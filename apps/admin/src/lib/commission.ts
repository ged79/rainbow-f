/**
 * 수수료 계산 및 정산 로직
 */

import type { Order, Store } from '@/shared/types'
import { BUSINESS_RULES } from '@/shared/constants'

// 수수료 계산
export function calculateCommission(order: Order, store: Store): number {
  // Use store's custom rate if set, otherwise use default 25%
  const rate = store.commission_rate || BUSINESS_RULES.COMMISSION_RATE
  // Commission is calculated on the product price, not including the commission itself
  const baseAmount = order.payment.subtotal + (order.payment.additional_fee || 0)
  return Math.floor(baseAmount * rate)
}

// 정산 금액 계산 (수수료 차감 후)
export function calculateSettlementAmount(
  totalAmount: number,
  commissionRate: number
): {
  commission: number
  settlement: number
} {
  const commission = Math.floor(totalAmount * commissionRate)
  const settlement = totalAmount - commission
  
  return { commission, settlement }
}

// 볼륨 할인 적용
export function applyVolumeDiscount(
  baseRate: number,
  monthlyOrders: number
): number {
  // Check if volume discount is enabled
  if (!BUSINESS_RULES.VOLUME_DISCOUNT.ENABLED) {
    return baseRate
  }
  
  // Apply discount based on tiers
  for (const tier of BUSINESS_RULES.VOLUME_DISCOUNT.TIERS) {
    if (monthlyOrders >= tier.minOrders) {
      return baseRate * (1 - tier.discount) // Apply discount
    }
  }
  
  return baseRate
}

// 정산 주기 계산
export function getNextSettlementDate(lastSettlement: Date | null): Date {
  const now = new Date()
  
  // 매주 금요일 정산 (Friday at 2 PM)
  const daysUntilFriday = (BUSINESS_RULES.SETTLEMENT_SCHEDULE.DAY_OF_WEEK - now.getDay() + 7) % 7
  const nextFriday = new Date(now)
  nextFriday.setDate(now.getDate() + (daysUntilFriday || 7)) // If today is Friday, get next Friday
  nextFriday.setHours(
    BUSINESS_RULES.SETTLEMENT_SCHEDULE.HOUR,
    BUSINESS_RULES.SETTLEMENT_SCHEDULE.MINUTE,
    0,
    0
  )
  
  // If it's already past settlement time on Friday, move to next week
  if (now.getDay() === BUSINESS_RULES.SETTLEMENT_SCHEDULE.DAY_OF_WEEK && 
      now.getHours() >= BUSINESS_RULES.SETTLEMENT_SCHEDULE.HOUR) {
    nextFriday.setDate(nextFriday.getDate() + 7)
  }
  
  return nextFriday
}

// 정산 가능 여부 체크
export function canProcessSettlement(
  pendingAmount: number,
  minSettlementAmount = BUSINESS_RULES.MIN_SETTLEMENT_AMOUNT
): boolean {
  return pendingAmount >= minSettlementAmount
}