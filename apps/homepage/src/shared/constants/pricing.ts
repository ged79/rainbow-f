/**
 * 화원 가격 체계 및 매핑
 * 모든 금액은 원(KRW) 단위
 * 마진율: 30% (화원가 = 고객가 × 0.7)
 */

// 화환 표준가격 (도매가) - 5개 등급 고정가
export const FLORIST_STANDARD_PRICES = {
  실속: 45000,    // 4.5만원
  기본: 60000,    // 6만원
  대: 70000,      // 7만원
  특대: 80000,    // 8만원
  프리미엄: 90000  // 9만원
} as const

export type PriceGrade = keyof typeof FLORIST_STANDARD_PRICES

// Homepage 상품 → 화원가 매핑 테이블 (Homepage 상품명 그대로 사용)
export const PRODUCT_TO_FLORIST_PRICE_MAP = {
  // ===== 축하화환 (5등급 고정가) =====
  '실속 축하화환': { 
    customerPrice: 55000, 
    floristPrice: 45000,  // 실속 등급
    grade: '실속' as PriceGrade,
    category: '축하화환',
    isWreath: true
  },
  '60송이 축하화환': { 
    customerPrice: 67000, 
    floristPrice: 60000,  // 기본 등급
    grade: '기본' as PriceGrade,
    category: '축하화환',
    isWreath: true
  },
  '80송이 축하화환': { 
    customerPrice: 81000, 
    floristPrice: 70000,  // 대 등급
    grade: '대' as PriceGrade,
    category: '축하화환',
    isWreath: true
  },
  '100송이 축하화환': { 
    customerPrice: 95000, 
    floristPrice: 80000,  // 특대 등급
    grade: '특대' as PriceGrade,
    category: '축하화환',
    isWreath: true
  },
  
  // ===== 근조화환 (5등급 고정가) =====
  '실속 근조화환': { 
    customerPrice: 55000, 
    floristPrice: 45000,  // 실속 등급
    grade: '실속' as PriceGrade,
    category: '근조화환',
    isWreath: true
  },
  '60송이 근조화환': { 
    customerPrice: 67000, 
    floristPrice: 60000,  // 기본 등급
    grade: '기본' as PriceGrade,
    category: '근조화환',
    isWreath: true
  },
  '80송이 근조화환': { 
    customerPrice: 81000, 
    floristPrice: 70000,  // 대 등급
    grade: '대' as PriceGrade,
    category: '근조화환',
    isWreath: true
  },
  '100송이 근조화환': { 
    customerPrice: 95000, 
    floristPrice: 80000,  // 특대 등급
    grade: '특대' as PriceGrade,
    category: '근조화환',
    isWreath: true
  },
  
  // ===== 근조 특수상품 (30% 마진) =====
  '근조꽃바구니': { 
    customerPrice: 55000, 
    floristPrice: 38500,  // 30% 마진
    grade: null,
    category: '근조화환',
    isWreath: false
  },
  '근조장구 1단': { 
    customerPrice: 100000, 
    floristPrice: 70000,  // 30% 마진
    grade: null,
    category: '근조화환',
    isWreath: false
  },
  '근조장구 2단': { 
    customerPrice: 120000, 
    floristPrice: 84000,  // 30% 마진
    grade: null,
    category: '근조화환',
    isWreath: false
  },
  
  // ===== 화분류 (30% 마진) =====
  '탁상용 금전수': { 
    customerPrice: 58000, 
    floristPrice: 40600,  // 30% 마진
    grade: null,
    category: '화분·난',
    isWreath: false
  },
  '백만장자의 금전수': { 
    customerPrice: 97000, 
    floristPrice: 67900,  // 30% 마진
    grade: null,
    category: '화분·난',
    isWreath: false
  },
  '대형 해피트리': { 
    customerPrice: 109000, 
    floristPrice: 76300,  // 30% 마진
    grade: null,
    category: '화분·난',
    isWreath: false
  },
  '아레카야자': { 
    customerPrice: 97000, 
    floristPrice: 67900,  // 30% 마진
    grade: null,
    category: '화분·난',
    isWreath: false
  },
  '초대형 뱅갈 고무나무': { 
    customerPrice: 148000, 
    floristPrice: 103600,  // 30% 마진
    grade: null,
    category: '화분·난',
    isWreath: false
  },
  
  // ===== 난류 (30% 마진) =====
  '황금 호접란 (금공주)': { 
    customerPrice: 86000, 
    floristPrice: 60200,  // 30% 마진
    grade: null,
    category: '화분·난',
    isWreath: false
  },
  '만천홍': { 
    customerPrice: 86000, 
    floristPrice: 60200,  // 30% 마진
    grade: null,
    category: '화분·난',
    isWreath: false
  },
  '그라데이션 호접란': { 
    customerPrice: 86000, 
    floristPrice: 60200,  // 30% 마진
    grade: null,
    category: '화분·난',
    isWreath: false
  },
  
  // ===== 꽃상품 (30% 마진) =====
  '꽃다발': { 
    customerPrice: 60000, 
    floristPrice: 42000,  // 30% 마진 - 기본 꽃다발
    grade: null,
    category: '꽃상품',
    isWreath: false
  },
  '대형꽃다발': { 
    customerPrice: 150000, 
    floristPrice: 105000,  // 30% 마진 - 프리미엄 대형
    grade: null,
    category: '꽃상품',
    isWreath: false
  },
  '꽃바구니': { 
    customerPrice: 80000, 
    floristPrice: 56000,  // 30% 마진
    grade: null,
    category: '꽃상품',
    isWreath: false
  }
} as const

// 상품명 타입
export type ProductName = keyof typeof PRODUCT_TO_FLORIST_PRICE_MAP

// 가격 정보 타입
export interface PricingInfo {
  customerPrice: number      // 고객 지불가
  floristPrice: number       // 화원 수령가
  grade: PriceGrade | null  // 가격 등급 (화환만 해당)
  category: string          // 카테고리
  margin: number            // 마진 (customerPrice - floristPrice)
  marginRate: number        // 마진율 (%)
  isWreath: boolean        // 화환 여부
}

/**
 * 상품명으로 가격 정보 조회
 * @param productName 상품명
 * @returns 가격 정보
 */
export function getPricingInfo(productName: string): PricingInfo {
  const mapping = PRODUCT_TO_FLORIST_PRICE_MAP[productName as ProductName]
  
  if (!mapping) {
    // 매핑이 없는 경우 기본값 반환 (30% 마진)
    console.warn(`No pricing mapping found for product: ${productName}`)
    const defaultPrice = 60000
    return {
      customerPrice: defaultPrice,
      floristPrice: Math.floor(defaultPrice * 0.7),
      grade: null,
      category: '기타',
      margin: Math.floor(defaultPrice * 0.3),
      marginRate: 30,
      isWreath: false
    }
  }
  
  const margin = mapping.customerPrice - mapping.floristPrice
  const marginRate = Math.round((margin / mapping.customerPrice) * 100)
  
  return {
    ...mapping,
    margin,
    marginRate
  }
}

/**
 * 카테고리별 화원용 상품 목록
 * 화환은 등급별, 나머지는 실제 상품명으로 표시
 */
export const FLORIST_UI_PRODUCTS = {
  '근조화환': [
    // 화환 5등급
    { id: 'FW-E', name: '근조화환 실속형', price: 45000, grade: '실속', isWreath: true },
    { id: 'FW-B', name: '근조화환 기본형', price: 60000, grade: '기본', isWreath: true },
    { id: 'FW-S', name: '근조화환 대형', price: 70000, grade: '대', isWreath: true },
    { id: 'FW-P', name: '근조화환 특대형', price: 80000, grade: '특대', isWreath: true },
    { id: 'FW-D', name: '근조화환 프리미엄', price: 90000, grade: '프리미엄', isWreath: true },
    // 기타 상품
    { id: 'FB-S', name: '근조꽃바구니', price: 38500, grade: null, isWreath: false },
    { id: 'FS-1', name: '근조장구 1단', price: 70000, grade: null, isWreath: false },
    { id: 'FS-2', name: '근조장구 2단', price: 84000, grade: null, isWreath: false }
  ],
  '축하화환': [
    // 화환 5등급
    { id: 'CW-E', name: '축하화환 실속형', price: 45000, grade: '실속', isWreath: true },
    { id: 'CW-B', name: '축하화환 기본형', price: 60000, grade: '기본', isWreath: true },
    { id: 'CW-S', name: '축하화환 대형', price: 70000, grade: '대', isWreath: true },
    { id: 'CW-P', name: '축하화환 특대형', price: 80000, grade: '특대', isWreath: true },
    { id: 'CW-D', name: '축하화환 프리미엄', price: 90000, grade: '프리미엄', isWreath: true }
  ],
  '화분·난': [
    { id: 'PL-1', name: '탁상용 금전수', price: 40600, grade: null, isWreath: false },
    { id: 'PL-2', name: '백만장자의 금전수', price: 67900, grade: null, isWreath: false },
    { id: 'PL-3', name: '대형 해피트리', price: 76300, grade: null, isWreath: false },
    { id: 'PL-4', name: '아레카야자', price: 67900, grade: null, isWreath: false },
    { id: 'PL-5', name: '초대형 뱅갈 고무나무', price: 103600, grade: null, isWreath: false },
    { id: 'OR-1', name: '황금 호접란 (금공주)', price: 60200, grade: null, isWreath: false },
    { id: 'OR-2', name: '만천홍', price: 60200, grade: null, isWreath: false },
    { id: 'OR-3', name: '그라데이션 호접란', price: 60200, grade: null, isWreath: false }
  ],
  '꽃상품': [
    { id: 'FL-1', name: '꽃다발', price: 42000, grade: null, isWreath: false },
    { id: 'FL-2', name: '대형꽃다발', price: 105000, grade: null, isWreath: false },
    { id: 'FL-3', name: '꽃바구니', price: 56000, grade: null, isWreath: false }
  ]
}

/**
 * 전체 상품 목록 (Homepage 기준)
 * 총 27개 상품 (중복 제거시 19개 고유 상품)
 */
export const ALL_PRODUCTS_COUNT = {
  total: 27,
  unique: 19,
  categories: {
    '개업·행사': 9,
    '결혼식': 7,
    '장례식': 7,
    '승진·기념일': 4
  }
}