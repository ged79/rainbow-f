/**
 * Standard error handling utilities
 */

import { logger } from '@/services/logger'
import toast from 'react-hot-toast'

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(error: unknown, context?: string): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  const errorContext = context || 'Application'
  
  logger.error(`${errorContext} error:`, error)
  
  // User-friendly error messages
  if (error instanceof AppError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        toast.error('네트워크 연결을 확인해주세요')
        break
      case 'AUTH_ERROR':
        toast.error('로그인이 필요합니다')
        break
      case 'PERMISSION_ERROR':
        toast.error('권한이 없습니다')
        break
      default:
        toast.error(error.message || '오류가 발생했습니다')
    }
  } else {
    toast.error('예기치 않은 오류가 발생했습니다')
  }
}

export async function tryAsync<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (error) {
    handleError(error)
    return fallback
  }
}
