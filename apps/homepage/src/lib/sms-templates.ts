// RAINBOW-F SMS 템플릿 (LMS 장문 대응)

interface OrderConfirmationData {
  orderNumber: string
  productName: string
  quantity: number
  totalAmount: number
  deliveryDate: string
  deliveryTime: string
  recipientName: string
  recipientPhone: string
  deliveryAddress: string
  ribbonText?: string
  isReferral: boolean
  pointsEarned: number
  orderId: string
}

interface DeliveryCompleteData {
  orderNumber: string
  productName: string
  recipientName: string
  completionTime: string
  totalAmount: number
  pointsEarned: number
  rewardRate: number
  referrerPoints?: number
  referrerPhone?: string
  orderId: string
}

interface SignupWelcomeData {
  userName: string
  userPhone: string
  referralCode: string
}

interface ReferralRewardData {
  referrerName: string
  referredUserName: string
  purchaseAmount: number
  earnedPoints: number
  totalPoints: number
  referralCode: string
}

/**
 * 주문 확인 문자 템플릿
 */
export function getOrderConfirmationMessage(data: OrderConfirmationData): string {
  const normalPoints = Math.floor(data.totalAmount * 0.03)
  const referralPoints = Math.floor(data.totalAmount * 0.05)
  
  return `RAINBOW-F 주문 접수

[주문정보]
주문번호: ${data.orderNumber}
상품명: ${data.productName}
수량: ${data.quantity}개
금액: ${data.totalAmount.toLocaleString()}원

[배송정보]
받는분: ${data.recipientName}
연락처: ${data.recipientPhone}
주소: ${data.deliveryAddress}
${data.ribbonText ? `리본문구: ${data.ribbonText}` : ''}

[배송일시]
${data.deliveryDate} ${data.deliveryTime}

[포인트 적립 예정]
일반구매 3% = ${normalPoints.toLocaleString()}P
추천번호 입력시 5% = ${referralPoints.toLocaleString()}P

[포인트 혜택 안내]
- 회원가입 시 4,900P 즉시 적립
- 주문 시 금액의 3~5% 적립
- 추천인도 3% 적립
- 5,000P 이상 시 현금인출 가능

회원가입: https://rainbow-f.kr/
고객센터: 010-7741-4569`
}

/**
 * 배송 완료 문자 템플릿
 */
export function getDeliveryCompleteMessage(data: DeliveryCompleteData): string {
  let message = `RAINBOW-F 배송 완료

${data.productName}
배송이 완료되었습니다.

[주문정보]
주문번호: ${data.orderNumber}
받으신 분: ${data.recipientName}
완료시간: ${data.completionTime}

[포인트 적립 완료]
구매금액: ${data.totalAmount.toLocaleString()}원
적립률: ${data.rewardRate}%
적립완료: ${data.pointsEarned.toLocaleString()}P`

  if (data.referrerPoints && data.referrerPhone) {
    message += `\n\n[추천인 혜택]
추천인(${data.referrerPhone})에게도
${data.referrerPoints.toLocaleString()}P 적립 완료!`
  }

  message += `

[포인트 혜택 안내]
- 회원가입 시 4,900P 즉시 적립
- 5,000P 이상 시 현금인출 가능

회원가입: https://rainbow-f.kr/
고객센터: 010-7741-4569`

  return message
}

/**
 * 회원가입 환영 문자 템플릿
 */
export function getSignupWelcomeMessage(data: SignupWelcomeData): string {
  return `━━━━━━━━━━━━━━━━
🎉 RAINBOW-F 가입완료
━━━━━━━━━━━━━━━━

${data.userName}님 환영합니다!

💰 신규 회원 혜택
4,900P 즉시 적립 완료 ✅
첫 구매부터 바로 사용 가능!

━━━━━━━━━━━━━━━━
🎁 포인트 혜택 안내
━━━━━━━━━━━━━━━━
• 회원가입 시 4,900P 즉시 적립
• 주문 시 금액의 3~5% 적립
  - 일반 구매: 3% 적립
  - 추천번호 입력: 5% 적립
• 추천인도 3% 적립
• 5,000P 이상 시 현금인출 가능
• 포인트 인출 및 사용은 회원가입 후 가능

🎁 내 추천번호: ${data.referralCode}
친구를 초대하고 함께 포인트 받으세요!

포인트 확인: https://rainbow-f.kr/points
쇼핑하러 가기: https://rainbow-f.kr/

고객센터: 010-7741-4569`
}

/**
 * 추천인 포인트 적립 알림 문자 템플릿
 */
export function getReferralRewardMessage(data: ReferralRewardData): string {
  return `━━━━━━━━━━━━━━━━
💰 추천 포인트 적립!
━━━━━━━━━━━━━━━━

${data.referrerName}님,
${data.referredUserName}님이 회원가입하고
첫 구매를 완료했습니다!

🎁 추천 적립 내역
구매금액: ${data.purchaseAmount.toLocaleString()}원
적립률: 3%
적립포인트: ${data.earnedPoints.toLocaleString()}P ✅

💳 내 포인트 현황
총 보유: ${data.totalPoints.toLocaleString()}P
${data.totalPoints >= 5000 ? '현금인출 가능 금액입니다!' : `(${(5000 - data.totalPoints).toLocaleString()}P 더 모으면 현금인출 가능)`}

━━━━━━━━━━━━━━━━
🎁 포인트 혜택 안내
━━━━━━━━━━━━━━━━
• 회원가입 시 4,900P 즉시 적립
• 주문 시 금액의 3~5% 적립
• 추천인도 3% 적립
• 5,000P 이상 시 현금인출 가능

🎁 내 추천번호: ${data.referralCode}
더 많은 친구를 초대하고
계속 포인트 받으세요!

포인트 인출: https://rainbow-f.kr/points
고객센터: 010-7741-4569`
}

/**
 * 간단한 주문 확인 문자 (간략형)
 */
export function getSimpleOrderMessage(
  orderNumber: string, 
  productName: string,
  totalAmount: number,
  deliveryDate: string,
  recipientName: string
): string {
  const normalPoints = Math.floor(totalAmount * 0.03)
  const referralPoints = Math.floor(totalAmount * 0.05)
  
  return `RAINBOW-F 주문 접수

[주문정보]
주문번호: ${orderNumber}
상품: ${productName}
금액: ${totalAmount.toLocaleString()}원

[배송정보]
받는분: ${recipientName}
배송일: ${deliveryDate}

[포인트 적립 예정]
일반구매 3% = ${normalPoints.toLocaleString()}P
추천번호 입력시 5% = ${referralPoints.toLocaleString()}P

- 회원가입 시 4,900P 적립
- 5,000P 이상 현금인출 가능

회원가입: https://rainbow-f.kr/
고객센터: 010-7741-4569`
}

/**
 * 간단한 배송 완료 문자 (간략형)
 */
export function getSimpleDeliveryMessage(
  orderNumber: string, 
  productName: string,
  recipientName: string,
  pointsEarned: number
): string {
  return `RAINBOW-F 배송 완료

${productName}
배송이 완료되었습니다.

받으신 분: ${recipientName}
주문번호: ${orderNumber}

${pointsEarned.toLocaleString()}P 적립 완료!

- 회원가입 시 4,900P 적립
- 5,000P 이상 현금인출 가능

회원가입: https://rainbow-f.kr/
고객센터: 010-7741-4569`
}
