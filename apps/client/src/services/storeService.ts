import { createClient } from '@/lib/supabase/client'
import type { Store } from '@flower/shared/types'
export interface StoreSearchParams {
  sido?: string
  sigungu?: string
  dong?: string
  limit?: number
}
export interface StoreSearchResult {
  stores: Store[]
  count: number
  searchTime?: number
}
class StoreService {
  private cache: Map<string, { data: StoreSearchResult; timestamp: number }> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5분
  /**
   * 지역별 가맹점 검색 (캐시 적용)
   */
  async searchByLocation(params: StoreSearchParams): Promise<StoreSearchResult> {
    const cacheKey = JSON.stringify(params)
    // 캐시 확인
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    const startTime = performance.now()
    try {
      const response = await fetch(`/api/stores/search?${new URLSearchParams(
        Object.entries(params)
          .filter(([_, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      )}`)
      if (!response.ok) {
        throw new Error('Store search failed')
      }
      const data = await response.json()
      const searchTime = performance.now() - startTime
      const result: StoreSearchResult = {
        stores: data.data || [],
        count: data.count || 0,
        searchTime
      }
      // 캐시 저장
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    } catch (error) {
      throw error
    }
  }
  /**
   * 가맹점 자동완성 검색
   */
  async autocomplete(query: string, field: 'business_name' | 'owner_name' | 'phone' = 'business_name'): Promise<Store[]> {
    if (query.length < 2) return []
    try {
      const response = await fetch('/api/stores/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, field })
      })
      if (!response.ok) {
        throw new Error('Autocomplete failed')
      }
      const data = await response.json()
      return data.data || []
    } catch (error) {
      return []
    }
  }
  /**
   * 내 주변 가맹점 찾기 (Geolocation API 활용)
   */
  async findNearbyStores(coords?: { latitude: number; longitude: number }): Promise<Store[]> {
    try {
      // 좌표가 없으면 현재 위치 가져오기
      const position = coords || await this.getCurrentPosition()
      // 좌표를 주소로 변환 (Kakao Maps API 필요)
      const address = await this.reverseGeocode(position.latitude, position.longitude)
      // 주소 기반 검색
      const result = await this.searchByLocation({
        sido: address.sido,
        sigungu: address.sigungu,
        limit: 10
      })
      return result.stores
    } catch (error) {
      return []
    }
  }
  /**
   * 현재 위치 가져오기
   */
  private getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
        (error) => reject(error),
        { timeout: 10000, enableHighAccuracy: true }
      )
    })
  }
  /**
   * 좌표를 주소로 변환 (Kakao Maps API 연동 필요)
   */
  private async reverseGeocode(lat: number, lng: number): Promise<{ sido: string; sigungu: string }> {
    // TODO: Kakao Maps API 연동
    // 임시로 서울 강남구 반환
    return {
      sido: '서울특별시',
      sigungu: '강남구'
    }
  }
  /**
   * 인기 가맹점 조회
   */
  async getPopularStores(limit: number = 10): Promise<Store[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('status', 'active')
      .eq('is_open', true)
      .order('rating', { ascending: false })
      .order('total_orders_received', { ascending: false })
      .limit(limit)
    if (error) {
      return []
    }
    return data || []
  }
  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear()
  }
}
export const storeService = new StoreService()
