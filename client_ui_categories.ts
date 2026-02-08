// Client UI 카테고리 정의 - 화원가 기준 (화환은 등급별, 나머지는 실제 상품명)
const CLIENT_UI_CATEGORIES = {
  '근조화환': {
    displayName: '근조화환',
    backendCategory: '장례식 화환',
    icon: '🏵️',
    products: [
      // 화환 5등급
      { id: 'FW-E', name: '근조화환 실속형', price: 45000, grade: '실속', description: '실속형 (4.5만원)' },
      { id: 'FW-B', name: '근조화환 기본형', price: 60000, grade: '기본', description: '기본형 (6만원)' },
      { id: 'FW-S', name: '근조화환 대형', price: 70000, grade: '대', description: '대형 (7만원)' },
      { id: 'FW-P', name: '근조화환 특대형', price: 80000, grade: '특대', description: '특대형 (8만원)' },
      { id: 'FW-D', name: '근조화환 프리미엄', price: 90000, grade: '프리미엄', description: '프리미엄 (9만원)' },
      // 기타 상품
      { id: 'FB-S', name: '근조꽃바구니', price: 38500, grade: null, description: '근조꽃바구니' },
      { id: 'FS-1', name: '근조장구 1단', price: 70000, grade: null, description: '1단 스탠드' },
      { id: 'FS-2', name: '근조장구 2단', price: 84000, grade: null, description: '2단 스탠드' }
    ],
    ribbonTemplates: ['삼가 고인의 명복을 빕니다', '그리운 당신을 추모합니다', '삼가 조의를 표합니다']
  },
  '축하화환': {
    displayName: '축하화환',
    backendCategory: '개업.행사',
    icon: '🎊',
    products: [
      // 화환 5등급만
      { id: 'CW-E', name: '축하화환 실속형', price: 45000, grade: '실속', description: '실속형 (4.5만원)' },
      { id: 'CW-B', name: '축하화환 기본형', price: 60000, grade: '기본', description: '기본형 (6만원)' },
      { id: 'CW-S', name: '축하화환 대형', price: 70000, grade: '대', description: '대형 (7만원)' },
      { id: 'CW-P', name: '축하화환 특대형', price: 80000, grade: '특대', description: '특대형 (8만원)' },
      { id: 'CW-D', name: '축하화환 프리미엄', price: 90000, grade: '프리미엄', description: '프리미엄 (9만원)' }
    ],
    ribbonTemplates: ['개업을 축하합니다', '번창하세요', '대박나세요', '축하합니다', '결혼을 축하합니다']
  },
  '화분·난': {
    displayName: '화분·난',
    backendCategory: '개업.행사',
    icon: '🪴',
    products: [
      // 실제 상품명과 화원가
      { id: 'PL-1', name: '탁상용 금전수', price: 40600, grade: null, description: '미니 사이즈' },
      { id: 'PL-2', name: '금전수', price: 67900, grade: null, description: '중형 사이즈' },
      { id: 'PL-3', name: '대형 해피트리', price: 76300, grade: null, description: '대형 사이즈' },
      { id: 'PL-4', name: '아레카야자', price: 67900, grade: null, description: '공기정화 식물' },
      { id: 'PL-5', name: '초대형 뱅갈고무나무', price: 103600, grade: null, description: '1.5m 초대형' },
      { id: 'OR-1', name: '동양란', price: 50400, grade: null, description: '고급 동양란' },
      { id: 'OR-2', name: '서양란', price: 60200, grade: null, description: '고급 서양란' },
      { id: 'OR-3', name: '호접란', price: 68600, grade: null, description: '프리미엄 호접란' },
      { id: 'OR-4', name: '만천홍', price: 60200, grade: null, description: '번영과 성공' },
      { id: 'OR-5', name: '그라데이션 호접란', price: 60200, grade: null, description: '우아한 그라데이션' }
    ],
    ribbonTemplates: ['개업을 축하합니다', '번창하세요', '승진을 축하합니다', '무궁한 발전을 빕니다']
  },
  '꽃상품': {
    displayName: '꽃상품',
    backendCategory: '승진.기념일',
    icon: '💐',
    products: [
      // 실제 상품명과 화원가
      { id: 'FL-1', name: '꽃다발 소', price: 42000, grade: null, description: '소형 꽃다발' },
      { id: 'FL-2', name: '꽃다발 중', price: 70000, grade: null, description: '중형 꽃다발' },
      { id: 'FL-3', name: '꽃다발 대', price: 105000, grade: null, description: '대형 꽃다발' },
      { id: 'FL-4', name: '꽃바구니', price: 56000, grade: null, description: '혼합 꽃바구니' },
      { id: 'FL-5', name: '프리미엄 꽃바구니', price: 84000, grade: null, description: '프리미엄 꽃바구니' }
    ],
    ribbonTemplates: ['축하합니다', '사랑합니다', '감사합니다', '생일 축하합니다']
  }
} as const