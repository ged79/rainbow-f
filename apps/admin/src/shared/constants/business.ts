/**
 * Business Rules and Configuration
 * Central source of truth for all business logic constants
 */

export const BUSINESS_RULES = {
  // Commission Settings
  COMMISSION_RATE: 0.25, // 25% standard commission rate
  
  // Volume Discount Tiers (if you want to enable this feature)
  VOLUME_DISCOUNT: {
    ENABLED: false, // Set to true to enable volume discounts
    TIERS: [
      { minOrders: 500, discount: 0.20 }, // 20% off (rate becomes 20%)
      { minOrders: 200, discount: 0.15 }, // 15% off (rate becomes 21.25%)
      { minOrders: 100, discount: 0.10 }, // 10% off (rate becomes 22.5%)
      { minOrders: 50, discount: 0.05 },  // 5% off (rate becomes 23.75%)
    ]
  },
  
  // Points System
  MIN_CHARGE_AMOUNT: 100000, // Minimum points charge: 100,000 KRW
  LOW_BALANCE_THRESHOLD: 50000, // Warning when balance below 50,000 KRW
  CRITICAL_BALANCE_THRESHOLD: 10000, // Critical warning at 10,000 KRW
  
  // Order Management
  AUTO_REJECT_MINUTES: 30, // Auto-reject unaccepted orders after 30 minutes
  MAX_DELIVERY_PHOTOS: 3, // Maximum photos for delivery completion
  ORDER_CANCELLATION_WINDOW_MINUTES: 10, // Can cancel within 10 minutes
  
  // Settlement Configuration
  SETTLEMENT_SCHEDULE: {
    DAY_OF_WEEK: 5, // Friday (0=Sunday, 5=Friday)
    HOUR: 14, // 2 PM
    MINUTE: 0,
    TIMEZONE: 'Asia/Seoul'
  },
  MIN_SETTLEMENT_AMOUNT: 100000, // Minimum amount for settlement request
  SETTLEMENT_PROCESSING_DAYS: 2, // Business days to process settlement
  
  // Store Management
  DEFAULT_BUSINESS_HOURS: {
    weekday: { open: '09:00', close: '18:00' },
    saturday: { open: '09:00', close: '15:00' },
    sunday: { open: null, close: null } // Closed
  },
  MAX_SERVICE_AREAS: 10, // Maximum service areas per store
  
  // Performance Metrics
  GOOD_ACCEPTANCE_RATE: 0.8, // 80% or higher is good
  GOOD_ONTIME_RATE: 0.9, // 90% or higher is good
  
  // Assignment Algorithm Weights
  ASSIGNMENT_WEIGHTS: {
    ORDERS_SENT: 0.4, // 40% weight for order volume
    ACCEPTANCE_RATE: 0.3, // 30% weight for acceptance rate
    ONTIME_RATE: 0.3, // 30% weight for on-time delivery
    LOW_POINTS_PENALTY: -50, // Penalty for low balance
    OFFLINE_PENALTY: -100, // Penalty for offline stores
  }
} as const

// Type exports for TypeScript
export type BusinessRules = typeof BUSINESS_RULES
export type VolumeDiscountTier = typeof BUSINESS_RULES.VOLUME_DISCOUNT.TIERS[number]
export type SettlementSchedule = typeof BUSINESS_RULES.SETTLEMENT_SCHEDULE