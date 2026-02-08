/**
 * Commission calculation utilities
 * Single source of truth for commission logic
 */

const COMMISSION_RATE = 0.25 // 25% platform commission

export function calculateCommission(totalAmount: number): {
  commission: number
  netAmount: number
  rate: number
} {
  const commission = Math.floor(totalAmount * COMMISSION_RATE)
  return {
    commission,
    netAmount: totalAmount - commission,
    rate: COMMISSION_RATE
  }
}

export function getCommissionRate(): number {
  return COMMISSION_RATE
}

export function formatCommissionRate(): string {
  return `${COMMISSION_RATE * 100}%`
}