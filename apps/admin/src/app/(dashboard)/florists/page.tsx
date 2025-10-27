'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { formatCurrency, formatPhone, REGIONS, matchAreaSido } from '@/shared/utils'
import type { Store } from '@/shared/types'
import { 
  Store as StoreIcon,
  MapPin,
  Phone,
  DollarSign,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Package,
  TrendingUp,
  X
} from 'lucide-react'

interface StoreWithMetrics extends Store {
  delivery_areas?: any[]
  area_pricing?: any[]
  recent_orders?: number
  acceptance_rate?: number
}

interface RegionStores {
  region: string
  stores: StoreWithMetrics[]
  count: number
}

const PRODUCT_TYPES = [
  '근조화환', '축하화환', '관엽화분', '꽃바구니', '꽃다발', '서양란'
]

export default function FloristsPage() {
  const [stores, setStores] = useState<StoreWithMetrics[]>([])
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStore, setSelectedStore] = useState<StoreWithMetrics | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set())

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    try {
      setIsLoading(true)
      
      // 모든 가맹점 로드
      const { data: storeList } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'active')
        .order('business_name')

      if (storeList) {
        // 배달지역 데이터를 한번에 모두 로드
        const storeIds = storeList.map(s => s.id)
        
        const { data: allAreas } = await supabase
          .from('store_delivery_areas')
          .select('*')
          .in('store_id', storeIds)

        const { data: allPricing } = await supabase
          .from('store_area_product_pricing')
          .select('*')
          .in('store_id', storeIds)

        // 각 가맹점에 데이터 매핑
        const storesWithData = storeList.map(store => {
          const areas = allAreas?.filter(a => a.store_id === store.id) || []
          const pricing = allPricing?.filter(p => p.store_id === store.id) || []
          
          return {
            ...store,
            delivery_areas: areas,
            area_pricing: pricing
          }
        })

        setStores(storesWithData)
        
        // 디버깅
        console.log('Loaded stores:', storesWithData.length)
        console.log('Sample store address:', storesWithData[0]?.address)
      }
    } catch (error) {
      console.error('Failed to load stores:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRegionStores = () => {
    let filtered = [...stores]
    
    // 지역 필터
    if (selectedRegion !== 'all') {
      const region = REGIONS.find(r => r.code === selectedRegion)
      if (region) {
        filtered = filtered.filter(store => {
          // address로 확인
          const address = store.address as any
          if (address && typeof address === 'string') {
            return address.includes(region.short) || address.includes(region.long)
          }
          if (address && typeof address === 'object') {
            if (address.sido === region.short) return true
          }
          
          // delivery_areas로도 확인 (긴 형식)
          if (store.delivery_areas && store.delivery_areas.length > 0) {
            return store.delivery_areas.some((area: any) => 
              area.area_name.startsWith(region.long)
            )
          }
          
          return false
        })
      }
    }
    
    // 검색어 필터 적용
    if (searchQuery) {
      filtered = filtered.filter(store => 
        store.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.owner_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return filtered
  }

  const handleStoreClick = async (store: StoreWithMetrics) => {
    setSelectedStore(store)
    setShowDetail(true)
    
    // 이미 로드된 데이터가 있으면 다시 로드하지 않음
    if (store.delivery_areas && store.area_pricing) {
      return
    }
    
    // 상세 데이터 로드 (필요시)
    const { data: areas } = await supabase
      .from('store_delivery_areas')
      .select('*')
      .eq('store_id', store.id)
      .order('area_name')

    const { data: pricing } = await supabase
      .from('store_area_product_pricing')
      .select('*')
      .eq('store_id', store.id)

    setSelectedStore({
      ...store,
      delivery_areas: areas || [],
      area_pricing: pricing || []
    })
  }

  const toggleAreaExpand = (areaName: string) => {
    const newExpanded = new Set(expandedAreas)
    if (newExpanded.has(areaName)) {
      newExpanded.delete(areaName)
    } else {
      newExpanded.add(areaName)
    }
    setExpandedAreas(newExpanded)
  }

  const regionStores = getRegionStores()
  const stats = {
    total: regionStores.length,
    critical: regionStores.filter(s => s.points_balance < 50000).length,
    warning: regionStores.filter(s => s.points_balance >= 50000 && s.points_balance < 100000).length,
    active: regionStores.filter(s => s.is_open).length
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">가맹점 관리</h1>

      {/* 지역 탭 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {REGIONS.map(region => {
          const regionCount = region.code === 'all' 
            ? stores.length 
            : stores.filter(s => {
                const addr = s.address as any
                if (typeof addr === 'string') {
                  return addr.includes(region.short) || addr.includes(region.long)
                }
                if (addr && typeof addr === 'object') {
                  return addr.sido === region.short
                }
                return false
              }).length
          
          return (
            <button
              key={region.code}
              onClick={() => setSelectedRegion(region.code)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors relative ${
                selectedRegion === region.code
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border hover:bg-gray-50'
              }`}
            >
              {region.name}
              <span className={`ml-1 text-xs ${
                selectedRegion === region.code ? 'text-blue-100' : 'text-gray-500'
              }`}>
                ({regionCount})
              </span>
            </button>
          )
        })}
      </div>

      {/* 검색 및 통계 */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="가맹점명, 대표자명 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-2 border rounded-lg w-full text-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <StoreIcon className="h-4 w-4 text-gray-500" />
              <span>전체: {stats.total}개</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>영업중: {stats.active}개</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span>포인트부족: {stats.critical}개</span>
            </div>
          </div>
        </div>
      </div>

      {/* 가맹점 리스트 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">가맹점 정보를 불러오는 중...</div>
        </div>
      ) : regionStores.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          {searchQuery 
            ? `"${searchQuery}"에 대한 검색 결과가 없습니다`
            : selectedRegion !== 'all' 
              ? `${REGIONS.find(r => r.code === selectedRegion)?.name} 지역에 등록된 가맹점이 없습니다`
              : '등록된 가맹점이 없습니다'
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regionStores.map(store => (
            <div
              key={store.id}
              onClick={() => handleStoreClick(store)}
              className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-all ${
                store.points_balance < 50000 ? 'border-l-4 border-red-500' :
                store.points_balance < 100000 ? 'border-l-4 border-yellow-500' :
                'border-l-4 border-green-500'
              }`}
            >
              {/* 가맹점 헤더 */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{store.business_name}</h3>
                  <p className="text-sm text-gray-500">{store.owner_name}</p>
                </div>
                <div className="text-right">
                  {store.is_open ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">영업중</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">영업종료</span>
                  )}
                </div>
              </div>

              {/* 가맹점 정보 */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <span>{formatPhone(store.phone)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span>
                    {typeof store.address === 'string' 
                      ? store.address 
                      : store.address 
                        ? `${store.address.sigungu || ''} ${store.address.dong || ''}`.trim()
                        : '주소 없음'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-gray-400" />
                  <span className={store.points_balance < 50000 ? 'text-red-600 font-medium' : ''}>
                    {formatCurrency(store.points_balance)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-3 w-3 text-gray-400" />
                  <span>
                    서비스: {store.delivery_areas?.length || 0}개 지역
                    {store.area_pricing?.length ? ` (${store.area_pricing.length}개 가격)` : ''}
                  </span>
                </div>
              </div>

              {/* 실적 정보 */}
              <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">발주:</span>
                  <span className="ml-1 font-medium">{store.total_orders_sent}건</span>
                </div>
                <div>
                  <span className="text-gray-500">수주:</span>
                  <span className="ml-1 font-medium">{store.total_orders_received}건</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      {showDetail && selectedStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedStore.business_name}</h2>
                <p className="text-gray-500">{selectedStore.owner_name} | {formatPhone(selectedStore.phone)}</p>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">포인트 잔액</p>
                  <p className={`text-xl font-bold ${
                    selectedStore.points_balance < 50000 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatCurrency(selectedStore.points_balance)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">수수료율</p>
                  <p className="text-xl font-bold">{(selectedStore.commission_rate * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">서비스 지역</p>
                  <p className="text-xl font-bold">{selectedStore.delivery_areas?.length || 0}개</p>
                </div>
              </div>

              {/* 배달 지역 및 가격 */}
              <div>
                <h3 className="font-semibold text-lg mb-4">배달 지역 및 상품 가격</h3>
                
                {!selectedStore.delivery_areas || selectedStore.delivery_areas.length === 0 ? (
                  <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
                    설정된 배달 지역이 없습니다
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedStore.delivery_areas.map((area: any) => {
                      const isExpanded = expandedAreas.has(area.area_name)
                      const areaPricing = selectedStore.area_pricing?.filter(
                        (p: any) => p.area_name === area.area_name
                      )

                      return (
                        <div key={area.id || area.area_name} className="border rounded-lg">
                          {/* 지역 헤더 */}
                          <div
                            onClick={() => toggleAreaExpand(area.area_name)}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              <div>
                                <h4 className="font-medium">{area.area_name}</h4>
                                <p className="text-sm text-gray-500">
                                  최소주문: {formatCurrency(area.min_amount)}
                                </p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {areaPricing?.length || 0}개 상품 설정
                            </div>
                          </div>

                          {/* 가격 테이블 */}
                          {isExpanded && (
                            <div className="border-t p-4 bg-gray-50">
                              {!areaPricing || areaPricing.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                  상품 가격이 설정되지 않았습니다
                                </p>
                              ) : (
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-2">상품명</th>
                                      <th className="text-right py-2">가격</th>
                                      <th className="text-center py-2">상태</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {areaPricing.map((item: any) => (
                                      <tr key={item.product_id} className="border-b">
                                        <td className="py-2">{item.product_name}</td>
                                        <td className="text-right py-2">
                                          {formatCurrency(item.price)}
                                        </td>
                                        <td className="text-center py-2">
                                          <span className={`px-2 py-0.5 text-xs rounded ${
                                            item.is_available 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {item.is_available ? '판매중' : '품절'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}