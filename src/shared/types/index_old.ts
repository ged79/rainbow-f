/**
 * @flower/shared/types - CLEANED VERSION
 * Consistent types for the flower delivery platform
 */

// ===========================
// Core Database Types
// ===========================

export interface Store {
  id: string
  user_id: string
  store_code: string
  business_name: string
  owner_name: string
  business_license: string
  phone: string
  email: string
  address: Address
  service_areas: string[]
  points_balance: number
  commission_rate: number
  bank_name: string
  account_number: string
  account_holder: string
  status: StoreStatus
  is_open: boolean
  business_hours?: BusinessHours
  rating: number
  total_orders_sent: number
  total_orders_received: number
  total_sales: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  sender_store_id: string
  receiver_store_id: string | null
  type: 'send' | 'receive'
  customer: Customer
  recipient: Recipient
  product: Product
  payment: Payment
  status: OrderStatus
  delivery_date: string
  delivery_time: string
  special_instructions?: string
  
  // Single consistent completion structure
  completion?: OrderCompletion
  
  created_at: string
  updated_at: string
}

export interface OrderCompletion {
  photos: string[]
  recipient_name: string
  note?: string
  completed_at: string
}

export interface OrderWithStores extends Order {
  sender_store?: Store
  receiver_store?: Store
  sender_store_name?: string
  receiver_store_name?: string
}

export interface PointTransaction {
  id: string
  store_id: string
  type: 'charge' | 'payment' | 'income' | 'commission' | 'refund' | 'withdrawal'
  amount: number
  balance_after: number
  description?: string
  order_id?: string
  created_at: string
}

export interface Settlement {
  id: string
  store_id: string
  period_start: string
  period_end: string
  total_orders: number
  total_amount: number
  commission_amount: number
  settlement_amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  processed_at?: string
  created_at: string
}

// ===========================
// Commission & Assignment Types (NEW)
// ===========================

export interface CommissionCalculation {
  order_id: string
  store_id: string
  order_amount: number
  commission_rate: number
  commission_amount: number
  settlement_amount: number
  calculated_at: string
}

export interface FloristAssignment {
  order_id: string
  candidate_store_id: string
  score: number
  factors: {
    order_volume_score: number
    acceptance_rate_score: number
    delivery_performance_score: number
    point_balance_penalty: number
    availability_status: boolean
  }
  assigned: boolean
  assigned_at?: string
}

// ===========================
// Supporting Types
// ===========================

export interface Address {
  sido: string
  sigungu: string
  dong: string
  detail: string
  postal_code?: string
}

export interface Customer {
  name: string
  phone: string
  memo?: string
  company?: string
}

export interface Recipient {
  name: string
  phone: string
  address: Address
}

export interface Product {
  type: ProductType
  name: string
  price: number
  quantity: number
  ribbon_text?: string[]
  special_instructions?: string
}

export interface Payment {
  subtotal: number
  additional_fee?: number
  additional_fee_reason?: string
  commission: number
  total: number
  points_used: number
  points_after: number
}

export interface BusinessHours {
  weekday: { open: string; close: string }
  weekend: { open: string; close: string }
}

// ===========================
// Type Aliases & Enums
// ===========================

export type StoreStatus = 'pending' | 'active' | 'suspended' | 'closed'
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'delivering' | 'completed' | 'cancelled' | 'rejected'
export type ProductType = '근조화환' | '축하화환' | '관엽화분' | '꽃바구니' | '꽃다발' | '서양란' | '동양란' | '기타'

// ===========================
// Delivery & Pricing Types
// ===========================

export interface StoreDeliveryArea {
  id?: string
  store_id: string
  area_name: string
  min_amount: number
  created_at?: string
  updated_at?: string
}

export interface StoreAreaProductPricing {
  id?: string
  store_id: string
  area_name: string
  product_type: string
  price_basic: number
  price_premium: number
  price_deluxe: number
  created_at?: string
  updated_at?: string
}

// ===========================
// API Input Types
// ===========================

export interface CreateOrderInput {
  customer_name: string
  customer_phone: string
  customer_memo?: string
  customer_company?: string
  recipient_name: string
  recipient_phone: string
  recipient_address: Address  // Fixed: Should be Address object
  delivery_date: string
  delivery_time: string
  product_type: ProductType
  product_name: string
  product_price: number
  product_quantity: number
  ribbon_text?: string[]  // Fixed: Should be array
  special_instructions?: string
  receiver_store_id?: string
  additional_fee?: number
  additional_fee_reason?: string
}

// ===========================
// API Response Types
// ===========================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ===========================
// Dashboard Metrics Types
// ===========================

export interface DashboardMetrics {
  today_commission: number
  week_commission: number
  month_commission: number
  pending_settlements: number
  active_stores: number
  total_orders_today: number
  revenue_trend: Array<{
    date: string
    revenue: number
    commission: number
  }>
}

export interface StoreMetrics {
  store_id: string
  store_name: string
  total_orders_sent: number
  total_orders_received: number
  commission_contributed: number
  settlement_pending: number
  performance_score: number
}