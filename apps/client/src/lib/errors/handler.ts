/**
 * Unified Error Handling System
 * Consistent error handling across client/admin apps
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// Error types
export enum ErrorCode {
  // Auth errors
  UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  
  // Business logic errors
  INSUFFICIENT_POINTS = 'POINTS_INSUFFICIENT',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  STORE_NOT_FOUND = 'STORE_NOT_FOUND',
  
  // Validation errors
  INVALID_INPUT = 'VALIDATION_ERROR',
  FILE_TOO_LARGE = 'FILE_SIZE_ERROR',
  INVALID_FILE_TYPE = 'FILE_TYPE_ERROR',
  
  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError {
  code: ErrorCode
  message: string
  details?: any
  timestamp: string
}

export class AppError extends Error {
  public code: ErrorCode
  public statusCode: number
  public details?: any

  constructor(code: ErrorCode, message: string, statusCode = 500, details?: any) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.name = 'AppError'
  }
}

// Error response builder
export function errorResponse(error: AppError | Error | unknown, request?: Request): NextResponse {
  const timestamp = new Date().toISOString()
  
  if (error instanceof AppError) {
    logger.error(`[${error.code}] ${error.message}`, error.details, request)
    
    return NextResponse.json<ApiError>(
      {
        code: error.code,
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.details : undefined,
        timestamp
      },
      { status: error.statusCode }
    )
  }
  
  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any
    
    // Map common Supabase errors
    if (supabaseError.code === 'PGRST116') {
      return errorResponse(
        new AppError(ErrorCode.UNAUTHORIZED, 'Unauthorized access', 401)
      )
    }
    
    if (supabaseError.code === '23505') {
      return errorResponse(
        new AppError(ErrorCode.INVALID_INPUT, 'Duplicate entry', 409)
      )
    }
  }
  
  // Default error
  logger.error('Unexpected error', error, request)
  
  return NextResponse.json<ApiError>(
    {
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      timestamp
    },
    { status: 500 }
  )
}

// Success response builder
export function successResponse<T>(data: T, statusCode = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status: statusCode })
}

// Async error handler wrapper
export function asyncHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context)
    } catch (error) {
      return errorResponse(error, req)
    }
  }
}
