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
      .eq('is_active', true)
      .order('business_name')

    if (error) {
      toast.error('화원 조회 실패')
    } else {
      setStores(data || [])
    }
  }

  const openAssignModal = (order: CustomerOrder) => {
    setSelectedOrder(order)
    setLoadingStores(true)
    setPriceWarning('')
    
    const addressArea = order.recipient_address?.sigungu || order.recipient_address?.dong || ''
    const eligible = stores.filter(store =>
      store.service_areas.some(area => addressArea.includes(area) || area.includes(addressArea))
    )
    
    setEligibleStores(eligible)
    setLoadingStores(false)
  }

  const assignOrder = async () => {
    if (!selectedOrder || !selectedStore) return

    try {
      const store = stores.find(s => s.id === selectedStore)
      if (!store) throw new Error('화원 정보 없음')

      const { error: updateError } = await supabase
        .from('customer_orders')
        .update({
          status: 'assigned',
          assigned_store_id: selectedStore,
          assigned_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id)

      if (updateError) throw updateError

      toast.success('주문이 배정되었습니다')
      setSelectedOrder(null)
      setSelectedStore('')
      fetchOrders()
    } catch (error) {
      console.error(error)
      toast.error('배정 실패')
    }
  }

  const formatDeliveryTime = (time: string) => {
    if (time.startsWith('즉시')) return time
    return time
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">B2C 주문 관리</h1>
      
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
      </div>

      {loading ? (
        <div>로딩중...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-4">
              {/* 헤더: 주문번호 + 상태 */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-600">#{order.order_number}</span>
                  <span className="text-xs text-gray-500">{order.status === 'pending' ? '홈페이지' : ''}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                </span>
              </div>

              {/* 상품명 */}
              <div className="font-bold text-lg mb-2">
                {order.product_name}
              </div>

              {/* 주문자 + 리본문구 */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">👤</span>
                  <span className="text-sm">주문: {order.customer_name} ({order.customer_phone})</span>
                </div>
                {order.ribbon_text && order.ribbon_text.length > 0 && (
                  <span className="text-sm text-purple-600 font-medium">
                    {order.ribbon_text[0]}
                  </span>
                )}
              </div>

              {/* 받는분 */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-600">👤</span>
                <span className="text-sm">받는분: {order.recipient_name} ({order.recipient_phone})</span>
              </div>

              {/* 주소 */}
              <div className="flex items-start gap-2 mb-2">
                <span className="text-gray-600">📍</span>
                <span className="text-sm">
                  {typeof order.recipient_address === 'object' 
                    ? `${order.recipient_address.dong} ${order.recipient_address.detail}`.trim()
                    : order.recipient_address}
                </span>
              </div>

              {/* 배송시간 */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-600">📅</span>
                <span className="text-sm">
                  {order.delivery_date}{formatDeliveryTime(order.delivery_time)}
                </span>
              </div>

              {/* 금액 */}
              <div className="text-2xl font-bold mb-3">
                ₩{order.total_amount.toLocaleString()}
              </div>

              {/* 배송완료 처리 버튼 */}
              {order.status === 'pending' && (
                <button
                  className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center gap-2"
                  onClick={() => openAssignModal(order)}
                >
                  <span>🚚</span>
                  <span>배송완료 처리</span>
                </button>
              )}
              
              {order.status === 'assigned' && (
                <div className="w-full py-2 bg-gray-100 text-gray-500 rounded text-center">
                  배정 완료
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 배정 모달 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">화원 배정</h2>
            
            <div className="mb-4">
              <p>주문번호: {selectedOrder.order_number}</p>
              <p>상품: {selectedOrder.product_name}</p>
              <p>배송지: {typeof selectedOrder.recipient_address === 'object' 
                ? selectedOrder.recipient_address.dong
                : selectedOrder.recipient_address}</p>
            </div>

            {loadingStores ? (
              <div className="text-center py-4 text-gray-500 mb-4">
                화원 확인 중...
              </div>
            ) : (
              <select
                className="w-full p-2 border rounded mb-4"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
              >
                <option value="">화원 선택 ({eligibleStores.length}개 가능)</option>
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
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                onClick={assignOrder}
                disabled={!selectedStore}
              >
                배정하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}