/**
 * @flower/shared - Clean Package v2.0
 * Extracted directly from working Client
 */

// Type exports
export * from './types'

// Constants - selective exports to avoid conflicts
export { 
  KOREA_REGIONS,
  AREA_OPTIONS,
  ALL_VALID_AREAS,
  SIDO_SHORT_MAP 
} from './constants/koreaRegions'

export {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES
} from './constants/products'

export {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS
} from './constants/orders'

export {
  BUSINESS_RULES
} from './constants/businessRules'

// Utils exports
export * from './utils'

export const VERSION = '2.0.0'
export const PACKAGE_NAME = '@flower/shared'
