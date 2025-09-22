/**
 * SMS 인증 서비스
 * 알리고 SMS API 활용 예시
 */

import crypto from 'crypto'

interface SMSConfig {
  apiKey: string
  userId: string
  sender: string // 발신번호
}

interface VerificationData {
  phone: string
  code: string
  expiresAt: Date
  attempts: number
}

// 메모리 저장소 (실제로는 Redis 권장)
const verificationStore = new Map<string, VerificationData>()

// 일일 발송 제한 관리
const dailyLimitStore = new Map<string, number>()

export class SMSVerificationService {
  private config: SMSConfig
  private baseUrl = 'https://apis.aligo.in/send/'
  
  constructor(config: SMSConfig) {
    this.config = config
  }

  /**
   * 6자리 인증번호 생성
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * 일일 발송 제한 체크
   */
  private checkDailyLimit(phone: string): boolean {
    const today = new Date().toDateString()
    const key = `${phone}-${today}`
    const count = dailyLimitStore.get(key) || 0
    
    if (count >= 5) {
      return false // 일일 5회 제한
    }
    
    dailyLimitStore.set(key, count + 1)
    return true
  }

  /**
   * 재발송 간격 체크 (1분)
   */
  private checkResendInterval(phone: string): boolean {
    const existing = verificationStore.get(phone)
    if (!existing) return true
    
    const now = new Date()
    const lastSent = new Date(existing.expiresAt.getTime() - 3 * 60 * 1000) // 3분 전 발송
    const diff = now.getTime() - lastSent.getTime()
    
    return diff >= 60 * 1000 // 1분 이상 경과
  }

  /**
   * 인증번호 발송
   */
  async sendVerificationCode(phone: string): Promise<{
    success: boolean
    message: string
  }> {
    // 전화번호 정규화
    const normalizedPhone = phone.replace(/[^0-9]/g, '')
    
    // 발송 제한 체크
    if (!this.checkDailyLimit(normalizedPhone)) {
      return {
        success: false,
        message: '일일 발송 한도를 초과했습니다. 내일 다시 시도해주세요.'
      }
    }
    
    if (!this.checkResendInterval(normalizedPhone)) {
      return {
        success: false,
        message: '1분 후에 재발송이 가능합니다.'
      }
    }
    
    // 인증번호 생성
    const code = this.generateVerificationCode()
    
    // SMS 발송
    try {
      const message = `[꽃배달] 인증번호는 ${code}입니다. 3분 내에 입력해주세요.`
      
      const params = new URLSearchParams({
        key: this.config.apiKey,
        user_id: this.config.userId,
        sender: this.config.sender,
        receiver: normalizedPhone,
        msg: message,
        testmode_yn: process.env.NODE_ENV === 'development' ? 'Y' : 'N'
      })
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      })
      
      const result = await response.json()
      
      if (result.result_code !== '1') {
        throw new Error(result.message || 'SMS 발송 실패')
      }
      
      // 인증 데이터 저장
      verificationStore.set(normalizedPhone, {
        phone: normalizedPhone,
        code,
        expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3분 유효
        attempts: 0
      })
      
      return {
        success: true,
        message: '인증번호가 발송되었습니다.'
      }
    } catch (error) {
      console.error('SMS 발송 오류:', error)
      return {
        success: false,
        message: 'SMS 발송에 실패했습니다. 잠시 후 다시 시도해주세요.'
      }
    }
  }

  /**
   * 인증번호 확인
   */
  async verifyCode(phone: string, inputCode: string): Promise<{
    success: boolean
    message: string
  }> {
    const normalizedPhone = phone.replace(/[^0-9]/g, '')
    const data = verificationStore.get(normalizedPhone)
    
    if (!data) {
      return {
        success: false,
        message: '인증번호를 먼저 요청해주세요.'
      }
    }
    
    // 만료 체크
    if (new Date() > data.expiresAt) {
      verificationStore.delete(normalizedPhone)
      return {
        success: false,
        message: '인증번호가 만료되었습니다. 다시 요청해주세요.'
      }
    }
    
    // 시도 횟수 체크
    if (data.attempts >= 5) {
      verificationStore.delete(normalizedPhone)
      return {
        success: false,
        message: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.'
      }
    }
    
    data.attempts++
    
    // 인증번호 확인
    if (data.code !== inputCode) {
      verificationStore.set(normalizedPhone, data)
      return {
        success: false,
        message: `인증번호가 일치하지 않습니다. (${data.attempts}/5)`
      }
    }
    
    // 인증 성공 - 데이터 삭제
    verificationStore.delete(normalizedPhone)
    
    return {
      success: true,
      message: '인증이 완료되었습니다.'
    }
  }

  /**
   * 정리 작업 - 만료된 데이터 제거 (주기적으로 실행)
   */
  cleanupExpiredData() {
    const now = new Date()
    for (const [phone, data] of verificationStore.entries()) {
      if (now > data.expiresAt) {
        verificationStore.delete(phone)
      }
    }
    
    // 일일 제한 초기화 (자정)
    const today = new Date().toDateString()
    for (const key of dailyLimitStore.keys()) {
      if (!key.endsWith(today)) {
        dailyLimitStore.delete(key)
      }
    }
  }
}

// 싱글톤 인스턴스
export const smsService = new SMSVerificationService({
  apiKey: process.env.ALIGO_API_KEY || '',
  userId: process.env.ALIGO_USER_ID || '',
  sender: process.env.SMS_SENDER || '1588-0000'
})

// 5분마다 정리 작업 실행
if (typeof window === 'undefined') {
  setInterval(() => {
    smsService.cleanupExpiredData()
  }, 5 * 60 * 1000)
}
