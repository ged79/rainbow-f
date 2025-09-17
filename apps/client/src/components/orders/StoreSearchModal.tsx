'use client'

import { useState } from 'react'
import { Search, MapPin, Store, Star, Phone } from 'lucide-react'
import { useStoreSearch, useNearbyStores } from '@/hooks/useStoreSearch'
import type { Store as StoreType } from '@flower/shared'

interface StoreSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (store: StoreType) => void
  recipientAddress?: {
    sido: string
    sigungu: string
    dong?: string
  }
}

export default function StoreSearchModal({
  isOpen,
  onClose,
  onSelect,
  recipientAddress
}: StoreSearchModalProps) {
  const [selectedTab, setSelectedTab] = useState<'location' | 'nearby'>('location')
  
  // 지역 검색
  const {
    stores,
    count,
    isLoading: isSearching,
    updateParams,
    search
  } = useStoreSearch(
    recipientAddress ? {
      sido: recipientAddress.sido,
      sigungu: recipientAddress.sigungu,
      dong: recipientAddress.dong
    } : undefined,
    {
      autoSearch: true,
      debounceMs: 300
    }
  )
  
  // 주변 가맹점
  const {
    stores: nearbyStores,
    isLoading: isFindingNearby,
    findNearby
  } = useNearbyStores()

  if (!isOpen) return null

  const handleStoreSelect = (store: StoreType) => {
    onSelect(store)
    onClose()
  }

  const displayStores = selectedTab === 'location' ? stores : nearbyStores
  const isLoading = selectedTab === 'location' ? isSearching : isFindingNearby

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">수주 화원 선택</h2>
          <p className="text-sm text-gray-600 mt-1">
            배송 지역의 화원을 선택해주세요
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setSelectedTab('location')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              selectedTab === 'location'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="inline-block w-4 h-4 mr-1" />
            지역으로 찾기
          </button>
          <button
            onClick={() => {
              setSelectedTab('nearby')
              if (nearbyStores.length === 0) {
                findNearby()
              }
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              selectedTab === 'nearby'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Search className="inline-block w-4 h-4 mr-1" />
            내 주변 화원
          </button>
        </div>

        {/* Search Form (지역 검색 탭) */}
        {selectedTab === 'location' && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="시/도"
                value={recipientAddress?.sido || ''}
                onChange={(e) => updateParams({ sido: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <input
                type="text"
                placeholder="시/군/구"
                value={recipientAddress?.sigungu || ''}
                onChange={(e) => updateParams({ sigungu: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button
                onClick={() => search()}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
              >
                검색
              </button>
            </div>
            {recipientAddress && (
              <p className="text-xs text-gray-500 mt-2">
                배송지: {recipientAddress.sido} {recipientAddress.sigungu} {recipientAddress.dong}
              </p>
            )}
          </div>
        )}

        {/* Store List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">검색 중...</p>
            </div>
          ) : displayStores.length === 0 ? (
            <div className="text-center py-8">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">
                {selectedTab === 'location' 
                  ? '해당 지역에 가맹점이 없습니다' 
                  : '주변에 가맹점이 없습니다'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayStores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleStoreSelect(store)}
                  className="w-full p-4 bg-white border rounded-lg hover:bg-gray-50 hover:border-pink-300 transition text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {store.business_name}
                        </h3>
                        {store.is_open ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            영업중
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            휴업중
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        대표: {store.owner_name}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {store.address.sido} {store.address.sigungu} {store.address.dong}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} />
                          {store.phone}
                        </span>
                        {store.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-500" />
                            {store.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        총 {store.total_orders_received || 0}건 수주
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {selectedTab === 'location' && count > 20 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              총 {count}개 중 상위 20개 표시
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
