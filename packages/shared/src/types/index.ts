/**
 * @flower/shared/types - SINGLE SOURCE OF TRUTH
 * Version: 2.0.0
 * Last Updated: 2025-08-31
 * 
 * CRITICAL: This is the canonical type definition for the entire platform.
 * Database migrations and all apps MUST conform to these types.
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
  commission_rate: number  // As decimal (0.25 = 25%)
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
  
  // Completion data
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
  balance_before?: number
  balance_after: number
  description?: string
  order_id?: string
  created_at: string
}

/**
 * Settlement - Weekly settlement records
 * IMPORTANT: Database must match this structure exactly
 */
export interface Settlement {
  id: string
  store_id: string
  
  // Period
  period_start: string  // ISO date string
  period_end: string    // ISO date string
  
  // Order data
  total_orders: number
  order_ids?: string[]  // Array of order IDs included
  
  // Financial data (all amounts in KRW)
  total_amount: number       // Total revenue from orders
  commission_rate?: number   // Rate used (0.25 = 25%), optional as it's in BUSINESS_RULES
  commission_amount: number  // Commission charged
  net_amount: number        // total_amount - commission_amount
  settlement_amount: number // Amount to be settled (same as net_amount, kept for compatibility)
  
  // Status
  status: SettlementStatus
  processed_at?: string
  processed_by?: string  // admin user id
  
  // Banking info (snapshot at time of settlement)
  bank_name?: string
  account_number?: string
  account_holder?: string
  transfer_note?: string
  
  // Metadata
  created_at: string
  updated_at?: string
}

export interface SettlementWithStore extends Settlement {
  store?: Store
}

// ===========================
// Commission & Assignment Types
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
  dong?: string
  bname?: string
  roadAddress?: string
  jibunAddress?: string
  zonecode?: string
  detail?: string
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
  points_after?: number
}

export interface BusinessHours {
  weekday: { open: string | null; close: string | null }
  weekend: { open: string | null; close: string | null }
  saturday?: { open: string | null; close: string | null }
  sunday?: { open: string | null; close: string | null }
}

// ===========================
// Type Aliases & Enums
// ===========================

export type StoreStatus = 'pending' | 'active' | 'suspended' | 'closed'
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'delivering' | 'completed' | 'cancelled' | 'rejected'
export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type ProductType = '근조화환' | '축하화환' | '관엽화분' | '꽃바구니' | '꽃다발' | '서양란' | '동양란' | '특수상품' | '기타'

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
  product_type: ProductType
  price_basic: number
  price_premium: number
  price_deluxe: number
  created_at?: string
  updated_at?: string
}

// ===========================
// Admin Types
// ===========================

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'staff'
  permissions?: string[]
  created_at: string
  updated_at: string
}

export interface SystemMetrics {
  total_stores: number
  active_stores: number
  total_orders: number
  todays_orders: number
  pending_settlements: number
  total_revenue: number
  total_commission: number
}

// ===========================
// Notice Types
// ===========================

export interface Notice {
  id: string
  title: string
  content: string
  is_active: boolean
  is_pinned: boolean
  view_count: number
  created_at: string
  updated_at: string
  created_by?: string
}

// ===========================
// Input Types for API
// ===========================

export interface CreateOrderInput {
  customer_name: string
  customer_phone: string
  customer_memo?: string
  customer_company?: string
  recipient_name: string
  recipient_phone: string
  recipient_address: Address | string
  delivery_date: string
  delivery_time: string
  product_type: ProductType
  product_name: string
  product_price: number
  product_quantity: number
  ribbon_text?: string[] | string
  special_instructions?: string
  receiver_store_id?: string
  additional_fee?: number
  additional_fee_reason?: string
}

// ===========================
// Unified Order Type for Admin
// ===========================

export interface UnifiedOrder {
  id: string
  source: 'homepage' | 'client' | 'funeral'
  order_number: string
  status: OrderStatus
  created_at: string
  updated_at?: string
  
  customer: Customer
  recipient: Recipient
  
  delivery: {
    date: string
    time: string
    status?: 'normal' | 'warning' | 'urgent' | 'overdue'
  }
  
  product: Product
  
  pricing: {
    base_price: number
    selling_price: number
    commission: number
    commission_rate: number
    final_amount: number
    
    homepage_detail?: {
      consumer_price: number
      discount_amount: number
      points_used: number
      points_earned: number
    }
    
    client_detail?: {
      florist_price: number
      additional_fee: number
      additional_fee_reason?: string
    }
  }
  
  stores: {
    sender?: Store
    receiver?: Store
  }
  
  tracking?: {
    assigned_at?: string
    accepted_at?: string
    completed_at?: string
  }
  
  _original?: any
}

// ===========================
// Re-export for backward compatibility
// ===========================

export type { 
  Store as StoreType,
  Order as OrderType,
  Settlement as SettlementType,
  PointTransaction as PointTransactionType
}