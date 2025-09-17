// 카테고리별 상품 데이터 - 로컬 이미지로 업데이트됨
export const productsByCategory = {
  // 개업·행사 (종류별 균형 배치)
  opening: [
    // 1. 화분/나무 (개업 대표 상품)
    { id: 'plant-money-tree', name: '백만장자의 금전수', price: 97000, image: '/백만장자 금전수.jpg', description: '행운을 부르는 나무' },
    // 2. 화환
    { id: 'cel-wreath-100', name: '100송이 축하화환', price: 95000, image: '/100송이 축하화환.jpg', description: '거베라 100송이' },
    // 3. 대형 나무
    { id: 'plant-happy-tree', name: '대형 해피트리', price: 109000, image: '/대형 해피트리.jpg', description: '행복을 부르는 나무' },
    // 4. 공기정화 식물
    { id: 'plant-areca', name: '아레카야자', price: 97000, image: '/아레카야자.jpg', description: '공기정화 식물' },
    // 5. 초대형 식물
    { id: 'plant-rubber-tree', name: '초대형 뱅갈 고무나무', price: 148000, image: '/뱅갈 고무나무.jpg', description: '초대형 사이즈' },
    // 6. 가성비 화환
    { id: 'cel-wreath-60', name: '60송이 축하화환', price: 67000, image: '/60송이 축하화환.jpg', description: '거베라 60송이' },
    // 7. 미니 화분
    { id: 'plant-money-desk', name: '탁상용 금전수', price: 58000, image: '/탁상용 금전수.jpg', description: '탁상용 미니 사이즈' },
    // 나머지 화환
    { id: 'cel-wreath-80', name: '80송이 축하화환', price: 81000, image: '/80송이 축하화환.jpg', description: '거베라 80송이' },
    { id: 'cel-wreath-40', name: '실속 축하화환', price: 55000, image: '/실속 축하화환.jpg', description: '거베라 40-50송이' }
  ],
  
  // 결혼식 (종류별 균형 배치)
  wedding: [
    // 1. 꽃다발 (결혼식 대표 상품)
    { id: 'bouquet-basic', name: '꽃다발', price: 60000, image: '/꽃다발.jpg', description: '계절 꽃다발' },
    // 2. 꽃바구니
    { id: 'flower-basket', name: '꽃바구니', price: 80000, image: '/꽃바구니.jpg', description: '다양한 꽃 바구니' },
    // 3. 프리미엄 화환
    { id: 'wed-wreath-100', name: '100송이 축하화환', price: 95000, image: '/100송이 축하화환.jpg', description: '거베라 100송이' },
    // 4. 대형 꽃다발
    { id: 'bouquet-large', name: '대형꽃다발', price: 150000, image: '/프리미엄 꽃다발.jpg', description: '프리미엄 대형 꽃다발' },
    // 5. 중형 화환
    { id: 'wed-wreath-80', name: '80송이 축하화환', price: 81000, image: '/80송이 축하화환.jpg', description: '거베라 80송이' },
    // 6. 가성비 화환
    { id: 'wed-wreath-60', name: '60송이 축하화환', price: 67000, image: '/60송이 축하화환.jpg', description: '거베라 60송이' },
    // 7. 실속 화환
    { id: 'wed-wreath-40', name: '실속 축하화환', price: 55000, image: '/실속 축하화환.jpg', description: '거베라 40-50송이' }
  ],
  
  // 장례식 (종류별 균형 배치)
  funeral: [
    // 1. 근조화환 (장례식 대표)
    { id: 'funeral-wreath-100', name: '100송이 근조화환', price: 95000, image: '/100송이 근조화환.jpg', description: '흰 국화 100송이' },
    // 2. 근조 바구니
    { id: 'funeral-basket', name: '근조꽃바구니', price: 55000, image: '/근조꽃바구니.jpg', description: '흰색 꽃 바구니' },
    // 3. 근조장구 2단
    { id: 'funeral-stand-2', name: '근조장구 2단', price: 120000, image: '/근조장구 2단.jpg', description: '2단 스탠드' },
    // 4. 근조장구 1단
    { id: 'funeral-stand-1', name: '근조장구 1단', price: 100000, image: '/근조장구 1단.jpg', description: '1단 스탠드' },
    // 5. 중형 근조화환
    { id: 'funeral-wreath-80', name: '80송이 근조화환', price: 81000, image: '/80송이 근조화환.jpg', description: '흰 국화 80송이' },
    // 6. 가성비 근조화환
    { id: 'funeral-wreath-60', name: '60송이 근조화환', price: 67000, image: '/60송이 근조화환.jpg', imageLeft45: '/60송이 근조화환.jpg', imageRight45: '/60송이 근조화환_오른쪽.jpg', description: '흰 국화 60송이' },
    // 7. 실속 근조화환
    { id: 'funeral-wreath-40', name: '실속 근조화환', price: 55000, image: '/실속 근조화환.jpg', description: '흰 국화 40송이' }
  ],
  
  // 승진·기념일 (종류별 균형 배치)
  anniversary: [
    // 1. 호접란 (승진/기념일 대표)
    { id: 'orchid-gold', name: '황금 호접란 (금공주)', price: 86000, image: '/주황 호접란.jpg', description: '행운과 부귀영화' },
    // 2. 탁상용 화분
    { id: 'money-tree-desk', name: '탁상용 금전수', price: 58000, image: '/탁상용 금전수.jpg', description: '미니 금전수' },
    // 3. 만천홍
    { id: 'mancheonhong', name: '만천홍', price: 86000, image: '/만천홍.jpg', description: '번영과 성공' },
    // 4. 그라데이션 호접란
    { id: 'orchid-gradient', name: '그라데이션 호접란', price: 86000, image: '/호접란.jpg', description: '우아한 그라데이션' }
  ]
}