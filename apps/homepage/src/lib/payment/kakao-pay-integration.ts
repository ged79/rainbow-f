/**
 * 카카오페이 결제 연동 시스템
 * 실제 구현시 카카오페이 가맹점 등록 필요
 */

interface KakaoPayConfig {
  adminKey: string
  cid: string // 가맹점 코드
  cidSecret?: string // 가맹점 비밀키 (선택)
}

interface PaymentPrepareParams {
  orderId: string
  userId: string
  itemName: string
  totalAmount: number
  taxFreeAmount?: number
  vatAmount?: number
  installMonth?: number
}

interface PaymentApproveParams {
  tid: string // 결제 고유 번호
  orderId: string
  userId: string
  pgToken: string // 결제 승인 토큰
}

export class KakaoPayService {
  private config: KakaoPayConfig
  private baseUrl = 'https://kapi.kakao.com'
  
  constructor(config: KakaoPayConfig) {
    this.config = config
  }

  /**
   * 결제 준비
   */
  async preparePayment(params: PaymentPrepareParams) {
    const response = await fetch(`${this.baseUrl}/v1/payment/ready`, {
      method: 'POST',
      headers: {
        'Authorization': `KakaoAK ${this.config.adminKey}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      body: new URLSearchParams({
        cid: this.config.cid,
        partner_order_id: params.orderId,
        partner_user_id: params.userId,
        item_name: params.itemName,
        quantity: '1',
        total_amount: params.totalAmount.toString(),
        vat_amount: (params.vatAmount || Math.floor(params.totalAmount / 11)).toString(),
        tax_free_amount: (params.taxFreeAmount || 0).toString(),
        approval_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
        fail_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail`,
        install_month: (params.installMonth || 0).toString()
      })
    })

    if (!response.ok) {
      throw new Error('카카오페이 결제 준비 실패')
    }

    return response.json()
  }

  /**
   * 결제 승인
   */
  async approvePayment(params: PaymentApproveParams) {
    const response = await fetch(`${this.baseUrl}/v1/payment/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `KakaoAK ${this.config.adminKey}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      body: new URLSearchParams({
        cid: this.config.cid,
        tid: params.tid,
        partner_order_id: params.orderId,
        partner_user_id: params.userId,
        pg_token: params.pgToken
      })
    })

    if (!response.ok) {
      throw new Error('카카오페이 결제 승인 실패')
    }

    return response.json()
  }

  /**
   * 결제 취소
   */
  async cancelPayment(tid: string, cancelAmount: number, cancelTaxFreeAmount = 0) {
    const response = await fetch(`${this.baseUrl}/v1/payment/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `KakaoAK ${this.config.adminKey}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      body: new URLSearchParams({
        cid: this.config.cid,
        tid: tid,
        cancel_amount: cancelAmount.toString(),
        cancel_tax_free_amount: cancelTaxFreeAmount.toString()
      })
    })

    if (!response.ok) {
      throw new Error('카카오페이 결제 취소 실패')
    }

    return response.json()
  }

  /**
   * 결제 상태 조회
   */
  async getPaymentStatus(tid: string) {
    const response = await fetch(`${this.baseUrl}/v1/payment/order`, {
      method: 'POST',
      headers: {
        'Authorization': `KakaoAK ${this.config.adminKey}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      body: new URLSearchParams({
        cid: this.config.cid,
        tid: tid
      })
    })

    if (!response.ok) {
      throw new Error('결제 상태 조회 실패')
    }

    return response.json()
  }
}

// Usage example
export const kakaoPayService = new KakaoPayService({
  adminKey: process.env.KAKAO_ADMIN_KEY!,
  cid: process.env.KAKAO_CID!,
  cidSecret: process.env.KAKAO_CID_SECRET
})
