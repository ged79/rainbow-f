export interface PaymentMethod {
  id: string
  name: string
  type: 'card' | 'bank_transfer' | 'kakao_pay' | 'naver_pay' | 'toss'
  icon?: string
  available: boolean
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', name: '신용/체크카드', type: 'card', available: true },
  { id: 'kakao_pay', name: '카카오페이', type: 'kakao_pay', available: true },
  { id: 'naver_pay', name: '네이버페이', type: 'naver_pay', available: true },
  { id: 'toss', name: '토스', type: 'toss', available: true },
  { id: 'bank_transfer', name: '무통장입금', type: 'bank_transfer', available: true },
]

export class PaymentService {
  static async processPayment(
    method: string,
    amount: number,
    orderData: any
  ): Promise<{ success: boolean; transactionId?: string; message?: string }> {
    // 실제 PG사 연동 전 모의 처리
    console.log('Processing payment:', { method, amount, orderData })
    
    // 시뮬레이션: 2초 대기
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 실제로는 각 PG사 SDK 연동
    switch (method) {
      case 'card':
        // KG이니시스, 나이스페이 등 연동
        return { 
          success: true, 
          transactionId: `TXN-${Date.now()}`,
          message: '카드 결제가 완료되었습니다.'
        }
      
      case 'kakao_pay':
        // 카카오페이 SDK 연동
        return { 
          success: true, 
          transactionId: `KAKAO-${Date.now()}`,
          message: '카카오페이 결제가 완료되었습니다.'
        }
      
      case 'bank_transfer':
        // 가상계좌 발급
        return { 
          success: true, 
          transactionId: `BANK-${Date.now()}`,
          message: '입금 계좌: 국민은행 123-456-789012\n예금주: 레인보우꽃집'
        }
      
      default:
        return { 
          success: false, 
          message: '지원하지 않는 결제 방식입니다.'
        }
    }
  }
}
