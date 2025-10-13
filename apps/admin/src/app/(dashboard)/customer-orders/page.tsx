'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import toast from 'react-hot-toast'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CustomerOrder {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  recipient_name: string
  recipient_phone: string
  recipient_address: any
  product_id: string
  product_name: string
  product_image: string
  original_price: number
  quantity: number
  mapped_category: string
  mapped_price: number
  delivery_date: string
  delivery_time: string
  ribbon_text: string[]
  special_instructions: string
  discount_amount: number
  points_earned: number
  total_amount: number
  status: string
  assigned_store_id: string | null
  created_at: string
  // 🏺 Funeral 관련 필드 추가
  order_source?: string
  funeral_id?: string
  funeral_data?: {
    sender_name?: string
    ribbon_message?: string
    delivery_address?: string
    funeral_hall?: string
    deceased_name?: string
    original_funeral_order_id?: string
  }
}

interface Store {
  id: string
  business_name: string
  owner_name: string
  phone: string
  service_areas: string[]
  is_open: boolean
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null)
  const [selectedStore, setSelectedStore] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [eligibleStores, setEligibleStores] = useState<Store[]>([])
  const [priceWarning, setPriceWarning] = useState<string>('')
  const [loadingStores, setLoadingStores] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchStores()
  }, [filter])

  const fetchOrders = async () => {
    setLoading(true)
    let query = supabase
      .from('customer_orders')
      .select('*')
      .order('created_at', { ascending: false })

    // 🏺 Funeral 필터 처리 추가
    if (filter === 'funeral') {
      query = query.eq('order_source', 'funeral')
    } else if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (error) {
      toast.error('주문 조회 실패')
      console.error(error)
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

  const fetchStores = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('status', 'active')
      .eq('is_open', true)

    if (!error) {
      setStores(data || [])
    }
  }

  const getEligibleStores = async (order: CustomerOrder) => {
    const isFuneral = order.order_source === 'funeral'
    
    // 🏺 Funeral 주문 특별 처리
    if (isFuneral) {
      const funeralStores = stores.filter(store => 
        store.service_areas?.some(area => 
          area.includes('영동') || 
          area.includes('충북') ||
          area.includes('충청북도')
        )
      )
      return funeralStores
    }

    // 기존 로직 그대로
    if (!order.recipient_address?.sigungu) return []

    const orderPrice = order.mapped_price || 0
    const productType = order.mapped_category
    const address = order.recipient_address

    // OPTIMIZED: Single query using materialized view
    const { data: eligibleData, error } = await supabase
      .from('store_service_coverage')
      .select('store_id, business_name, store_phone, price_basic')
      .eq('area_name', `${address.sido} ${address.sigungu}`)
      .eq('product_type', productType)
      .eq('is_available', true)
      .gte('price_basic', orderPrice)

    if (error) {
      console.error('Coverage view error, using fallback:', error)
      // Fallback to original N+1 method if view fails
      const regionalStores = stores.filter(store =>
        store.service_areas?.some(area =>
          area.includes(address.sigungu)
        )
      )
      const eligible: Store[] = []
      for (const store of regionalStores) {
        const { data: pricingData } = await supabase
          .from('store_area_product_pricing')
          .select('price')
          .eq('store_id', store.id)
          .eq('area_name', `${address.sido} ${address.sigungu}`)
          .eq('product_name', productType)
          .single()
        const minPrice = pricingData?.price || 50000
        if (orderPrice >= minPrice) {
          eligible.push(store)
        }
      }
      return eligible
    }

    // Transform to match Store interface
    const eligible = eligibleData?.map(s => ({
      id: s.store_id,
      business_name: s.business_name,
      owner_name: '', // Not in view, but not used in UI
      phone: s.store_phone,
      service_areas: [`${address.sido} ${address.sigungu}`],
      is_open: true
    })) || []
    
    return eligible
  }

  const openAssignModal = async (order: CustomerOrder) => {
    setSelectedOrder(order)
    setPriceWarning('')
    setEligibleStores([])
    setLoadingStores(true)
    
    try {
      const eligible = await getEligibleStores(order)
      setEligibleStores(eligible)
      
      if (eligible.length === 0) {
        const isFuneral = order.order_source === 'funeral'
        if (isFuneral) {
          setPriceWarning('영동군 지역에 배정 가능한 화원이 없습니다.')
        } else {
          setPriceWarning(
            `주문 금액 (${order.mapped_price?.toLocaleString()}원)이 ` +
            `모든 화원의 최소 금액보다 낮습니다.`
          )
        }
      }
    } catch (error) {
      console.error('Error loading eligible stores:', error)
      setPriceWarning('화원 정보를 불러올 수 없습니다.')
    } finally {
      setLoadingStores(false)
    }
  }

  const assignOrder = async () => {
    if (!selectedOrder || !selectedStore) {
      toast.error('주문과 화원을 선택하세요')
      return
    }

    try {
      console.log('Assigning order:', selectedOrder.order_number)
      
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: selectedOrder.order_number,
          sender_store_id: '00000000-0000-0000-0000-000000000000',
          receiver_store_id: selectedStore,
          type: 'send',
          customer: {
            name: selectedOrder.customer_name,
            phone: selectedOrder.customer_phone
          },
          recipient: {
            name: selectedOrder.recipient_name,
            phone: selectedOrder.recipient_phone,
            address: selectedOrder.recipient_address
          },
          product: {
            type: selectedOrder.mapped_category,
            name: selectedOrder.product_name,
            price: selectedOrder.mapped_price,
            quantity: selectedOrder.quantity,
            ribbon_text: selectedOrder.ribbon_text,
            special_instructions: selectedOrder.special_instructions,
            original_image: selectedOrder.product_image,
            original_name: selectedOrder.product_name,
            original_price: selectedOrder.original_price
          },
          payment: {
            subtotal: selectedOrder.mapped_price,
            commission: Math.floor(selectedOrder.mapped_price * 0.25),
            total: selectedOrder.total_amount,
            points_used: selectedOrder.discount_amount || 0,
            discount_amount: selectedOrder.discount_amount || 0,
            points_earned: selectedOrder.points_earned || 0
          },
          delivery_date: selectedOrder.delivery_date,
          delivery_time: selectedOrder.delivery_time,
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) throw orderError

      const { error: updateError } = await supabase
        .from('customer_orders')
        .update({
          status: 'assigned',
          assigned_store_id: selectedStore,
          assigned_at: new Date().toISOString(),
          linked_order_id: newOrder.id
        })
        .eq('id', selectedOrder.id)

      if (updateError) throw updateError

      const isFuneral = selectedOrder.order_source === 'funeral'
      toast.success(`${isFuneral ? '장례' : ''} 주문이 배정되었습니다`)
      setSelectedOrder(null)
      setSelectedStore('')
      fetchOrders()
    } catch (error) {
      console.error(error)
      toast.error('배정 실패')
    }
  }

  // 🏺 긴급도 체크 함수
  const isUrgent = (order: CustomerOrder): boolean => {
    if (order.order_source === 'funeral') {
      const hoursSince = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60)
      return hoursSince > 3 // 3시간 경과시 긴급
    }
    return false
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">B2C 주문 관리</h1>
      
      {/* 🏺 Funeral 필터 추가 */}
      <div className="mb-4 flex gap-2">
        <button
          className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('pending')}
        >
          대기중
        </button>
        <button
          className={`px-4 py-2 rounded ${filter === 'assigned' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('assigned')}
        >
          배정됨
        </button>
        <button
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('all')}
        >
          전체
        </button>
        <button
          className={`px-4 py-2 rounded ${filter === 'funeral' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('funeral')}
        >
          🏺 장례
        </button>
      </div>

      {loading ? (
        <div>로딩중...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">주문번호</th>
                <th className="px-4 py-3 text-left">상품</th>
                <th className="px-4 py-3 text-left">고객</th>
                <th className="px-4 py-3 text-left">수령인</th>
                <th className="px-4 py-3 text-left">배송일</th>
                <th className="px-4 py-3 text-left">원가</th>
                <th className="px-4 py-3 text-left">할인</th>
                <th className="px-4 py-3 text-left">결제액</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-left">작업</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isFuneral = order.order_source === 'funeral'
                const funeralData = order.funeral_data || {}
                
                return (
                  <tr key={order.id} className={`border-t ${isFuneral ? 'bg-purple-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isFuneral && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                            장례
                          </span>
                        )}
                        <span className="font-mono text-sm">{order.order_number}</span>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img 
                          src={order.product_image || '/placeholder.jpg'} 
                          alt={order.product_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <div>{order.product_name}</div>
                          <div className="text-sm text-gray-500">
                            {order.mapped_category}
                          </div>
                          {isFuneral && funeralData.ribbon_message && (
                            <div className="text-xs text-purple-600 mt-1">
                              "{funeralData.ribbon_message}"
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div>{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.customer_phone}</div>
                      {isFuneral && funeralData.sender_name && funeralData.sender_name !== order.customer_name && (
                        <div className="text-xs text-purple-600">
                          보내는분: {funeralData.sender_name}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-4 py-3">
                      <div>{order.recipient_name}</div>
                      <div className="text-sm text-gray-500">
                        {isFuneral ? 
                          funeralData.funeral_hall || '영동병원장례식장' :
                          order.recipient_address?.sigungu
                        }
                      </div>
                      {isFuneral && funeralData.deceased_name && (
                        <div className="text-xs text-purple-600">
                          故 {funeralData.deceased_name}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-4 py-3">
                      <div>{order.delivery_date}</div>
                      {isFuneral && (
                        <div className="text-xs text-orange-600 font-medium">
                          당일배송
                        </div>
                      )}
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {order.original_price?.toLocaleString() || '-'}원
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="text-sm text-red-600">
                        {order.discount_amount > 0 ? `-${order.discount_amount.toLocaleString()}원` : '-'}
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {order.total_amount.toLocaleString()}원
                      </div>
                      {order.points_earned > 0 && (
                        <div className="text-xs text-green-600">
                          +{order.points_earned.toLocaleString()}P
                        </div>
                      )}
                      {isFuneral && (
                        <div className="text-xs text-purple-600">
                          수수료: {Math.floor(order.total_amount * 0.25).toLocaleString()}원
                        </div>
                      )}
                    </td>
                    
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending' ? '대기' :
                         order.status === 'assigned' ? '배정됨' : '완료'}
                      </span>
                      {isUrgent(order) && (
                        <div className="text-xs text-red-600 mt-1 font-medium">
                          긴급
                        </div>
                      )}
                    </td>
                    
                    <td className="px-4 py-3">
                      {order.status === 'pending' && (
                        <button
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          onClick={() => openAssignModal(order)}
                        >
                          배정
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedOrder.order_source === 'funeral' ? '🏺 장례 화원 배정' : '화원 배정'}
            </h2>
            
            <div className="mb-4">
              <p>주문번호: {selectedOrder.order_number}</p>
              <p>상품: {selectedOrder.product_name}</p>
              {selectedOrder.order_source === 'funeral' ? (
                <p>배송지: {selectedOrder.funeral_data?.funeral_hall || '영동병원장례식장'}</p>
              ) : (
                <p>배송지: {selectedOrder.recipient_address?.sigungu}</p>
              )}
              {selectedOrder.order_source === 'funeral' && (
                <p className="text-purple-600 text-sm mt-2">
                  ⚠️ 장례 주문은 당일 배송이 필요합니다
                </p>
              )}
            </div>

            {loadingStores ? (
              <div className="text-center py-4 text-gray-500 mb-4">
                화원 확인 중...
              </div>
            ) : priceWarning ? (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-red-600 text-sm font-medium">⚠️ 배정 불가</p>
                <p className="text-red-500 text-sm mt-1">{priceWarning}</p>
              </div>
            ) : (
              <select
                className="w-full p-2 border rounded mb-4"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
              >
                <option value="">
                  화원 선택 ({eligibleStores.length}개 가능)
                  {selectedOrder.order_source === 'funeral' && ' - 영동군 지역'}
                </option>
                {eligibleStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.business_name} - {store.owner_name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2 bg-gray-300 rounded"
                onClick={() => {
                  setSelectedOrder(null)
                  setSelectedStore('')
                }}
              >
                취소
              </button>
              <button
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                onClick={assignOrder}
                disabled={!selectedStore || priceWarning !== ''}
              >
                {priceWarning ? '배정 불가' : '배정하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}