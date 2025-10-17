/**
 * 카카오톡 알림톡/친구톡 발송 시스템
 * 비즈니스 채널 등록 및 템플릿 승인 필요
 */

interface AlimtalkConfig {
  apiKey: string
  apiSecret: string
  senderKey: string // 발신프로필키
  channelId?: string // 카카오톡 채널 ID
}

interface AlimtalkMessage {
  recipientPhone: string
  templateCode: string
  templateArgs?: Record<string, string>
  buttons?: AlimtalkButton[]
}

interface AlimtalkButton {
  name: string
  type: 'WL' | 'AL' | 'DS' | 'BK' | 'MD' // 웹링크, 앱링크, 배송조회, 봇키워드, 메시지전달
  linkMobile?: string
  linkPc?: string
  schemeIos?: string
  schemeAndroid?: string
}

// 템플릿 코드 정의
export enum TEMPLATE_CODES {
  // 주문 관련
  ORDER_COMPLETE = 'ORDER_001', // 주문완료
  ORDER_CONFIRM = 'ORDER_002',  // 주문확인
  ORDER_SHIPPING = 'ORDER_003', // 배송시작
  ORDER_DELIVERED = 'ORDER_004', // 배송완료
  ORDER_CANCEL = 'ORDER_005',    // 주문취소
  
  // 회원 관련
  WELCOME = 'MEMBER_001',        // 회원가입 환영
  PHONE_VERIFY = 'MEMBER_002',   // 휴대폰 인증
  PASSWORD_RESET = 'MEMBER_003', // 비밀번호 재설정
  
  // 프로모션
  COUPON_ISSUED = 'PROMO_001',   // 쿠폰 발급
  POINTS_EARNED = 'PROMO_002',   // 포인트 적립
  REFERRAL_SUCCESS = 'PROMO_003' // 추천 성공
}

export class KakaoAlimtalkService {
  private config: AlimtalkConfig
  private baseUrl = 'https://api.aligo.in/akv10' // 알리고 API 예시
  
  constructor(config: AlimtalkConfig) {
    this.config = config
  }

  /**
   * 알림톡 발송
   */
  async sendAlimtalk(message: AlimtalkMessage) {
    const params = {
      apikey: this.config.apiKey,
      userid: this.config.apiSecret,
      senderkey: this.config.senderKey,
      tpl_code: message.templateCode,
      sender: '1588-1234', // 발신번호
      receiver: message.recipientPhone.replace(/-/g, ''),
      subject: this.getTemplateSubject(message.templateCode),
      ...message.templateArgs,
      button: message.buttons ? JSON.stringify(message.buttons) : undefined
    }

    const response = await fetch(`${this.baseUrl}/alimtalk/send/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      body: new URLSearchParams(params as Record<string, string>)
    })

    if (!response.ok) {
      throw new Error('알림톡 발송 실패')
    }

    return response.json()
  }

  /**
   * 템플릿별 제목 반환
   */
  private getTemplateSubject(templateCode: string): string {
    const subjects: Record<string, string> = {
      [TEMPLATE_CODES.ORDER_COMPLETE]: '주문이 완료되었습니다',
      [TEMPLATE_CODES.ORDER_CONFIRM]: '주문이 확인되었습니다',
      [TEMPLATE_CODES.ORDER_SHIPPING]: '상품이 배송 시작되었습니다',
      [TEMPLATE_CODES.ORDER_DELIVERED]: '상품이 배송 완료되었습니다',
      [TEMPLATE_CODES.ORDER_CANCEL]: '주문이 취소되었습니다',
      [TEMPLATE_CODES.WELCOME]: '회원가입을 환영합니다',
      [TEMPLATE_CODES.PHONE_VERIFY]: '휴대폰 인증번호',
      [TEMPLATE_CODES.PASSWORD_RESET]: '비밀번호 재설정',
      [TEMPLATE_CODES.COUPON_ISSUED]: '쿠폰이 발급되었습니다',
      [TEMPLATE_CODES.POINTS_EARNED]: '포인트가 적립되었습니다',
      [TEMPLATE_CODES.REFERRAL_SUCCESS]: '추천이 완료되었습니다'
    }
    return subjects[templateCode] || '알림'
  }

  /**
   * 주문 완료 알림톡
   */
  async sendOrderComplete(phone: string, orderData: {
    orderNumber: string
    customerName: string
    productName: string
    totalAmount: number
    deliveryDate: string
    deliveryAddress: string
  }) {
    return this.sendAlimtalk({
      recipientPhone: phone,
      templateCode: TEMPLATE_CODES.ORDER_COMPLETE,
      templateArgs: {
        order_number: orderData.orderNumber,
        customer_name: orderData.customerName,
        product_name: orderData.productName,
        total_amount: orderData.totalAmount.toLocaleString(),
        delivery_date: orderData.deliveryDate,
        delivery_address: orderData.deliveryAddress
      },
      buttons: [
        {
          name: '주문내역 확인',
          type: 'WL',
          linkMobile: `${process.env.NEXT_PUBLIC_APP_URL}/my-page?order=${orderData.orderNumber}`,
          linkPc: `${process.env.NEXT_PUBLIC_APP_URL}/my-page?order=${orderData.orderNumber}`
        }
      ]
    })
  }

  /**
   * 휴대폰 인증번호 발송
   */
  async sendPhoneVerification(phone: string, verificationCode: string) {
    return this.sendAlimtalk({
      recipientPhone: phone,
      templateCode: TEMPLATE_CODES.PHONE_VERIFY,
      templateArgs: {
        verification_code: verificationCode,
        expire_time: '3분'
      }
    })
  }

  /**
   * 회원가입 환영 메시지
   */
  async sendWelcomeMessage(phone: string, name: string, welcomePoints: number) {
    return this.sendAlimtalk({
      recipientPhone: phone,
      templateCode: TEMPLATE_CODES.WELCOME,
      templateArgs: {
        customer_name: name,
        welcome_points: welcomePoints.toLocaleString()
      },
      buttons: [
        {
          name: '혜택 확인하기',
          type: 'WL',
          linkMobile: `${process.env.NEXT_PUBLIC_APP_URL}/my-page`,
          linkPc: `${process.env.NEXT_PUBLIC_APP_URL}/my-page`
        }
      ]
    })
  }
}

// Usage example
export const alimtalkService = new KakaoAlimtalkService({
  apiKey: process.env.ALIMTALK_API_KEY!,
  apiSecret: process.env.ALIMTALK_API_SECRET!,
  senderKey: process.env.ALIMTALK_SENDER_KEY!,
  channelId: process.env.KAKAO_CHANNEL_ID
})
