// 카테고리별 상품을 종류별로 그룹화한 데이터
// 카테고리 페이지에서 사용 (메인 페이지는 기존 categoryProducts.ts 사용)

export const productsByCategoryGrouped = {
  // 개업·행사 - 종류별 그룹화
  opening: {
    "축하화환": [
      { id: 'cel-wreath-100', name: '100송이 축하화환', price: 95000, image: '/100송이 축하화환.jpg', description: '거베라 100송이' },
      { id: 'cel-wreath-80', name: '80송이 축하화환', price: 81000, image: '/80송이 축하화환.jpg', description: '거베라 80송이' },
      { id: 'cel-wreath-60', name: '60송이 축하화환', price: 67000, image: '/60송이 축하화환.jpg', description: '거베라 60송이' },
      { id: 'cel-wreath-40', name: '실속 축하화환', price: 55000, image: '/실속 축하화환.jpg', description: '거베라 40-50송이' }
    ],
    "개업화분": [
      { id: 'plant-money-tree', name: '백만장자의 금전수', price: 97000, image: '/백만장자 금전수.jpg', description: '행운을 부르는 나무' },
      { id: 'plant-happy-tree', name: '대형 해피트리', price: 109000, image: '/대형 해피트리.jpg', description: '행복을 부르는 나무' },
      { id: 'plant-rubber-tree', name: '1.5m 초대형 뱅갈 고무나무', price: 148000, image: '/뱅갈 고무나무.jpg', description: '초대형 사이즈' },
      { id: 'plant-money-desk', name: '탁상용 금전수', price: 58000, image: '/탁상용 금전수.jpg', description: '탁상용 미니 사이즈' }
    ],
    "공기정화식물": [
      { id: 'plant-areca', name: '아레카야자', price: 97000, image: '/아레카야자.jpg', description: '공기정화 식물' }
    ]
  },
  
  // 결혼식 - 종류별 그룹화
  wedding: {
    "축하화환": [
      { id: 'wed-wreath-100', name: '100송이 축하화환', price: 95000, image: '/100송이 축하화환.jpg', description: '거베라 100송이' },
      { id: 'wed-wreath-80', name: '80송이 축하화환', price: 81000, image: '/80송이 축하화환.jpg', description: '거베라 80송이' },
      { id: 'wed-wreath-60', name: '60송이 축하화환', price: 67000, image: '/60송이 축하화환.jpg', description: '거베라 60송이' },
      { id: 'wed-wreath-40', name: '실속 축하화환', price: 55000, image: '/실속 축하화환.jpg', description: '거베라 40-50송이' }
    ],
    "꽃다발": [
      { id: 'bouquet-basic', name: '꽃다발', price: 60000, image: '/꽃다발.jpg', description: '계절 꽃다발' },
      { id: 'bouquet-large', name: '대형꽃다발', price: 150000, image: '/프리미엄 꽃다발.jpg', description: '프리미엄 대형 꽃다발' }
    ],
    "꽃바구니": [
      { id: 'flower-basket', name: '꽃바구니', price: 80000, image: '/꽃바구니.jpg', description: '다양한 꽃 바구니' }
    ]
  },
  
  // 장례식 - 종류별 그룹화
  funeral: {
    "근조화환": [
      { id: 'funeral-wreath-100', name: '100송이 근조화환', price: 95000, image: '/100송이 근조화환.jpg', description: '흰 국화 100송이' },
      { id: 'funeral-wreath-80', name: '80송이 근조화환', price: 81000, image: '/80송이 근조화환.jpg', description: '흰 국화 80송이' },
      { id: 'funeral-wreath-60', name: '60송이 근조화환', price: 67000, image: '/60송이 근조화환.jpg', description: '흰 국화 60송이' },
      { id: 'funeral-wreath-40', name: '실속 근조화환', price: 55000, image: '/실속 근조화환.jpg', description: '흰 국화 40송이' }
    ],
    "근조장구": [
      { id: 'funeral-stand-2', name: '근조장구 2단', price: 120000, image: '/근조장구 2단.jpg', description: '2단 스탠드' },
      { id: 'funeral-stand-1', name: '근조장구 1단', price: 100000, image: '/근조장구 1단.jpg', description: '1단 스탠드' }
    ],
    "근조꽃바구니": [
      { id: 'funeral-basket', name: '근조꽃바구니', price: 55000, image: '/근조꽃바구니.jpg', description: '흰색 꽃 바구니' }
    ]
  },
  
  // 승진·기념일 - 종류별 그룹화  
  celebration: {
    "호접란": [
      { id: 'orchid-gold', name: '황금 호접란 (금공주)', price: 86000, image: '/주황 호접란.jpg', description: '행운과 부귀영화' },
      { id: 'orchid-gradient', name: '그라데이션 호접란', price: 86000, image: '/호접란.jpg', description: '우아한 그라데이션' }
    ],
    "탁상용화분": [
      { id: 'money-tree-desk', name: '탁상용 금전수', price: 58000, image: '/탁상용 금전수.jpg', description: '미니 금전수' }
    ],
    "특별한선물": [
      { id: 'mancheonhong', name: '만천홍', price: 86000, image: '/만천홍.jpg', description: '번영과 성공' }
    ]
  }
}

// 카테고리 이름 매핑
export const categoryNames = {
  opening: '개업·행사',
  wedding: '결혼식',
  funeral: '장례식',
  celebration: '승진·기념일'
}

// 각 카테고리의 서브 카테고리 순서 정의 (진열 순서)
export const subCategoryOrder = {
  opening: ['축하화환', '개업화분', '공기정화식물'],
  wedding: ['축하화환', '꽃다발', '꽃바구니'],
  funeral: ['근조화환', '근조장구', '근조꽃바구니'],
  celebration: ['호접란', '탁상용화분', '특별한선물']
}
