/**
 * 데이터 암호화 유틸리티
 * AES-256-CBC 암호화 사용
 */

import crypto from 'crypto'

class EncryptionService {
  private algorithm = 'aes-256-cbc'
  private secretKey: Buffer
  
  constructor() {
    // 환경변수에서 키 가져오기 (32바이트 필요)
    const key = process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!'
    this.secretKey = Buffer.from(key.padEnd(32, '0').slice(0, 32))
  }

  /**
   * 문자열 암호화
   */
  encrypt(text: string): string {
    if (!text) return ''
    
    try {
      // 랜덤 IV 생성
      const iv = crypto.randomBytes(16)
      
      // 암호화 객체 생성
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv)
      
      // 암호화 수행
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      // IV + 암호문을 하나의 문자열로 결합
      const combined = Buffer.concat([iv, Buffer.from(encrypted, 'hex')])
      
      return combined.toString('base64')
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('암호화 실패')
    }
  }

  /**
   * 문자열 복호화
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return ''
    
    try {
      // base64 디코딩
      const combined = Buffer.from(encryptedText, 'base64')
      
      // IV 추출
      const iv = combined.slice(0, 16)
      const encrypted = combined.slice(16)
      
      // 복호화
      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv)
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('복호화 실패')
    }
  }

  /**
   * 객체 암호화
   */
  encryptObject(obj: any): string {
    return this.encrypt(JSON.stringify(obj))
  }

  /**
   * 객체 복호화
   */
  decryptObject<T = any>(encryptedText: string): T {
    const decrypted = this.decrypt(encryptedText)
    return JSON.parse(decrypted)
  }

  /**
   * 민감정보 마스킹
   * ex) 전화번호: 010-****-5678
   */
  maskPhone(phone: string): string {
    if (!phone || phone.length < 10) return phone
    
    const cleaned = phone.replace(/[^0-9]/g, '')
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-****-${cleaned.slice(7)}`
    } else if (cleaned.length === 10) {
      if (cleaned.startsWith('02')) {
        return `${cleaned.slice(0, 2)}-****-${cleaned.slice(6)}`
      } else {
        return `${cleaned.slice(0, 3)}-***-${cleaned.slice(6)}`
      }
    }
    return phone
  }

  /**
   * 이메일 마스킹
   * ex) test@example.com -> te**@example.com
   */
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email
    
    const [localPart, domain] = email.split('@')
    if (localPart.length <= 2) {
      return `${localPart[0]}*@${domain}`
    }
    return `${localPart.slice(0, 2)}${'*'.repeat(localPart.length - 2)}@${domain}`
  }

  /**
   * 이름 마스킹
   * ex) 홍길동 -> 홍*동
   */
  maskName(name: string): string {
    if (!name || name.length < 2) return name
    
    if (name.length === 2) {
      return `${name[0]}*`
    } else if (name.length === 3) {
      return `${name[0]}*${name[2]}`
    } else {
      return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`
    }
  }

  /**
   * 카드번호 마스킹
   * ex) 1234-5678-9012-3456 -> 1234-****-****-3456
   */
  maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/[^0-9]/g, '')
    
    if (cleaned.length !== 16) return cardNumber
    
    return `${cleaned.slice(0, 4)}-****-****-${cleaned.slice(12)}`
  }

  /**
   * 주소 마스킹 (상세주소만)
   * ex) 서울시 강남구 테헤란로 123 (상세주소) -> 서울시 강남구 테헤란로 ***
   */
  maskAddress(address: string): string {
    if (!address) return address
    
    // 괄호 안의 내용 제거
    const withoutParentheses = address.replace(/\([^)]*\)/g, '(***)')
    
    // 마지막 상세주소 부분 마스킹
    const parts = withoutParentheses.split(' ')
    if (parts.length > 3) {
      parts[parts.length - 1] = '***'
    }
    
    return parts.join(' ')
  }
  
  /**
   * 해시 생성 (복호화 불가능한 단방향 암호화)
   * 비밀번호 등에 사용
   */
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex')
  }
  
  /**
   * 솔트와 함께 해시 생성
   */
  hashWithSalt(text: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(text, actualSalt, 10000, 64, 'sha512').toString('hex')
    
    return { hash, salt: actualSalt }
  }
  
  /**
   * 솔트 해시 검증
   */
  verifyHashWithSalt(text: string, hash: string, salt: string): boolean {
    const newHash = crypto.pbkdf2Sync(text, salt, 10000, 64, 'sha512').toString('hex')
    return hash === newHash
  }
  
  /**
   * 랜덤 토큰 생성
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }
  
  /**
   * 시간 제한 토큰 생성
   */
  generateTimedToken(expiryMinutes: number = 15): { token: string; expires: Date } {
    const token = this.generateToken()
    const expires = new Date(Date.now() + expiryMinutes * 60 * 1000)
    
    return { token, expires }
  }
}

// 싱글톤 인스턴스
export const encryptionService = new EncryptionService()
