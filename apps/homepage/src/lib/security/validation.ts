/**
 * 입력값 검증 및 sanitization 유틸리티
 * XSS, SQL Injection 등 보안 위협 방어
 */

// HTML 특수문자 이스케이프
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  }
  return text.replace(/[&<>"'/]/g, (char) => map[char])
}

// SQL Injection 방어용 문자열 검증
export function sanitizeSqlInput(input: string): string {
  // 위험한 SQL 키워드 제거
  const dangerousPatterns = [
    /(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b|\bSELECT\b)/gi,
    /(\bUNION\b|\bJOIN\b|\bWHERE\b|\bFROM\b)/gi,
    /(--|\/\*|\*\/|;|'|"|`)/g,
  ]
  
  let sanitized = input
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })
  
  return sanitized.trim()
}

// 전화번호 형식 검증 (더 유연하게)
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, '')
  // 한국 전화번호: 10-11자리 숫자
  // 010-1234-5678 (11자리) 또는 02-123-4567 (9-10자리)
  return cleaned.length >= 9 && cleaned.length <= 11
}

// 이메일 형식 검증
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

// 비밀번호 강도 검증
export interface PasswordStrength {
  isValid: boolean
  score: number // 0-5
  feedback: string[]
}

export function validatePassword(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0
  
  // 최소 길이 체크
  if (password.length < 8) {
    feedback.push('비밀번호는 8자 이상이어야 합니다')
  } else {
    score++
  }
  
  // 대문자 포함
  if (/[A-Z]/.test(password)) {
    score++
  } else {
    feedback.push('대문자를 포함해주세요')
  }
  
  // 소문자 포함
  if (/[a-z]/.test(password)) {
    score++
  } else {
    feedback.push('소문자를 포함해주세요')
  }
  
  // 숫자 포함
  if (/[0-9]/.test(password)) {
    score++
  } else {
    feedback.push('숫자를 포함해주세요')
  }
  
  // 특수문자 포함
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++
  } else {
    feedback.push('특수문자를 포함해주세요')
  }
  
  // 연속된 문자 체크
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('같은 문자를 3번 이상 연속해서 사용할 수 없습니다')
    score = Math.max(0, score - 1)
  }
  
  return {
    isValid: password.length >= 8 && score >= 3,
    score,
    feedback
  }
}

// 파일 업로드 검증
export interface FileValidation {
  isValid: boolean
  error?: string
}

export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number // bytes
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}
): FileValidation {
  const {
    maxSize = 5 * 1024 * 1024, // 기본 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options
  
  // 파일 크기 체크
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `파일 크기는 ${(maxSize / (1024 * 1024)).toFixed(1)}MB 이하여야 합니다`
    }
  }
  
  // MIME 타입 체크
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: '허용되지 않는 파일 형식입니다'
    }
  }
  
  // 확장자 체크
  const fileName = file.name.toLowerCase()
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
  if (!hasValidExtension) {
    return {
      isValid: false,
      error: '허용되지 않는 파일 확장자입니다'
    }
  }
  
  return { isValid: true }
}

// CSRF 토큰 생성 및 검증
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>()
  
  static generateToken(sessionId: string): string {
    const token = crypto.randomUUID()
    const expires = Date.now() + (15 * 60 * 1000) // 15분 유효
    
    this.tokens.set(sessionId, { token, expires })
    this.cleanup() // 만료된 토큰 정리
    
    return token
  }
  
  static validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId)
    
    if (!stored) return false
    if (Date.now() > stored.expires) {
      this.tokens.delete(sessionId)
      return false
    }
    
    return stored.token === token
  }
  
  static cleanup() {
    const now = Date.now()
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(sessionId)
      }
    }
  }
}

// URL 파라미터 sanitization
export function sanitizeUrlParams(params: Record<string, any>): Record<string, string> {
  const sanitized: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // XSS 방어
      sanitized[key] = escapeHtml(value)
        .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
        .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
    } else if (value != null) {
      sanitized[key] = String(value)
    }
  }
  
  return sanitized
}

// JSON 안전 파싱
export function safeJsonParse<T = any>(json: string, fallback?: T): T | undefined {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

// 주민번호/카드번호 등 민감정보 패턴 감지
export function containsSensitivePattern(text: string): boolean {
  const patterns = [
    /\d{6}-?\d{7}/,  // 주민등록번호
    /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/,  // 신용카드
    /\d{3}-?\d{2}-?\d{5}/,  // 사업자등록번호
  ]
  
  return patterns.some(pattern => pattern.test(text))
}

// 입력값 화이트리스트 검증
export function validateWhitelist(
  input: string,
  allowedValues: string[]
): boolean {
  return allowedValues.includes(input)
}

// 숫자 범위 검증
export function validateNumberRange(
  value: number,
  min: number,
  max: number
): boolean {
  return value >= min && value <= max
}

// 날짜 형식 및 유효성 검증
export function validateDate(dateString: string): boolean {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

// IP 주소 검증
export function validateIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}