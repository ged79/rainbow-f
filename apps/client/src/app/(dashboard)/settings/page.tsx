'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/stores/useStore'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Edit2, Save, X, Package, MapPin, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@flower/shared/utils'
import { getFloristProducts, getProductsByCategory } from '@/lib/services/productService'
import { AREA_OPTIONS } from '@/lib/constants/areas'
import type { StoreDeliveryArea, StoreAreaProductPricing } from '@flower/shared/types'

export default function SettingsPage() {
  const { currentStore } = useStore()
  const [deliveryAreas, setDeliveryAreas] = useState<StoreDeliveryArea[]>([])
  const [areaProductPricing, setAreaProductPricing] = useState<StoreAreaProductPricing[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddAreaModal, setShowAddAreaModal] = useState(false)
  const [newAreaName, setNewAreaName] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [tempMinAmount, setTempMinAmount] = useState(30000)
  const [tempProductPricing, setTempProductPricing] = useState<any[]>([])
  const [dbProducts, setDbProducts] = useState<any[]>([])
  const [productsByCategory, setProductsByCategory] = useState<Record<string, any[]>>({})
  const supabase = createClient()

  useEffect(() => {
    if (currentStore?.id) {
      loadData()
      loadProducts()
    }
  }, [currentStore])

  const loadProducts = async () => {
    try {
      console.log('Loading products for client settings...')
      const products = await getFloristProducts()
      const categorized = await getProductsByCategory()
      console.log('Products loaded:', products.length)
      setDbProducts(products)
      setProductsByCategory(categorized)
      setTempProductPricing(
        products.map(p => ({
          product_id: p.id,
          product_name: p.floristName,
          price: p.floristPrice,
          is_available: true
        }))
      )
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const loadData = async () => {
    try {
      const { data: areas, error: areaError } = await supabase
        .from('store_delivery_areas')
        .select('*')
        .eq('store_id', currentStore?.id)
        .order('area_name')

      if (areaError) throw areaError
      setDeliveryAreas(areas || [])

      const { data: pricing, error: pricingError } = await supabase
        .from('store_area_product_pricing')
        .select('*')
        .eq('store_id', currentStore?.id)

      if (pricingError) throw pricingError
      setAreaProductPricing(pricing || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('데이터를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleEditArea = async (area: StoreDeliveryArea) => {
    setSelectedArea(area.area_name)
    setTempMinAmount(area.min_amount)
    
    // DB에서 상품 가져오기
    if (dbProducts.length === 0) {
      await loadProducts()
    }
    
    const areaPricing = areaProductPricing.filter(p => p.area_name === area.area_name)
    const products = dbProducts.length > 0 ? dbProducts : []
    
    const updatedPricing = products.map(product => {
      const existing = areaPricing.find(p => p.product_id === product.id) as any
      return {
        product_id: product.id,
        product_name: product.floristName,
        price: existing?.price || product.floristPrice,
        is_available: existing?.is_available !== undefined ? existing.is_available : true
      }
    })
    setTempProductPricing(updatedPricing)
    
    setShowModal(true)
  }

  const handleAddArea = async () => {
    if (!newAreaName || !currentStore?.id) return

    try {
      const { data, error } = await supabase
        .from('store_delivery_areas')
        .insert({
          store_id: currentStore.id,
          area_name: newAreaName,
          min_amount: 30000,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('store_service_areas')
        .insert({
          store_id: currentStore.id,
          area_name: newAreaName
        })

      toast.success('배송 지역이 추가되었습니다')
      setShowAddAreaModal(false)
      setNewAreaName('')
      loadData()
    } catch (error) {
      console.error('Failed to add area:', error)
      toast.error('배송 지역 추가에 실패했습니다')
    }
  }

  const handleDeleteArea = async (areaName: string) => {
    if (!confirm(`${areaName} 지역을 삭제하시겠습니까?`)) return

    try {
      await supabase
        .from('store_delivery_areas')
        .delete()
        .eq('store_id', currentStore?.id)
        .eq('area_name', areaName)

      await supabase
        .from('store_service_areas')
        .delete()
        .eq('store_id', currentStore?.id)
        .eq('area_name', areaName)

      await supabase
        .from('store_area_product_pricing')
        .delete()
        .eq('store_id', currentStore?.id)
        .eq('area_name', areaName)

      toast.success('배송 지역이 삭제되었습니다')
      loadData()
    } catch (error) {
      console.error('Failed to delete area:', error)
      toast.error('배송 지역 삭제에 실패했습니다')
    }
  }

  const handleSaveAreaSettings = async () => {
    if (!currentStore?.id || !selectedArea) return

    try {
      await supabase
        .from('store_delivery_areas')
        .update({ min_amount: tempMinAmount })
        .eq('store_id', currentStore.id)
        .eq('area_name', selectedArea)

      await supabase
        .from('store_area_product_pricing')
        .delete()
        .eq('store_id', currentStore.id)
        .eq('area_name', selectedArea)

      const pricingData = tempProductPricing.map(p => ({
        store_id: currentStore.id,
        area_name: selectedArea,
        product_id: p.product_id,
        product_name: p.product_name,
        price: p.price,
        is_available: p.is_available
      }))

      const { error } = await supabase
        .from('store_area_product_pricing')
        .insert(pricingData)

      if (error) throw error

      toast.success('설정이 저장되었습니다')
      setShowModal(false)
      loadData()
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('설정 저장에 실패했습니다')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">설정</h1>
        <p className="text-gray-600">화원 정보 및 배송 지역을 관리합니다</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">배송 가능 지역</h2>
          <button
            onClick={() => setShowAddAreaModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            지역 추가
          </button>
        </div>

        <div className="space-y-3">
          {deliveryAreas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              배송 가능한 지역이 없습니다
            </div>
          ) : (
            deliveryAreas.map((area) => (
              <div key={area.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{area.area_name}</p>
                    <p className="text-sm text-gray-500">
                      최소 주문금액: {formatCurrency(area.min_amount)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditArea(area)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteArea(area.area_name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Area Modal */}
      {showAddAreaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">배송 지역 추가</h3>
            <select
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4"
            >
              <option value="">지역을 선택하세요</option>
              {AREA_OPTIONS.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddAreaModal(false)
                  setNewAreaName('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleAddArea}
                disabled={!newAreaName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Area Settings Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">{selectedArea} 지역 설정</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 주문금액
              </label>
              <input
                type="number"
                value={tempMinAmount}
                onChange={(e) => setTempMinAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
                step="1000"
              />
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">상품별 가격 설정</h4>
              
              {/* 근조화환 */}
              {productsByCategory['근조화환'] && productsByCategory['근조화환'].length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">근조화환</h5>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tempProductPricing
                      .filter(p => productsByCategory['근조화환']?.some(cp => cp.id === p.product_id))
                      .map((product) => (
                        <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={product.is_available}
                              onChange={(e) => {
                                const newPricing = [...tempProductPricing]
                                const index = newPricing.findIndex(p => p.product_id === product.product_id)
                                newPricing[index].is_available = e.target.checked
                                setTempProductPricing(newPricing)
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className={`text-sm ${!product.is_available ? 'text-gray-400 line-through' : ''}`}>
                              {product.product_name}
                            </span>
                          </div>
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) => {
                              const newPricing = [...tempProductPricing]
                              const index = newPricing.findIndex(p => p.product_id === product.product_id)
                              newPricing[index].price = Number(e.target.value)
                              setTempProductPricing(newPricing)
                            }}
                            disabled={!product.is_available}
                            className={`w-20 sm:w-24 px-2 py-1 border rounded text-sm ${!product.is_available ? 'bg-gray-100' : ''}`}
                            step="1000"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 축하화환 */}
              {productsByCategory['축하화환'] && productsByCategory['축하화환'].length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">축하화환</h5>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={tempProductPricing.filter(p => productsByCategory['축하화환']?.some(cp => cp.id === p.product_id)).every(p => p.is_available)}
                        onChange={(e) => {
                          const newPricing = [...tempProductPricing]
                          newPricing.forEach(p => {
                            if (productsByCategory['축하화환']?.some(cp => cp.id === p.product_id)) {
                              p.is_available = e.target.checked
                            }
                          })
                          setTempProductPricing(newPricing)
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      전체 선택
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tempProductPricing
                      .filter(p => productsByCategory['축하화환']?.some(cp => cp.id === p.product_id))
                      .map((product) => (
                        <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={product.is_available}
                              onChange={(e) => {
                                const newPricing = [...tempProductPricing]
                                const index = newPricing.findIndex(p => p.product_id === product.product_id)
                                newPricing[index].is_available = e.target.checked
                                setTempProductPricing(newPricing)
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className={`text-sm ${!product.is_available ? 'text-gray-400 line-through' : ''}`}>
                              {product.product_name}
                            </span>
                          </div>
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) => {
                              const newPricing = [...tempProductPricing]
                              const index = newPricing.findIndex(p => p.product_id === product.product_id)
                              newPricing[index].price = Number(e.target.value)
                              setTempProductPricing(newPricing)
                            }}
                            disabled={!product.is_available}
                            className={`w-20 sm:w-24 px-2 py-1 border rounded text-sm ${!product.is_available ? 'bg-gray-100' : ''}`}
                            step="1000"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 화분·난 */}
              {productsByCategory['화분·난'] && productsByCategory['화분·난'].length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">화분·난</h5>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={tempProductPricing.filter(p => productsByCategory['화분·난']?.some(cp => cp.id === p.product_id)).every(p => p.is_available)}
                        onChange={(e) => {
                          const newPricing = [...tempProductPricing]
                          newPricing.forEach(p => {
                            if (productsByCategory['화분·난']?.some(cp => cp.id === p.product_id)) {
                              p.is_available = e.target.checked
                            }
                          })
                          setTempProductPricing(newPricing)
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      전체 선택
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tempProductPricing
                      .filter(p => productsByCategory['화분·난']?.some(cp => cp.id === p.product_id))
                      .map((product) => (
                        <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={product.is_available}
                              onChange={(e) => {
                                const newPricing = [...tempProductPricing]
                                const index = newPricing.findIndex(p => p.product_id === product.product_id)
                                newPricing[index].is_available = e.target.checked
                                setTempProductPricing(newPricing)
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className={`text-sm ${!product.is_available ? 'text-gray-400 line-through' : ''}`}>
                              {product.product_name}
                            </span>
                          </div>
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) => {
                              const newPricing = [...tempProductPricing]
                              const index = newPricing.findIndex(p => p.product_id === product.product_id)
                              newPricing[index].price = Number(e.target.value)
                              setTempProductPricing(newPricing)
                            }}
                            disabled={!product.is_available}
                            className={`w-20 sm:w-24 px-2 py-1 border rounded text-sm ${!product.is_available ? 'bg-gray-100' : ''}`}
                            step="1000"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 꽃상품 */}
              {productsByCategory['꽃상품'] && productsByCategory['꽃상품'].length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">꽃상품</h5>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={tempProductPricing.filter(p => productsByCategory['꽃상품']?.some(cp => cp.id === p.product_id)).every(p => p.is_available)}
                        onChange={(e) => {
                          const newPricing = [...tempProductPricing]
                          newPricing.forEach(p => {
                            if (productsByCategory['꽃상품']?.some(cp => cp.id === p.product_id)) {
                              p.is_available = e.target.checked
                            }
                          })
                          setTempProductPricing(newPricing)
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      전체 선택
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tempProductPricing
                      .filter(p => productsByCategory['꽃상품']?.some(cp => cp.id === p.product_id))
                      .map((product) => (
                        <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={product.is_available}
                              onChange={(e) => {
                                const newPricing = [...tempProductPricing]
                                const index = newPricing.findIndex(p => p.product_id === product.product_id)
                                newPricing[index].is_available = e.target.checked
                                setTempProductPricing(newPricing)
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className={`text-sm ${!product.is_available ? 'text-gray-400 line-through' : ''}`}>
                              {product.product_name}
                            </span>
                          </div>
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) => {
                              const newPricing = [...tempProductPricing]
                              const index = newPricing.findIndex(p => p.product_id === product.product_id)
                              newPricing[index].price = Number(e.target.value)
                              setTempProductPricing(newPricing)
                            }}
                            disabled={!product.is_available}
                            className={`w-20 sm:w-24 px-2 py-1 border rounded text-sm ${!product.is_available ? 'bg-gray-100' : ''}`}
                            step="1000"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleSaveAreaSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
