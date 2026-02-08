import { useState, useEffect, useCallback, useRef } from 'react'
import { storeService, type StoreSearchParams, type StoreSearchResult } from '@/services/storeService'
import type { Store } from '@flower/shared'
import { showToast } from '@/lib/toast'
interface UseStoreSearchOptions {
  autoSearch?: boolean
  debounceMs?: number
  onSuccess?: (result: StoreSearchResult) => void
  onError?: (error: Error) => void
}
export function useStoreSearch(
  initialParams?: StoreSearchParams,
  options: UseStoreSearchOptions = {}
) {
  const [params, setParams] = useState<StoreSearchParams>(initialParams || {})
  const [result, setResult] = useState<StoreSearchResult>({ stores: [], count: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const debounceTimer = useRef<NodeJS.Timeout>()
  const { autoSearch = true, debounceMs = 500, onSuccess, onError } = options
  const search = useCallback(async (searchParams?: StoreSearchParams) => {
    const finalParams = searchParams || params
    // 검색 조건이 없으면 스킵
    if (!finalParams.sido && !finalParams.sigungu) {
      return
    }
    try {
      setIsLoading(true)
      setError(null)
      const searchResult = await storeService.searchByLocation(finalParams)
      setResult(searchResult)
      if (onSuccess) {
        onSuccess(searchResult)
      }
      // 검색 시간이 느리면 경고
      if (searchResult.searchTime && searchResult.searchTime > 1000) {
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      if (onError) {
        onError(error)
      } else {
        showToast.error('가맹점 검색에 실패했습니다')
      }
    } finally {
      setIsLoading(false)
    }
  }, [params, onSuccess, onError])
  // 파라미터 변경 시 자동 검색
  useEffect(() => {
    if (!autoSearch) return
    // Debounce 처리
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      search()
    }, debounceMs)
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [params, autoSearch, debounceMs, search])
  const updateParams = useCallback((newParams: Partial<StoreSearchParams>) => {
    setParams(prev => ({ ...prev, ...newParams }))
  }, [])
  const reset = useCallback(() => {
    setParams({})
    setResult({ stores: [], count: 0 })
    setError(null)
  }, [])
  return {
    params,
    result,
    stores: result.stores,
    count: result.count,
    isLoading,
    error,
    search,
    updateParams,
    reset
  }
}
// 자동완성 Hook
export function useStoreAutocomplete(
  field: 'business_name' | 'owner_name' | 'phone' = 'business_name'
) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout>()
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const results = await storeService.autocomplete(query, field)
        setSuggestions(results)
      } catch (error) {
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300)
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query, field])
  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    clearSuggestions: () => setSuggestions([])
  }
}
// 주변 가맹점 Hook
export function useNearbyStores() {
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const findNearby = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const nearbyStores = await storeService.findNearbyStores()
      setStores(nearbyStores)
      if (nearbyStores.length === 0) {
        showToast.info('주변에 가맹점이 없습니다')
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      if (error.message.includes('Geolocation')) {
        showToast.error('위치 권한을 허용해주세요')
      } else {
        showToast.error('주변 가맹점 검색에 실패했습니다')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])
  return {
    stores,
    isLoading,
    error,
    findNearby
  }
}
