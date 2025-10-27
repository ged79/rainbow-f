/**
 * Product categories and pricing - 4개 카테고리 체계
 */

export const PRODUCT_CATEGORIES = [
  {
    type: '결혼식 화환',
    defaultPrice: 80000,
    ribbonTemplates: ['결혼을 축하합니다', '백년해로하세요', '행복하세요', '사랑합니다']
  },
  {
    type: '장례식 화환',
    defaultPrice: 67000,
    ribbonTemplates: ['삼가 고인의 명복을 빕니다', '그리운 당신을 추모합니다', '삼가 조의를 표합니다']
  },
  {
    type: '개업.행사',
    defaultPrice: 80000,
    ribbonTemplates: ['개업을 축하합니다', '번창하세요', '대박나세요', '축하합니다']
  },
  {
    type: '승진.기념일',
    defaultPrice: 86000,
    ribbonTemplates: ['승진을 축하합니다', '무궁한 발전을 빕니다', '생일 축하합니다', '기념일을 축하합니다']
  }
]

export const PRODUCT_TYPES = PRODUCT_CATEGORIES.map(cat => cat.type)

/**
 * Client UI Categories - 화원용 주문 페이지 4개 카테고리
 * 모든 Homepage 상품을 포함하는 완전한 매핑
 */
export const CLIENT_UI_CATEGORIES = {
  '근조화환': {
    displayName: '근조화환',
    backendCategory: '장례식 화환',
    icon: '🏵️',
    products: [
      // 근조화환
      { id: 'FW-40', name: '근조화환 40송이', price: 55000, description: '흰 국화 40송이' },
      { id: 'FW-60', name: '근조화환 60송이', price: 67000, description: '흰 국화 60송이' },
      { id: 'FW-80', name: '근조화환 80송이', price: 81000, description: '흰 국화 80송이' },
      { id: 'FW-100', name: '근조화환 100송이', price: 95000, description: '흰 국화 100송이' },
      // 근조 특수상품
      { id: 'FB-S', name: '근조꽃바구니', price: 55000, description: '흰색 꽃 바구니' },
      { id: 'FS-1', name: '근조장구 1단', price: 100000, description: '1단 스탠드' },
      { id: 'FS-2', name: '근조장구 2단', price: 120000, description: '2단 스탠드' }
    ],
    ribbonTemplates: ['삼가 고인의 명복을 빕니다', '그리운 당신을 추모합니다', '삼가 조의를 표합니다']
  },
  
  '축하화환': {
    displayName: '축하화환',
    backendCategory: '개업.행사', // 주로 개업/행사용
    icon: '🎊',
    products: [
      { id: 'CW-40', name: '축하화환 40송이', price: 55000, description: '거베라 40송이' },
      { id: 'CW-60', name: '축하화환 60송이', price: 67000, description: '거베라 60송이' },
      { id: 'CW-80', name: '축하화환 80송이', price: 81000, description: '거베라 80송이' },
      { id: 'CW-100', name: '축하화환 100송이', price: 95000, description: '거베라 100송이' }
    ],
    ribbonTemplates: ['개업을 축하합니다', '번창하세요', '대박나세요', '축하합니다', '결혼을 축하합니다']
  },
  
  '화분·난': {
    displayName: '화분·난',
    backendCategory: '개업.행사', // 개업 선물용이 주 용도
    icon: '🪴',
    products: [
      // 화분류
      { id: 'PL-DESK', name: '탁상용 금전수', price: 58000, description: '미니 사이즈' },
      { id: 'PL-M', name: '금전수', price: 97000, description: '중형 사이즈' },
      { id: 'PL-L', name: '대형 해피트리', price: 109000, description: '대형 사이즈' },
      { id: 'PL-ARECA', name: '아레카야자', price: 97000, description: '공기정화 식물' },
      { id: 'PL-XL', name: '초대형 뱅갈고무나무', price: 148000, description: '1.5m 초대형' },
      // 난류
      { id: 'OR-E', name: '동양란', price: 72000, description: '고급 동양란' },
      { id: 'OR-W', name: '서양란', price: 86000, description: '고급 서양란' },
      { id: 'OR-P', name: '호접란', price: 98000, description: '프리미엄 호접란' },
      { id: 'OR-MAN', name: '만천홍', price: 86000, description: '번영과 성공' },
      { id: 'OR-GRAD', name: '그라데이션 호접란', price: 86000, description: '우아한 그라데이션' }
    ],
    ribbonTemplates: ['개업을 축하합니다', '번창하세요', '승진을 축하합니다', '무궁한 발전을 빕니다']
  },
  
  '꽃상품': {
    displayName: '꽃상품',
    backendCategory: '승진.기념일', // 기념일/이벤트용
    icon: '💐',
    products: [
      // 꽃다발
      { id: 'BQ-S', name: '꽃다발 소', price: 60000, description: '소형 꽃다발' },
      { id: 'BQ-M', name: '꽃다발 중', price: 100000, description: '중형 꽃다발' },
      { id: 'BQ-L', name: '꽃다발 대', price: 150000, description: '대형 꽃다발' },
      // 꽃바구니
      { id: 'BS-M', name: '꽃바구니', price: 80000, description: '혼합 꽃바구니' },
      { id: 'BS-PREM', name: '프리미엄 꽃바구니', price: 120000, description: '프리미엄 꽃바구니' }
    ],
    ribbonTemplates: ['축하합니다', '사랑합니다', '감사합니다', '생일 축하합니다']
  }
}

/**
 * Client UI 카테고리 키 배열 (타입 안정성)
 */
export const CLIENT_UI_CATEGORY_KEYS = Object.keys(CLIENT_UI_CATEGORIES) as Array<keyof typeof CLIENT_UI_CATEGORIES>

/**
 * 스마트 매핑 함수 - 상품명과 용도를 고려한 자동 매핑
 */
export function smartMapToBackendCategory(
  clientCategory: string, 
  productName: string,
  ribbonText?: string
): string {
  const category = CLIENT_UI_CATEGORIES[clientCategory as keyof typeof CLIENT_UI_CATEGORIES]
  
  if (!category) {
    return '개업.행사' // 기본값
  }
  
  // 리본 문구로 용도 파악
  const isWedding = ribbonText?.includes('결혼') || productName.includes('결혼')
  const isFuneral = ribbonText?.includes('명복') || ribbonText?.includes('조의') || productName.includes('근조')
  const isPromotion = ribbonText?.includes('승진') || productName.includes('승진')
  
  // 근조 상품은 무조건 장례식
  if (clientCategory === '근조화환' || isFuneral) {
    return '장례식 화환'
  }
  
  // 축하화환 - 용도별 분류
  if (clientCategory === '축하화환') {
    if (isWedding) return '결혼식 화환'
    return '개업.행사' // 기본적으로 개업/행사용
  }
  
  // 화분·난 - 용도별 분류
  if (clientCategory === '화분·난') {
    if (isPromotion) return '승진.기념일'
    return '개업.행사' // 기본적으로 개업용
  }
  
  // 꽃상품 - 용도별 분류
  if (clientCategory === '꽃상품') {
    if (isWedding) return '결혼식 화환'
    if (isPromotion) return '승진.기념일'
    return '승진.기념일' // 기본적으로 기념일용
  }
  
  return category.backendCategory
}