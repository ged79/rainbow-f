// Client 상품 목록 - 화원가 기준
export const PRODUCT_LIST = {
  '근조화환': [
    { id: 'FW-E', name: '근조화환 실속형', price: 45000 },
    { id: 'FW-B', name: '근조화환 기본형', price: 60000 },
    { id: 'FW-S', name: '근조화환 대형', price: 70000 },
    { id: 'FW-P', name: '근조화환 특대형', price: 80000 },
    { id: 'FB-S', name: '근조꽃바구니', price: 38500 },
    { id: 'FS-1', name: '근조장구 1단', price: 70000 },
    { id: 'FS-2', name: '근조장구 2단', price: 84000 }
  ],
  '축하화환': [
    { id: 'CW-E', name: '축하화환 실속형', price: 45000 },
    { id: 'CW-B', name: '축하화환 기본형', price: 60000 },
    { id: 'CW-S', name: '축하화환 대형', price: 70000 },
    { id: 'CW-P', name: '축하화환 특대형', price: 80000 }
  ],
  '화분·난': [
    { id: 'PL-1', name: '탁상용 금전수', price: 40600 },
    { id: 'PL-6', name: '백만장자의 금전수', price: 67900 },
    { id: 'PL-3', name: '대형 해피트리', price: 76300 },
    { id: 'PL-4', name: '아레카야자', price: 67900 },
    { id: 'PL-5', name: '초대형 벵갈고무나무', price: 103600 },
    { id: 'OR-6', name: '황금 호접란 (금공주)', price: 60200 },
    { id: 'OR-4', name: '만천홍', price: 60200 },
    { id: 'OR-5', name: '그라데이션 호접란', price: 60200 }
  ],
  '꽃상품': [
    { id: 'FL-1', name: '꽃다발', price: 42000 },
    { id: 'FL-2', name: '대형꽃다발', price: 105000 },
    { id: 'FL-3', name: '꽃바구니', price: 56000 }
  ]
}

// 모든 상품 플랫 리스트
export const ALL_PRODUCTS = Object.values(PRODUCT_LIST).flat()

// 화환 4등급 상품만 추출
export const WREATH_PRODUCTS = [
  ...PRODUCT_LIST['근조화환'].slice(0, 4),
  ...PRODUCT_LIST['축하화환'].slice(0, 4)
]

// 개별 상품 (화환 외)
export const INDIVIDUAL_PRODUCTS = [
  ...PRODUCT_LIST['근조화환'].slice(4),
  ...PRODUCT_LIST['화분·난'],
  ...PRODUCT_LIST['꽃상품']
]

