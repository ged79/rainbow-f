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
  User
} from 'lucide-react'

export default function OrderAssignmentPage() {
  const [unassignedOrders, setUnassignedOrders] = useState<UnifiedOrder[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [selectedOrder, setSelectedOrder] = useState<UnifiedOrder | null>(null)
  const [selectedStore, setSelectedStore] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)

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
    return <div className="flex items-center justify-center h-64">로딩중...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">미배정 주문 관리</h1>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">미배정 전체</p>
            <p className="text-3xl font-bold text-orange-600">{unassignedOrders.length}건</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Client 미배정</p>
            <p className="text-2xl font-bold text-blue-600">
              {unassignedOrders.filter(o => o.source === 'client').length}건
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Homepage 미배정</p>
            <p className="text-2xl font-bold text-green-600">
              {unassignedOrders.filter(o => o.source === 'homepage').length}건
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">활성 화원</p>
            <p className="text-2xl font-bold">{stores.length}개</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">발주/수주</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문정보</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">배송일시</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객/수령인</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">배송지</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">배정</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {unassignedOrders.map((order) => (
              <React.Fragment key={`${order.source}-${order.id}`}>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <div>
                      <Link href={order.source === 'homepage' ? '#' : `/florists/${order.stores?.sender?.id}`}>
                        <p className="text-xs font-medium hover:text-blue-600 cursor-pointer">
                          {order.source === 'homepage' ? '홈페이지' : 
                           order.stores?.sender?.business_name || '미확인'}
                        </p>
                      </Link>
                      <p className="text-xs text-gray-500">↓ 수주 대기</p>
                    </div>
                  </td>
                  
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium">{order.order_number}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </td>

                  <td className="px-3 py-3">
                    <p className="text-sm font-medium">
                      {new Date(order.delivery.date).toLocaleDateString('ko-KR', {
                        month: 'numeric',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">{order.delivery.time}</p>
                  </td>

                  <td className="px-3 py-3">
                    <div>
                      <p className="text-xs font-medium">{order.customer.name}</p>
                      <p className="text-xs text-gray-500">{formatPhone(order.customer.phone)}</p>
                      <p className="text-xs text-gray-400">↓</p>
                      <p className="text-xs font-medium">{order.recipient.name}</p>
                      <p className="text-xs text-gray-500">{formatPhone(order.recipient.phone)}</p>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="text-xs">
                      <p className="font-medium">
                        {order.recipient.address.sido} {order.recipient.address.sigungu}
                      </p>
                      <p className="text-gray-600">
                        {order.recipient.address.dong}
                      </p>
                      {order.recipient.address.detail && (
                        <p className="text-gray-500 truncate max-w-[150px]" title={order.recipient.address.detail}>
                          {order.recipient.address.detail}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <Link href={`/orders/${order.id}?source=${order.source}`}>
                      <div className="cursor-pointer hover:text-blue-600">
                        <p className="text-sm font-medium">{order.product.name}</p>
                        <p className="text-xs text-gray-600">{order.product.type}</p>
                      </div>
                    </Link>
                  </td>

                  <td className="px-3 py-3">
                    <p className="text-sm font-bold">
                      {formatCurrency(order.pricing.final_amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      수수료: {formatCurrency(order.pricing.commission)}
                    </p>
                  </td>

                  <td className="px-3 py-3">
                    <button
                      onClick={() => {
                        if (selectedOrder?.id === order.id) {
                          setSelectedOrder(null)
                          setSelectedStore('')
                        } else {
                          setSelectedOrder(order)
                          setSelectedStore('')
                        }
                      }}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      {selectedOrder?.id === order.id ? '닫기' : '배정하기'}
                    </button>
                  </td>
                </tr>
                
                {selectedOrder?.id === order.id && (
                  <tr>
                    <td colSpan={8} className="bg-gray-50 px-6 py-4">
                      <div className="max-w-4xl">
                        <h3 className="font-semibold mb-3">화원 선택</h3>
                        {getEligibleStores(order).length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {getEligibleStores(order).map((store) => (
                              <div
                                key={store.id}
                                onClick={() => setSelectedStore(store.id)}
                                className={`p-3 rounded border-2 cursor-pointer transition ${
                                  selectedStore === store.id
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-medium">{store.business_name}</span>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {store.owner_name} | 잔액: {formatCurrency(store.points_balance)}
                                    </p>
                                  </div>
                                  {store.is_open ? (
                                    <span className="text-xs text-green-600">영업중</span>
                                  ) : (
                                    <span className="text-xs text-gray-500">영업종료</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-red-50 text-red-600 rounded">
                            해당 지역 서비스 가능한 화원이 없습니다
                          </div>
                        )}
                        {selectedStore && (
                          <div className="mt-4 flex gap-2">
                            <button
                              className="px-4 py-2 bg-gray-300 rounded"
                              onClick={() => {
                                setSelectedOrder(null)
                                setSelectedStore('')
                              }}
                            >
                              취소
                            </button>
                            <button
                              className="px-4 py-2 bg-green-500 text-white rounded"
                              onClick={handleAssign}
                              disabled={isAssigning}
                            >
                              {isAssigning ? '배정중...' : '배정 완료'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        
        {unassignedOrders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            미배정 주문이 없습니다
          </div>
        )}
      </div>
    </div>
  )
}