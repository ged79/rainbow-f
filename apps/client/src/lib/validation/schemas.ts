/**
 * API Input Validation Schemas
 * Uses Zod for runtime type checking and validation
 * 
 * CRITICAL: All financial inputs must be validated
 */

import { z } from 'zod'

// ============================================
// Common Validation Rules
// ============================================

// Phone number validation (Korean format)
const phoneSchema = z.string()
  .regex(/^(010|011|016|017|018|019)-?\d{3,4}-?\d{4}$/, 
    '올바른 전화번호 형식이 아닙니다')

// Price validation (must be positive, reasonable max)
const priceSchema = z.number()
  .min(0, '가격은 0원 이상이어야 합니다')
  .max(100000000, '가격이 너무 큽니다 (최대 1억원)')
  .refine(val => Number.isInteger(val), '가격은 정수여야 합니다')

// Quantity validation
const quantitySchema = z.number()
  .int('수량은 정수여야 합니다')
  .min(1, '수량은 1개 이상이어야 합니다')
  .max(1000, '수량이 너무 많습니다 (최대 1000개)')

// UUID validation
const uuidSchema = z.string().uuid('올바른 ID 형식이 아닙니다')

// Date string validation
const dateStringSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다')

// ============================================
// Order Schemas
// ============================================

// Base order schema (without refinements)
const baseOrderSchema = z.object({
  // Receiver store
  receiver_store_id: uuidSchema.optional(), // Optional for pickup orders
  
  // Customer info
  customer_name: z.string()
    .min(1, '주문자 이름을 입력해주세요')
    .max(50, '이름이 너무 깁니다'),
  customer_phone: phoneSchema,
  customer_memo: z.string().max(500, '메모가 너무 깁니다').optional(),
  customer_company: z.string().max(100, '회사명이 너무 깁니다').optional(),
  
  // Recipient info
  recipient_name: z.string()
    .min(1, '수령인 이름을 입력해주세요')
    .max(50, '이름이 너무 깁니다'),
  recipient_phone: phoneSchema,
  recipient_address: z.union([
    z.string().min(1, '배송 주소를 입력해주세요').max(200, '주소가 너무 깁니다'),
    z.object({
      sido: z.string(),
      sigungu: z.string(),
      dong: z.string(),
      detail: z.string(),
      postal_code: z.string()
    })
  ]),
  delivery_date: dateStringSchema,
  delivery_time: z.string()
    .regex(/^(([01]\d|2[0-3]):([0-5]\d)|즉시배송)$/, '시간 형식은 HH:MM이어야 합니다'),
  
  // Product info
  product_type: z.enum([
    '결혼식 화환', '장례식 화환', '개업.행사', '승진.기념일', '기타'
  ], { errorMap: () => ({ message: '올바른 상품 종류를 선택해주세요' }) }),
  product_name: z.string()
    .min(1, '상품명을 입력해주세요')
    .max(100, '상품명이 너무 깁니다'),
  product_price: priceSchema,
  product_quantity: quantitySchema,
  ribbon_text: z.union([
    z.string().max(100, '리본 문구가 너무 깁니다'),
    z.array(z.string().max(100))
  ]).optional(),
  special_instructions: z.string().max(500, '특별 지시사항이 너무 깁니다').optional(),
  
  // Additional fees
  additional_fee: z.number()
    .min(0, '추가 요금은 0원 이상이어야 합니다')
    .max(1000000, '추가 요금이 너무 큽니다')
    .optional()
    .default(0),
  additional_fee_reason: z.string()
    .max(200, '추가 요금 사유가 너무 깁니다')
    .optional()
})

// Order creation schema (with refinements)
export const createOrderSchema = baseOrderSchema.refine(data => {
  // If additional fee exists, reason must be provided
  if (data.additional_fee && data.additional_fee > 0 && !data.additional_fee_reason) {
    return false
  }
  return true
}, {
  message: '추가 요금이 있는 경우 사유를 입력해주세요',
  path: ['additional_fee_reason']
})

// Order update schema (partial, for PATCH requests)
export const updateOrderSchema = baseOrderSchema.partial().extend({
  status: z.enum([
    'pending', 'accepted', 'rejected', 
    'in_delivery', 'completed', 'cancelled'
  ]).optional()
})

// Order status change schema
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'accepted', 'rejected', 'in_delivery', 
    'completed', 'cancelled'
  ], { errorMap: () => ({ message: '올바른 상태를 선택해주세요' }) })
})

// Order query params schema
export const orderQuerySchema = z.object({
  type: z.enum(['sent', 'received', 'all']).optional().default('all'),
  status: z.enum([
    'pending', 'accepted', 'rejected',
    'in_delivery', 'completed', 'cancelled'
  ]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  start_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional()
})

// ============================================
// Settlement Schemas
// ============================================

export const settlementQuerySchema = z.object({
  status: z.enum(['pending', 'processing', 'completed']).optional(),
  start_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
})

// ============================================
// Point Transaction Schemas
// ============================================

export const pointChargeSchema = z.object({
  amount: z.number()
    .int('충전 금액은 정수여야 합니다')
    .min(50000, '최소 충전 금액은 50,000원입니다')
    .max(10000000, '최대 충전 금액은 1,000만원입니다')
    .refine(val => val % 10000 === 0, '충전 금액은 10,000원 단위여야 합니다'),
  payment_method: z.enum(['card', 'transfer', 'cash'])
    .optional()
    .default('transfer')
})

// ============================================
// Store Search Schema
// ============================================

export const storeSearchSchema = z.object({
  query: z.string()
    .min(2, '검색어는 2글자 이상 입력해주세요')
    .max(50, '검색어가 너무 깁니다'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10)
})

// ============================================
// Type Exports
// ============================================

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type OrderQueryParams = z.infer<typeof orderQuerySchema>
export type SettlementQueryParams = z.infer<typeof settlementQuerySchema>
export type PointChargeInput = z.infer<typeof pointChargeSchema>
export type StoreSearchInput = z.infer<typeof storeSearchSchema>

// ============================================
// Validation Helpers
// ============================================

/**
 * Safely parse and validate input data
 * Returns either validated data or validation errors
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}

/**
 * Format Zod errors for API response
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {}
  
  errors.errors.forEach(error => {
    const path = error.path.join('.')
    formatted[path] = error.message
  })
  
  return formatted
}