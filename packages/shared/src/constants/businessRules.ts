/**
 * Business Rules - Unified Configuration
 * Merged structure for both Client and Admin compatibility
 */

export const BUSINESS_RULES = {
  // Commission Settings
  COMMISSION_RATE: 0.25, // 25% platform commission
  
  // Order Limits
  MIN_ORDER_AMOUNT: 30000,
  MAX_ORDER_AMOUNT: 10000000,
  
  // Settlement - Flat structure (Client compatibility)
  SETTLEMENT_DAY: 5, // Friday
  SETTLEMENT_HOUR: 14, // 2 PM
  
  // Settlement - Nested structure (Admin compatibility)
  SETTLEMENT_SCHEDULE: {
    DAY_OF_WEEK: 5, // Friday (0=Sunday, 5=Friday)
    HOUR: 14, // 2 PM
    MINUTE: 0,
    TIMEZONE: 'Asia/Seoul'
  },
  
  // Auto-reject
  AUTO_REJECT_MINUTES: 30,
  
  // Points - Both naming conventions
  MIN_CHARGE: 100000,          // Client uses this
  MIN_CHARGE_AMOUNT: 100000,   // Admin uses this
  LOW_BALANCE_WARNING: 50000,
  LOW_BALANCE_THRESHOLD: 50000,
  CRITICAL_BALANCE_THRESHOLD: 10000,
  
  // Settlement
  MIN_SETTLEMENT_AMOUNT: 100000,
  SETTLEMENT_PROCESSING_DAYS: 2,
  
  // Volume Discount (Admin feature)
  VOLUME_DISCOUNT: {
    ENABLED: false,
    TIERS: [
      { minOrders: 100, discount: 0.05 },
      { minOrders: 200, discount: 0.10 },
      { minOrders: 500, discount: 0.15 }
    ]
  },
  
  // Store Management
  DEFAULT_BUSINESS_HOURS: {
    weekday: { open: '09:00', close: '18:00' },
    saturday: { open: '09:00', close: '15:00' },
    sunday: { open: null, close: null }
  },
  MAX_SERVICE_AREAS: 10,
  
  // Performance Metrics
  GOOD_ACCEPTANCE_RATE: 0.8,
  GOOD_ONTIME_RATE: 0.9,
  
  // Order Management
  MAX_DELIVERY_PHOTOS: 3,
  ORDER_CANCELLATION_WINDOW_MINUTES: 10,
  
  // Assignment Algorithm Weights
  ASSIGNMENT_WEIGHTS: {
    ORDERS_SENT: 0.4,
    ACCEPTANCE_RATE: 0.3,
    ONTIME_RATE: 0.3,
    LOW_POINTS_PENALTY: -50,
    OFFLINE_PENALTY: -100,
  }
} as const

export type BusinessRules = typeof BUSINESS_RULES