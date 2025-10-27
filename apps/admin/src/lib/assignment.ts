/**
 * 화원 배정 우선순위 알고리즘
 * 1. 발주를 많이 준 화원
 * 2. 수주 거절률이 낮은 화원  
 * 3. 배달 시간 준수율이 높은 화원
 */

import type { Store } from '@/shared/types'

export interface StoreMetrics {
  totalOrdersSent: number      // 발주 건수
  rejectionRate: number        // 거절률 (0-1)
  deliveryOnTimeRate: number   // 시간준수율 (0-1)
  lastOrderDate?: string       // 마지막 주문일
}

export function calculateStoreScore(
  store: Store,
  metrics: StoreMetrics
): number {
  // 가중치 설정
  const weights = {
    ordersSent: 0.4,      // 40% - 발주 기여도
    acceptance: 0.3,      // 30% - 수락률  
    onTime: 0.3          // 30% - 시간 준수
  }
  
  // 점수 계산 (0-100)
  const orderScore = Math.min((metrics.totalOrdersSent / 100) * 100, 100) // 100건 = 만점
  const acceptanceScore = (1 - metrics.rejectionRate) * 100
  const onTimeScore = metrics.deliveryOnTimeRate * 100
  
  const totalScore = 
    orderScore * weights.ordersSent +
    acceptanceScore * weights.acceptance +
    onTimeScore * weights.onTime
  
  // 추가 조건
  // - 포인트 잔액 부족 시 -50점
  if (store.points_balance < 100000) {
    return totalScore - 50
  }
  
  // - 영업중이 아니면 0점
  if (!store.is_open) {
    return 0
  }
  
  return Math.round(totalScore)
}

// 정산 금액 계산 (수주 화원만 정산)
export function calculateSettlement(
  orderAmount: number,
  commissionRate = 0.25
): {
  storeReceives: number  // 화원이 받을 금액
  platformFee: number    // 플랫폼 수수료
} {
  const platformFee = Math.floor(orderAmount * commissionRate)
  const storeReceives = orderAmount - platformFee
  
  return {
    storeReceives,
    platformFee
  }
}

// 다음 정산일 계산 (다음주 금요일)
export function getNextSettlementDate(): Date {
  const now = new Date()
  const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7 // 5 = Friday
  const nextFriday = new Date(now)
  
  // 이번주 금요일이 지났거나 오늘이 금요일이면 다음주 금요일
  if (daysUntilFriday <= 0 || now.getDay() === 5) {
    nextFriday.setDate(now.getDate() + 7 + daysUntilFriday)
  } else {
    nextFriday.setDate(now.getDate() + daysUntilFriday + 7)
  }
  
  nextFriday.setHours(14, 0, 0, 0) // 오후 2시 정산
  return nextFriday
}