// Client 카테고리 매핑
export const CATEGORY_MAPPING: Record<string, string> = {
  // 화환
  '축하화환': '축하화환',
  '근조화환': '근조화환',
  '근조장구': '근조화환',
  '근조꽃바구니': '근조화환',
  
  // 화분·난
  '개업화분': '화분·난',
  '공기정화식물': '화분·난',
  '호접란': '화분·난',
  '탁상용화분': '화분·난',
  '특별한선물': '화분·난',
  '다육식물': '화분·난',  // 추가
  
  // 꽃상품
  '꽃다발': '꽃상품',
  '꽃바구니': '꽃상품'
}

export function mapToClientCategory(adminCategory2: string): string {
  return CATEGORY_MAPPING[adminCategory2] || '기타'
}
