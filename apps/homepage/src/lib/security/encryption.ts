/**
 * 데이터 암호화 유틸리티
 * AES-256-GCM 암호화 사용
 */

import crypto from 'crypto'

class EncryptionService {
  private algorithm = 'aes-256-gcm'
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
      
      // 인증 태그 가져오기
      const authTag = cipher.getAuthTag()
      
      // IV + authTag + 암호문을 하나의 문자열로 결합
      const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')])
      
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
      
      // IV, authTag, 암호문 분리
      const iv = combined.slice(0, 16)
      const authTag = combined.slice(16, 32)
      const encrypted = combined.slice(32)
      
      // 복호화 객체 생성
      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv)
      decipher.setAuthTag(authTag)
      
      // 복호화 수행
      let decrypted = decipher.update(encrypted, undefined, 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('복호화 실패')
    }
  }

  /**
   * 전화번호 마스킹 (표시용)
   * 010-1234-5678 -> 010-****-5678
   */
  maskPhone(phone: string): string {
    if (!phone) return ''
    const cleaned = phone.replace(/[^0-9]/g, '')
    if (cleaned.length < 10) return phone
    
    const masked = cleaned.slice(0, 3) + '****' + cleaned.slice(-4)
    return masked.slice(0, 3) + '-' + masked.slice(3, 7) + '-' + masked.slice(7)
  }

  /**
   * 이메일 마스킹 (표시용)
   * user@example.com -> u***@example.com
   */
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email
    
    const [local, domain] = email.split('@')
    if (local.length <= 2) return email
    
    const masked = local[0] + '***' + (local.length > 4 ? local.slice(-1) : '')
    return `${masked}@${domain}`
  }

  /**
   * 주민등록번호 형식 마스킹 (표시용)
   * 123456-1234567 -> 123456-1******
   */
  maskSSN(ssn: string): string {
    if (!ssn) return ''
    const cleaned = ssn.replace(/[^0-9]/g, '')
    if (cleaned.length !== 13) return ssn
    
    return cleaned.slice(0, 6) + '-' + cleaned[6] + '******'
  }

  /**
   * 신용카드 번호 마스킹 (표시용)
   * 1234-5678-9012-3456 -> 1234-****-****-3456
   */
  maskCardNumber(cardNumber: string): string {
    if (!cardNumber) return ''
    const cleaned = cardNumber.replace(/[^0-9]/g, '')
    if (cleaned.length < 15) return cardNumber
    
    const masked = cleaned.slice(0, 4) + '********' + cleaned.slice(-4)
    return masked.match(/.{1,4}/g)?.join('-') || cardNumber
  }

  /**
   * 주소 부분 마스킹 (상세주소만)
   */
  maskAddress(address: string): string {
    if (!address) return ''
    
    // 상세주소 부분 찾기 (보통 마지막 부분)
    const parts = address.split(',')
    if (parts.length > 1) {
      parts[parts.length - 1] = ' ***'
      return parts.join(',')
    }
    
    // 또는 괄호 안의 내용 마스킹
    return address.replace(/\([^)]*\)/g, '(***)')
  }

  /**
   * 해시 생성 (비밀번호 등)
   */
  hash(text: string): string {
    return crypto
      .createHash('sha256')
      .update(text + (process.env.HASH_SALT || 'default-salt'))
      .digest('hex')
  }

  /**
   * 안전한 랜덤 토큰 생성
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * 안전한 랜덤 숫자 생성 (OTP 등)
   */
  generateOTP(length: number = 6): string {
    const max = Math.pow(10, length) - 1
    const min = Math.pow(10, length - 1)
    const randomNum = crypto.randomInt(min, max + 1)
    return randomNum.toString()
  }
}

// 싱글톤 인스턴스
export const encryptionService = new EncryptionService()

// 타입 정의
export interface EncryptedField {
  encrypted: string
  masked: string
}

/**
 * 민감 정보 처리 헬퍼 함수
 */
export function processSensitiveData(data: string, type: 'phone' | 'email' | 'address'): EncryptedField {
  const encrypted = encryptionService.encrypt(data)
  let masked = ''
  
  switch (type) {
    case 'phone':
      masked = encryptionService.maskPhone(data)
      break
    case 'email':
      masked = encryptionService.maskEmail(data)
      break
    case 'address':
      masked = encryptionService.maskAddress(data)
      break
  }
  
  return { encrypted, masked }
}

/**
 * 복호화 헬퍼 함수
 */
export function decryptSensitiveData(encryptedData: string): string {
  try {
    return encryptionService.decrypt(encryptedData)
  } catch (error) {
    console.error('Decryption failed:', error)
    return ''
  }
}