'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useStore } from '@/stores/useStore'
import { apiService } from '@/services/api'
import { 
  Package, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock,
  MapPin,
  Calendar,
  ChevronRight,
  Plus,
  Store
} from 'lucide-react'
import type { OrderWithStores } from '@flower/shared/types'
import { formatCurrency } from '@flower/shared/utils'
import { ORDER_STATUS } from '@flower/shared/constants'
import toast from 'react-hot-toast'

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const store = useStore()
  const currentStore = store.currentStore
  const [orders, setOrders] = useState<OrderWithStores[]>([])
  const [loading, setLoading] = useState(true)
  
  // URL 파라미터에서 type 읽기, 없으면 'all'
  const typeParam = searchParams.get('type')
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>(
    typeParam === 'sent' ? 'sent' : 
    typeParam === 'received' ? 'received' : 
    'all'
  )

  useEffect(() => {
    if (!currentStore) {
      router.push('/login')
      return
    }
    loadOrders()
  }, [currentStore, filter])

  const loadOrders = async () => {
    try {
      const result = await apiService.getOrders({
        type: filter === 'all' ? undefined : filter === 'sent' ? 'sent' : 'received',
        status: undefined,
        page: 1,
        limit: 100
      })
      
      if (result.data) {
        setOrders(result.data)
      }
    } catch (error) {
      toast.error('주문을 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case ORDER_STATUS.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case ORDER_STATUS.ACCEPTED: return 'bg-blue-100 text-blue-700 border-blue-300'
      case ORDER_STATUS.COMPLETED: return 'bg-green-100 text-green-700 border-green-300'
      case ORDER_STATUS.CANCELLED: return 'bg-red-100 text-red-700 border-red-300'
      case ORDER_STATUS.REJECTED: return 'bg-gray-100 text-gray-700 border-gray-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      [ORDER_STATUS.PENDING]: '대기중',
      [ORDER_STATUS.ACCEPTED]: '배송중',
      [ORDER_STATUS.COMPLETED]: '완료',
      [ORDER_STATUS.CANCELLED]: '취소됨',
      [ORDER_STATUS.REJECTED]: '거절됨'
    }
    return labels[status] || status
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case ORDER_STATUS.PENDING: return <Clock size={12} />
      case ORDER_STATUS.ACCEPTED: return <CheckCircle size={12} />
      case ORDER_STATUS.COMPLETED: return <Package size={12} />
      case ORDER_STATUS.CANCELLED: return <XCircle size={12} />
      case ORDER_STATUS.REJECTED: return <XCircle size={12} />
      default: return null
    }
  }

  const getOrderType = (order: OrderWithStores) => {
    if (order.sender_store_id === currentStore?.id) {
      return '발주'
    } else if (order.receiver_store_id === currentStore?.id) {
      return '수주'
    }
    return '알 수 없음'
  }

  const getOrderTypeColor = (order: OrderWithStores) => {
    if (order.sender_store_id === currentStore?.id) {
      return 'bg-blue-100 text-blue-700'
    } else if (order.receiver_store_id === currentStore?.id) {
      return 'bg-green-100 text-green-700'
    }
    return 'bg-gray-100 text-gray-700'
  }


  const handleFilterChange = (newFilter: 'all' | 'sent' | 'received') => {
    setFilter(newFilter)
    // URL 파라미터도 업데이트
    if (newFilter === 'all') {
      router.push('/orders')
    } else {
      router.push(`/orders?type=${newFilter}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">주문 관리</h1>
            <p className="text-gray-600 mt-1">
              {filter === 'all' && '모든 주문을 관리합니다'}
              {filter === 'sent' && '보낸 주문을 관리합니다'}
              {filter === 'received' && '받은 주문을 관리합니다'}
            </p>
          </div>
          <button
            onClick={() => router.push('/orders/new')}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
          >
            <Plus size={20} />
            새 주문
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-4">
          <div className="flex border-b">
            <button
              onClick={() => handleFilterChange('all')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                filter === 'all'
                  ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              전체 ({orders.length})
            </button>
            <button
              onClick={() => handleFilterChange('sent')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                filter === 'sent'
                  ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              발주 ({orders.filter(o => o.sender_store_id === currentStore?.id).length})
            </button>
            <button
              onClick={() => handleFilterChange('received')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                filter === 'received'
                  ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              수주 ({orders.filter(o => o.receiver_store_id === currentStore?.id).length})
            </button>
          </div>
        </div>

        {/* Compact Cards */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">
              {filter === 'all' && '주문이 없습니다'}
              {filter === 'sent' && '보낸 주문이 없습니다'}
              {filter === 'received' && '받은 주문이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                {/* Compact Card */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getOrderTypeColor(order)}`}>
                        {getOrderType(order)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {order.order_number}
                    </span>
                  </div>

                  {/* Store & Product & Recipient Info */}
                  <div className="text-sm mb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      {order.sender_store_id === currentStore?.id ? (
                        <>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">수령인:</span>
                            <span className="font-medium text-gray-900">{order.recipient?.name}</span>
                          </div>
                          <span className="text-gray-400">/</span>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">수주화원:</span>
                            <span className="text-gray-700">{order.receiver_store?.business_name || '본사배정대기'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">발주화원:</span>
                            <span className="font-medium text-gray-900">{order.sender_store?.business_name}</span>
                          </div>
                          <span className="text-gray-400">/</span>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">수령인:</span>
                            <span className="text-gray-700">{order.recipient?.name}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-gray-500">상품:</span>
                      <span className="text-gray-700">{order.product?.name} ({order.product?.quantity}개)</span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <MapPin size={12} className="text-gray-400" />
                    <span className="truncate">
                      {order.recipient?.address?.sido} {order.recipient?.address?.sigungu} {order.recipient?.address?.detail}
                    </span>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(order.payment?.total || 0)}
                    </span>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} />
                      <span>
                        {new Date(order.created_at).toLocaleDateString('ko-KR')}
                      </span>
                      <span>
                        {new Date(order.created_at).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
