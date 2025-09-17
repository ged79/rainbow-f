import { NextResponse } from 'next/server'
export enum ErrorCode {
  // Auth errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  // Business logic errors
  INSUFFICIENT_POINTS = 'INSUFFICIENT_POINTS',
  STORE_NOT_FOUND = 'STORE_NOT_FOUND',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  INVALID_ORDER_STATUS = 'INVALID_ORDER_STATUS',
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
export function handleApiError(error: unknown) {
  // Handle known ApiError
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: error.statusCode }
    )
  }
  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any
    // Map Supabase error codes to our error codes
    if (supabaseError.code === '23505') {
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '중복된 데이터가 존재합니다',
            details: supabaseError
          }
        },
        { status: 400 }
      )
    }
    if (supabaseError.code === '23503') {
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '참조하는 데이터가 존재하지 않습니다',
            details: supabaseError
          }
        },
        { status: 400 }
      )
    }
  }
  // Handle generic errors
  const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
  return NextResponse.json(
    {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    },
    { status: 500 }
  )
}
// Validation helper
export function validateRequired(data: any, fields: string[]) {
  const missing = fields.filter(field => !data[field])
  if (missing.length > 0) {
    throw new ApiError(
      ErrorCode.VALIDATION_ERROR,
      `필수 항목이 누락되었습니다: ${missing.join(', ')}`,
      400,
      { missing_fields: missing }
    )
  }
}
// Auth helper
export async function requireAuth(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new ApiError(
      ErrorCode.UNAUTHORIZED,
      '로그인이 필요합니다',
      401
    )
  }
  return user
}
// Store helper
export async function requireStore(supabase: any, userId: string) {
  const { data: store, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error || !store) {
    throw new ApiError(
      ErrorCode.STORE_NOT_FOUND,
      '가맹점 정보를 찾을 수 없습니다',
      404
    )
  }
  return store
}
