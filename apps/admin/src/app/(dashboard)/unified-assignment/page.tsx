'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { formatCurrency, formatDate } from '@/shared/utils'
import type { OrderWithStores, Store } from '@/shared/types'
import toast from 'react-hot-toast'
import { playNotificationSound } from '@/utils/notification'
import { 
  Clock, 
  MapPin, 
  Package, 
  Building,
  Users,
  Home,
  AlertCircle
} from 'lucide-react'

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
  total_amount: number
  status: string
  assigned_store_id: string | null
  created_at: string
}

interface StoreWithPricing extends Store {
  minOrderAmount?: number
  productAvailable?: boolean
  productPrice?: number
}

export default function UnifiedAssignmentPage() {
  const [b2bOrders, setB2bOrders] = useState<OrderWithStores[]>([])
  const [b2cOrders, setB2cOrders] = useState<CustomerOrder[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [selectedStore, setSelectedStore] = useState<string>('')
  const [orderType, setOrderType] = useState<'b2b' | 'b2c'>('b2b')
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [eligibleStores, setEligibleStores] = useState<StoreWithPricing[]>([])
  const [priceWarning, setPriceWarning] = useState<string>('')
  const [loadingStores, setLoadingStores] = useState(false)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const [prevOrderCount, setPrevOrderCount] = useState(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000) // 5초마다 체크
    
    // 알림음 권한 요청
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      // B2B 주문 (Client → 본사)
      const { data: b2b } = await supabase
        .from('orders')
        .select(`
          *,
          sender_store:stores!sender_store_id(*),
          receiver_store:stores!receiver_store_id(*)
        `)
        .is('receiver_store_id', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      // B2C 주문 (Homepage → Admin)
      const { data: b2c } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      // 활성 화원
      const { data: storeList } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'active')
        .eq('is_open', true)

      setB2bOrders(b2b || [])
      setB2cOrders(b2c || [])
      setStores(storeList || [])
      
      // 새 주문 확인
      const totalOrders = (b2b?.length || 0) + (b2c?.length || 0)
      if (totalOrders > prevOrderCount && prevOrderCount > 0) {
        setNewOrderAlert(true)
        
        // 알림음 재생
        playNotificationSound()
        
        // 브라우저 알림
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('새 주문이 접수되었습니다!', {
            body: `미배정 주문: ${totalOrders}건`,
            icon: '/flower-icon.png'
          })
        }
        
        toast.success(`새 주문이 접수되었습니다! (${totalOrders}건)`)
        
        setTimeout(() => setNewOrderAlert(false), 5000)
      }
      setPrevOrderCount(totalOrders)
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      toast.error('데이터를 불러올 수 없습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignment = async () => {
    if (!selectedOrder || !selectedStore) {
      toast.error('주문과 화원을 선택하세요')
      return
    }

    try {
      if (orderType === 'b2b') {
        // B2B: receiver_store_id만 업데이트
        const { error } = await supabase
          .from('orders')
          .update({ receiver_store_id: selectedStore })
          .eq('id', selectedOrder.id)
        
        if (error) throw error
      } else {
        // B2C: orders 테이블에 새 주문 생성
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
              original_price: selectedOrder.original_price,
              product_id: selectedOrder.product_id // 상품 ID 추가
            },
            payment: {
              subtotal: selectedOrder.mapped_price,
              commission: Math.floor(selectedOrder.mapped_price * 0.25),
              total: selectedOrder.total_amount,
              points_used: 0
            },
            delivery_date: selectedOrder.delivery_date,
            delivery_time: selectedOrder.delivery_time,
            status: 'pending'
          })
          .select()
          .single()

        if (orderError) throw orderError

        // customer_orders 상태 업데이트
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
      }

      toast.success('주문이 배정되었습니다')
      setShowModal(false)
      setSelectedOrder(null)
      setSelectedStore('')
      await loadData()
    } catch (error) {
      console.error('배정 실패:', error)
      toast.error('배정에 실패했습니다')
    }
  }

  const openAssignModal = async (order: any, type: 'b2b' | 'b2c') => {
    setSelectedOrder(order)
    setOrderType(type)
    setShowModal(true)
    setPriceWarning('')
    setEligibleStores([])
    setLoadingStores(true)
    
    try {
      const eligible = await getFilteredStores(order, type)
      setEligibleStores(eligible)
      
      if (eligible.length === 0) {
        const orderPrice = type === 'b2b'
          ? order.payment?.subtotal || order.product?.price
          : order.mapped_price
        
        setPriceWarning(
          `배정 가능한 화원이 없습니다. ` +
          `(주문금액: ${orderPrice?.toLocaleString()}원)`
        )
      }
    } catch (error) {
      console.error('Error loading eligible stores:', error)
      setPriceWarning('화원 정보를 불러올 수 없습니다.')
    } finally {
      setLoadingStores(false)
    }
  }

  const getFilteredStores = async (order: any, type: 'b2b' | 'b2c') => {
    if (!order) return []
    
    const address = type === 'b2b' 
      ? order.recipient?.address 
      : order.recipient_address

    if (!address?.sido || !address?.sigungu) return []

    const productId = type === 'b2b'
      ? order.product?.product_id
      : order.product_id

    if (!productId) {
      console.warn('상품 ID가 없습니다:', order)
      return []
    }

    // 정확한 지역명
    const fullAreaName = `${address.sido} ${address.sigungu}`

    // 해당 지역 서비스하는 화원 필터링
    const regionalStores = stores.filter(store => 
      store.service_areas?.some(area => area === fullAreaName)
    )

    // 각 화원별 상품 가격 확인
    const eligibleStores: StoreWithPricing[] = []
    
    for (const store of regionalStores) {
      // 지역별 활성화 상태 확인
      const { data: deliveryArea } = await supabase
        .from('store_delivery_areas')
        .select('is_active')
        .eq('store_id', store.id)
        .eq('area_name', fullAreaName)
        .single()

      // 비활성 지역 제외
      if (deliveryArea?.is_active === false) continue

      // 상품별 가격 및 가용성 확인
      const { data: productPricing } = await supabase
        .from('store_area_product_pricing')
        .select('price, is_available, product_name')
        .eq('store_id', store.id)
        .eq('area_name', fullAreaName)
        .eq('product_id', productId)
        .single()

      // 상품 미취급 또는 가격 미설정 제외
      if (!productPricing || productPricing.is_available === false) {
        console.log(`${store.business_name}: ${productId} 미취급 또는 가격 미설정`)
        continue
      }

      // 화원 정보에 가격 추가
      const storeWithPricing: StoreWithPricing = {
        ...store,
        productAvailable: true,
        productPrice: productPricing.price
      }
      
      eligibleStores.push(storeWithPricing)
    }
    
    // 가격순 정렬 (낮은 가격 우선)
    return eligibleStores.sort((a, b) => 
      (a.productPrice || 999999) - (b.productPrice || 999999)
    )
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">
      <div className="text-gray-500">로딩중...</div>
    </div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">미배정 주문</h1>

      {/* Homepage (B2C) 주문 섹션 - 상단 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b bg-green-50">
          <h2 className="font-semibold flex items-center gap-2">
            <Users size={20} />
            홈페이지 주문 (Homepage → Admin) - {b2cOrders.length}건
          </h2>
        </div>
        
        {b2cOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            대기중인 홈페이지 주문이 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">주문번호</th>
                  <th className="px-4 py-3 text-left">상품</th>
                  <th className="px-4 py-3 text-left">고객</th>
                  <th className="px-4 py-3 text-left">배송지</th>
                  <th className="px-4 py-3 text-left">배송일</th>
                  <th className="px-4 py-3 text-left">금액</th>
                  <th className="px-4 py-3 text-left">작업</th>
                </tr>
              </thead>
              <tbody>
                {b2cOrders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{order.order_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img 
                          src={order.product_image} 
                          alt={order.product_name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div>
                          <div className="text-sm">{order.product_name}</div>
                          <div className="text-xs text-gray-500">{order.mapped_category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{order.customer_name}</div>
                      <div className="text-xs text-gray-500">{order.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.recipient_address?.sigungu} {order.recipient_address?.dong}
                    </td>
                    <td className="px-4 py-3 text-sm">{order.delivery_date}</td>
                    <td className="px-4 py-3">{order.total_amount.toLocaleString()}원</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openAssignModal(order, 'b2c')}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        배정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client (B2B) 주문 섹션 - 하단 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b bg-blue-50">
          <h2 className="font-semibold flex items-center gap-2">
            <Building size={20} />
            클라이언트 주문 (Client → 본사) - {b2bOrders.length}건
          </h2>
        </div>
        
        {b2bOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            대기중인 클라이언트 주문이 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">주문번호</th>
                  <th className="px-4 py-3 text-left">발주처</th>
                  <th className="px-4 py-3 text-left">상품</th>
                  <th className="px-4 py-3 text-left">배송지</th>
                  <th className="px-4 py-3 text-left">배송일</th>
                  <th className="px-4 py-3 text-left">금액</th>
                  <th className="px-4 py-3 text-left">작업</th>
                </tr>
              </thead>
              <tbody>
                {b2bOrders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{order.order_number}</td>
                    <td className="px-4 py-3">
                      <div>{order.sender_store?.business_name}</div>
                      <div className="text-sm text-gray-500">{order.sender_store?.owner_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{order.product?.name}</div>
                      <div className="text-sm text-gray-500">{order.product?.type}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.recipient?.address?.sigungu} {order.recipient?.address?.dong}
                    </td>
                    <td className="px-4 py-3 text-sm">{order.delivery_date}</td>
                    <td className="px-4 py-3">{formatCurrency(order.payment?.total || 0)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openAssignModal(order, 'b2b')}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        배정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 배정 모달 */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">화원 배정</h2>
            
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">주문번호:</span> {selectedOrder.order_number}
                </div>
                <div>
                  <span className="font-medium">상품:</span> {
                    orderType === 'b2b' ? selectedOrder.product?.name : selectedOrder.product_name
                  }
                </div>
                <div>
                  <span className="font-medium">배송지:</span> {
                    orderType === 'b2b' 
                      ? `${selectedOrder.recipient?.address?.sido} ${selectedOrder.recipient?.address?.sigungu} ${selectedOrder.recipient?.address?.dong}`
                      : `${selectedOrder.recipient_address?.sido} ${selectedOrder.recipient_address?.sigungu} ${selectedOrder.recipient_address?.dong}`
                  }
                </div>
                <div>
                  <span className="font-medium">주문금액:</span> {
                    (orderType === 'b2b' 
                      ? selectedOrder.payment?.subtotal || selectedOrder.product?.price
                      : selectedOrder.mapped_price
                    )?.toLocaleString()
                  }원
                </div>
                <div>
                  <span className="font-medium">유형:</span> 
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                    orderType === 'b2b' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {orderType === 'b2b' ? '클라이언트 주문' : '홈페이지 주문'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">화원 선택</label>
              
              {loadingStores ? (
                <div className="text-center py-4 text-gray-500">
                  화원 확인 중...
                </div>
              ) : priceWarning ? (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                    <AlertCircle size={16} />
                    배정 불가
                  </p>
                  <p className="text-red-500 text-sm mt-1">{priceWarning}</p>
                  <p className="text-xs text-gray-600 mt-2">
                    해당 지역에서 이 상품을 취급하거나 최소 주문금액을 충족하는 화원이 없습니다.
                  </p>
                </div>
              ) : (
                <>
                  <select
                    className="w-full p-2 border rounded mb-2"
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                  >
                    <option value="">화원을 선택하세요 ({eligibleStores.length}개 가능)</option>
                    {eligibleStores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.business_name} - {store.owner_name}
                        {store.productPrice && ` (${store.productPrice.toLocaleString()}원)`}
                      </option>
                    ))}
                  </select>
                  {eligibleStores.length > 0 && (
                    <div className="text-xs text-gray-500">
                      * 가격이 낮은 순으로 정렬되어 있습니다
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => {
                  setShowModal(false)
                  setSelectedOrder(null)
                  setSelectedStore('')
                }}
              >
                취소
              </button>
              <button
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                onClick={handleAssignment}
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
