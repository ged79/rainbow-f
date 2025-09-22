'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { 
  formatCurrency, 
  formatDate, 
  formatPhone,
  homepageToUnifiedOrder,
  clientToUnifiedOrder
} from '@flower/shared/utils'
import { UnifiedOrder, Store } from '@flower/shared/types'
import toast from 'react-hot-toast'
import { 
  Clock, 
  MapPin, 
  Phone, 
  Package, 
  AlertCircle,
  CheckCircle,
  Building,
  User,
  Camera,
  Truck,
  Calendar
} from 'lucide-react'
import AdminDeliveryCompleteModal from '@/components/AdminDeliveryCompleteModal'

export default function OrderAssignmentPage() {
  const [unassignedOrders, setUnassignedOrders] = useState<UnifiedOrder[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [selectedOrder, setSelectedOrder] = useState<UnifiedOrder | null>(null)
  const [selectedStore, setSelectedStore] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [deliveryCompleteOrder, setDeliveryCompleteOrder] = useState<UnifiedOrder | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const { data: clientOrders } = await supabase
        .from('orders')
        .select(`
          *,
          sender_store:stores!sender_store_id(*),
          receiver_store:stores!receiver_store_id(*)
        `)
        .is('receiver_store_id', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      const { data: homepageOrders } = await supabase
        .from('customer_orders')
        .select('*')
        .is('assigned_store_id', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      const { data: storeList } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'active')
        .eq('is_open', true)

      const unified = [
        ...(clientOrders || []).map(clientToUnifiedOrder),
        ...(homepageOrders || []).map(homepageToUnifiedOrder)
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      setUnassignedOrders(unified)
      setStores(storeList || [])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedOrder || !selectedStore || isAssigning) return
    
    setIsAssigning(true)
    try {
      if (selectedOrder.source === 'homepage') {
        const { error: assignError } = await supabase
        .from('customer_orders')
        .update({ 
        assigned_store_id: selectedStore,
        status: 'assigned',
        assigned_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id)
        
        if (assignError) throw assignError
      
      // 트리거가 실행된 후 실제 생성된 주문 확인
      const { data: checkOrder } = await supabase
        .from('orders')
        .select('order_number')
        .eq('sender_store_id', '00000000-0000-0000-0000-000000000000')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      console.log('Original order:', selectedOrder.order_number)
      console.log('Created order:', checkOrder?.order_number)
      } else {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            receiver_store_id: selectedStore,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedOrder.id)
        
        if (updateError) throw updateError
      }
      
      toast.success('배정 완료')
      setSelectedOrder(null)
      setSelectedStore('')
      loadData()
    } catch (error: any) {
      console.error('배정 오류:', error)
      toast.error(`배정 실패: ${error.message || '알 수 없는 오류'}`)
    } finally {
      setIsAssigning(false)
    }
  }

  const getEligibleStores = (order: UnifiedOrder) => {
    const addr = order.recipient.address
    
    let searchSido = addr.sido?.trim()
    let searchSigungu = addr.sigungu?.trim()
    let searchDong = addr.dong?.trim()
    
    if ((!searchSido || !searchSigungu) && addr.detail) {
      const detailAddr = addr.detail.trim()
      
      if (detailAddr.includes('충북') || detailAddr.includes('충청북도')) {
        searchSido = '충청북도'
      }
      if (detailAddr.includes('충남') || detailAddr.includes('충청남도')) {
        searchSido = '충청남도'
      }
      if (detailAddr.includes('서울')) {
        searchSido = '서울특별시'
      }
      if (detailAddr.includes('부산')) {
        searchSido = '부산광역시'
      }
      
      if (detailAddr.includes('영동군')) {
        searchSigungu = '영동군'
      } else if (detailAddr.includes('옥천군')) {
        searchSigungu = '옥천군'
      } else if (detailAddr.includes('보은군')) {
        searchSigungu = '보은군'
      } else if (detailAddr.includes('금산군')) {
        searchSigungu = '금산군'
      } else if (detailAddr.includes('해운대구')) {
        searchSigungu = '해운대구'
      } else if (detailAddr.includes('강남구')) {
        searchSigungu = '강남구'
      }
      
      const dongMatch = detailAddr.match(/(\S+[읍면동])/)
      if (dongMatch) {
        searchDong = dongMatch[1]
      }
    }
    
    return stores.filter(store => {
      if (!store.service_areas || store.service_areas.length === 0) return false
      
      return store.service_areas.some(area => {
        const normalizedArea = area.trim()
        
        if (normalizedArea.includes('전체')) {
          if (searchSido && normalizedArea.includes(searchSido)) return true
        }
        
        if (searchSido && searchSigungu) {
          if (normalizedArea === `${searchSido} ${searchSigungu}`) return true
          if (normalizedArea === `충북 ${searchSigungu}`) return true
        }
        if (normalizedArea === searchSigungu) return true
        
        if (searchSigungu && normalizedArea.includes(searchSigungu)) return true
        if (searchDong && normalizedArea.includes(searchDong)) return true
        
        return false
      })
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">미배정 주문</h1>
        <p className="text-gray-600 mt-2">배정 대기중인 주문을 화원에 할당합니다</p>
      </div>

      {unassignedOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <p className="text-xl text-gray-600">모든 주문이 배정되었습니다</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              대기중 주문 ({unassignedOrders.length})
            </h2>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {unassignedOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedOrder?.id === order.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        #{order.order_number}
                      </span>
                      {order.source === 'homepage' && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                          홈페이지
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    {/* 주문자 정보 추가 */}
                    <div className="flex items-center gap-2 text-blue-700">
                      <User className="h-4 w-4" />
                      <span className="font-medium">주문: {order.customer.name} ({formatPhone(order.customer.phone)})</span>
                    </div>
                    {/* 수령인 정보 */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>받는분: {order.recipient.name} ({formatPhone(order.recipient.phone)})</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="flex-1">
                        {order.recipient.address.sido} {order.recipient.address.sigungu} 
                        {order.recipient.address.dong} {order.recipient.address.detail}
                      </span>
                    </div>
                    {/* 상품명 추가 */}
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {order.products?.map(p => p.name).join(', ') || order.product?.name || '상품정보 없음'}
                      </span>
                    </div>
                    {/* 배달일시 추가 */}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {order.delivery?.date || formatDate(order.created_at)} 
                        {order.delivery?.time || 
                         (order.delivery?.status === 'express' ? 
                          `즉시(${new Date(new Date(order.created_at).getTime() + 3*60*60*1000).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})}까지)` : 
                          '시간미정')
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">
                        {formatCurrency(order.payment?.total || order.pricing?.final_amount || 0)}
                      </span>
                    </div>
                    {/* 배송완료 버튼 추가 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeliveryCompleteOrder(order)
                      }}
                      className="mt-2 w-full py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <Truck className="h-4 w-4" />
                      배송완료 처리
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Store Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            {selectedOrder ? (
              <>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  화원 선택
                </h2>
                
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium text-gray-700">선택된 주문</p>
                  <p className="text-sm text-gray-600 mt-1">
                    #{selectedOrder.order_number} - {selectedOrder.recipient.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedOrder.recipient.address.sido} {selectedOrder.recipient.address.sigungu} 
                    {selectedOrder.recipient.address.dong}
                  </p>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {getEligibleStores(selectedOrder).length > 0 ? (
                    getEligibleStores(selectedOrder).map((store) => (
                      <div
                        key={store.id}
                        onClick={() => setSelectedStore(store.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedStore === store.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{store.business_name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              배송 지역: {store.service_areas?.join(', ')}
                            </p>
                            {store.commission_rate && (
                              <p className="text-xs text-gray-500 mt-1">
                                수수료율: {(store.commission_rate * 100).toFixed(0)}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p>이 지역을 배송할 수 있는 화원이 없습니다</p>
                      <p className="text-sm mt-2">다른 지역의 화원을 선택하세요</p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleAssign}
                  disabled={!selectedStore || isAssigning}
                  className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  {isAssigning ? '배정 중...' : '주문 배정하기'}
                </button>
              </>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <AlertCircle className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <p>왼쪽에서 주문을 선택해주세요</p>
              </div>
            )}
          </div>
        </div>
      )}

      {deliveryCompleteOrder && (
        <AdminDeliveryCompleteModal
          isOpen={!!deliveryCompleteOrder}
          onClose={() => setDeliveryCompleteOrder(null)}
          orderId={deliveryCompleteOrder.id}
          orderNumber={deliveryCompleteOrder.order_number}
          source={deliveryCompleteOrder.source}
          onComplete={() => {
            setDeliveryCompleteOrder(null)
            loadData()
          }}
        />
      )}
    </div>
  )
}