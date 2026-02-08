/**
 * Area formatting utilities for consistent area name handling
 */

export interface AreaComponents {
  sido: string
  sigungu: string
  dong?: string
}

/**
 * Normalize area name to consistent format
 * @example "서울 강남" -> "서울특별시 강남구"
 */
export function normalizeAreaName(area: string | AreaComponents): string {
  if (typeof area === 'string') {
    return normalizeAreaString(area)
  }
  
  const sido = normalizeSido(area.sido)
  const sigungu = normalizeSigungu(area.sigungu)
  
  return `${sido} ${sigungu}`.trim()
}

/**
 * Parse area string into components
 */
export function parseAreaString(area: string): AreaComponents {
  const parts = area.trim().split(/\s+/)
  
  return {
    sido: parts[0] || '',
    sigungu: parts[1] || '',
    dong: parts[2]
  }
}

/**
 * Check if two area names match (handles variations)
 */
export function areasMatch(area1: string, area2: string): boolean {
  const normalized1 = normalizeAreaName(area1)
  const normalized2 = normalizeAreaName(area2)
  
  // Exact match
  if (normalized1 === normalized2) return true
  
  // Partial match (one contains the other)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true
  }
  
  return false
}

/**
 * Get all possible area variations for search
 */
export function getAreaVariations(components: AreaComponents): string[] {
  const variations = new Set<string>()
  
  // Full variations
  variations.add(`${components.sido} ${components.sigungu}`)
  variations.add(`${normalizeSido(components.sido)} ${components.sigungu}`)
  variations.add(`${components.sido} ${normalizeSigungu(components.sigungu)}`)
  variations.add(`${normalizeSido(components.sido)} ${normalizeSigungu(components.sigungu)}`)
  
  // Short variations
  const shortSido = getShortSido(components.sido)
  const shortSigungu = getShortSigungu(components.sigungu)
  
  if (shortSido) {
    variations.add(`${shortSido} ${components.sigungu}`)
    variations.add(`${shortSido} ${normalizeSigungu(components.sigungu)}`)
  }
  
  if (shortSigungu) {
    variations.add(`${components.sido} ${shortSigungu}`)
    variations.add(`${normalizeSido(components.sido)} ${shortSigungu}`)
  }
  
  if (shortSido && shortSigungu) {
    variations.add(`${shortSido} ${shortSigungu}`)
  }
  
  return Array.from(variations)
}

// Helper functions
function normalizeAreaString(area: string): string {
  const parts = area.trim().split(/\s+/)
  
  if (parts.length === 0) return area
  
  const sido = normalizeSido(parts[0])
  const sigungu = parts[1] ? normalizeSigungu(parts[1]) : ''
  
  return `${sido} ${sigungu}`.trim()
}

function normalizeSido(sido: string): string {
  // Handle common abbreviations
  const sidoMap: Record<string, string> = {
    '서울': '서울특별시',
    '서울시': '서울특별시',
    '부산': '부산광역시',
    '부산시': '부산광역시',
    '대구': '대구광역시',
    '대구시': '대구광역시',
    '인천': '인천광역시',
    '인천시': '인천광역시',
    '광주': '광주광역시',
    '광주시': '광주광역시',
    '대전': '대전광역시',
    '대전시': '대전광역시',
    '울산': '울산광역시',
    '울산시': '울산광역시',
    '세종': '세종특별자치시',
    '세종시': '세종특별자치시',
    '경기': '경기도',
    '강원': '강원도',
    '충북': '충청북도',
    '충남': '충청남도',
    '전북': '전라북도',
    '전남': '전라남도',
    '경북': '경상북도',
    '경남': '경상남도',
    '제주': '제주특별자치도',
    '제주도': '제주특별자치도'
  }
  
  return sidoMap[sido] || sido
}

function normalizeSigungu(sigungu: string): string {
  // Add 구/시/군 suffix if missing
  if (!sigungu.match(/(시|구|군)$/)) {
    // Common patterns
    if (sigungu.match(/(강남|강북|강동|강서|관악|광진|구로|금천|노원|도봉|동대문|동작|마포|서대문|서초|성동|성북|송파|양천|영등포|용산|은평|종로|중|중랑)/)) {
      return sigungu + '구'
    }
    // Default to 시
    return sigungu + '시'
  }
  
  return sigungu
}

function getShortSido(sido: string): string | null {
  const shortMap: Record<string, string> = {
    '서울특별시': '서울',
    '부산광역시': '부산',
    '대구광역시': '대구',
    '인천광역시': '인천',
    '광주광역시': '광주',
    '대전광역시': '대전',
    '울산광역시': '울산',
    '세종특별자치시': '세종',
    '경기도': '경기',
    '강원도': '강원',
    '충청북도': '충북',
    '충청남도': '충남',
    '전라북도': '전북',
    '전라남도': '전남',
    '경상북도': '경북',
    '경상남도': '경남',
    '제주특별자치도': '제주'
  }
  
  return shortMap[sido] || null
}

function getShortSigungu(sigungu: string): string | null {
  // Remove 구/시/군 suffix for short version
  const match = sigungu.match(/^(.+)(시|구|군)$/)
  return match ? match[1] : null
}
