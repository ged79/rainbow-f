'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { 
  formatCurrency, 
  formatDate, 
  formatPhone,
  homepageToUnifiedOrder,
  clientToUnifiedOrder,
  checkDeliveryStatus
} from '@/shared/utils'
import { UnifiedOrder } from '@/shared/types'
import AdminDeliveryCompleteModal from '@/components/AdminDeliveryCompleteModal'
import toast from 'react-hot-toast'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  TrendingUp, 
  Filter, 
  Search,
  AlertTriangle,
  XCircle,
  MapPin,
  User,
  Phone,
  Building,
  Camera
} from 'lucide-react'

export default function UnifiedOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<UnifiedOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<UnifiedOrder[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [sourceFilter, setSourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modals
  const [selectedOrder, setSelectedOrder] = useState<UnifiedOrder | null>(null)
  const [selectedStore, setSelectedStore] = useState('')
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

  useEffect(() => {
    applyFilters()
  }, [orders, sourceFilter, statusFilter, searchQuery])

  const loadData = async () => {
    const [clientOrders, homepageOrders, storeList] = await Promise.all([
      loadClientOrders(),
      loadHomepageOrders(),
      loadStores()
    ])
    
    const unified = [
      ...homepageOrders.map(homepageToUnifiedOrder),
      ...clientOrders.map(clientToUnifiedOrder)
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    setOrders(unified)
    setStores(storeList)
    setIsLoading(false)
  }

  const loadClientOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        sender_store:stores!sender_store_id(*),
        receiver_store:stores!receiver_store_id(*)
      `)
      .not('receiver_store_id', 'is', null)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
    
    return data || []
  }

  const loadHomepageOrders = async () => {
    const { data } = await supabase
      .from('customer_orders')
      .select('*')
      .not('assigned_store_id', 'is', null)
      .neq('assigned_store_id', '00000000-0000-0000-0000-000000000000')  // 본사 직접 처리 제외
      .neq('status', 'completed')
      .is('linked_order_id', null)
      .order('created_at', { ascending: false })
    
    return data || []
  }

  const loadStores = async () => {
    const { data } = await supabase
      .from('stores')
      .select('*')
      .eq('status', 'active')
    
    return data || []
  }

  const applyFilters = () => {
    let filtered = [...orders]
    
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(o => o.source === sourceFilter)
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(o => 
        o.order_number.toLowerCase().includes(query) ||
        o.customer.name.toLowerCase().includes(query) ||
        o.customer.phone.includes(query) ||
        o.recipient.name.toLowerCase().includes(query) ||
        o.recipient.phone.includes(query)
      )
    }
    
    setFilteredOrders(filtered)
  }

  const handleAssign = async () => {
    if (!selectedOrder || !selectedStore) return
    
    try {
      if (selectedOrder.source === 'homepage') {
        await supabase
          .from('customer_orders')
          .update({ 
            assigned_store_id: selectedStore,
            status: 'assigned',
            assigned_at: new Date().toISOString()
          })
          .eq('id', selectedOrder.id)
      } else {
        await supabase
          .from('orders')
          .update({ 
            receiver_store_id: selectedStore,
            status: 'accepted'
          })
          .eq('id', selectedOrder.id)
      }
      
      toast.success('배정 완료')
      setSelectedOrder(null)
      setSelectedStore('')
      loadData()
    } catch (error) {
      toast.error('배정 실패')
    }
  }

  const stats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    accepted: filteredOrders.filter(o => o.status === 'accepted' || (o as any).status === 'assigned').length,
    overdue: filteredOrders.filter(o => checkDeliveryStatus(o) === 'overdue').length,
    client: filteredOrders.filter(o => o.source === 'client').length,
    homepage: filteredOrders.filter(o => o.source === 'homepage').length,
    revenue: filteredOrders.reduce((sum, o) => sum + o.pricing.commission, 0)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">로딩중...</div>
  }

  return (
    <div>
      {/* Header Stats */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">통합 주문 관리</h1>
        <div className="grid grid-cols-7 gap-3">
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-600">전체</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-600">Client</p>
            <p className="text-xl font-bold text-blue-600">{stats.client}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-600">Homepage</p>
            <p className="text-xl font-bold text-green-600">{stats.homepage}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-600">대기</p>
            <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-600">수락</p>
            <p className="text-xl font-bold text-blue-600">{stats.accepted}</p>
          </div>
          <div className="bg-red-50 p-3 rounded shadow border border-red-200">
            <p className="text-sm text-red-700">지연</p>
            <p className="text-xl font-bold text-red-700">{stats.overdue}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-600">수수료</p>
            <p className="text-lg font-bold">{formatCurrency(stats.revenue)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="flex gap-3">
          <Search className="h-5 w-5 text-gray-500 mt-2" />
          <input
            className="flex-1 px-3 py-2 border rounded"
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="px-3 py-2 border rounded"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">전체</option>
            <option value="client">Client</option>
            <option value="homepage">Homepage</option>
          </select>
          <select 
            className="px-3 py-2 border rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">전체 상태</option>
            <option value="pending">대기</option>
            <option value="accepted">수락</option>
            <option value="assigned">배정</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">배송</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">발주/수주</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">가격</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredOrders.map((order) => {
              const deliveryStatus = checkDeliveryStatus(order)
              const rowClass = deliveryStatus === 'overdue' ? 'bg-red-50' : 
                             deliveryStatus === 'urgent' ? 'bg-orange-50' : ''
              
              return (
                <tr key={`${order.source}-${order.id}`} className={rowClass}>
                  <td className="px-3 py-3">
                    <div>
                      <p className="text-xs font-bold">{order.order_number}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleString('ko-KR', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <span className={`text-xs font-medium ${
                        order.source === 'homepage' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {order.source === 'homepage' ? 'HP' : 'CL'}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div>
                      <p className={`text-sm font-medium ${
                        deliveryStatus === 'overdue' ? 'text-red-700' :
                        deliveryStatus === 'urgent' ? 'text-orange-700' :
                        'text-gray-900'
                      }`}>
                        {new Date(order.delivery.date).toLocaleDateString('ko-KR')}
                      </p>
                      <p className="text-xs text-gray-600">{order.delivery.time}</p>
                      {deliveryStatus === 'overdue' && (
                        <p className="text-xs text-red-600 font-bold">지연!</p>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                      (order as any).status === 'assigned' ? 'bg-indigo-100 text-indigo-700' :
                      order.status === 'preparing' ? 'bg-purple-100 text-purple-700' :
                      order.status === 'delivering' ? 'bg-orange-100 text-orange-700' :
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status === 'pending' ? '대기' :
                       order.status === 'accepted' ? '수락' :
                       (order as any).status === 'assigned' ? '배정' :
                       order.status === 'preparing' ? '준비' :
                       order.status === 'delivering' ? '배송' :
                       order.status === 'completed' ? '완료' : order.status}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <div className="text-sm">
                      <Link href={order.stores.sender?.id ? `/florists/${order.stores.sender.id}` : '#'}>
                        <p className="font-medium hover:text-blue-600 cursor-pointer">
                          {order.stores.sender?.business_name || (order.stores.sender as any)?.name || '홈페이지'}
                        </p>
                      </Link>
                      {order.stores.receiver && (
                        <>
                          <p className="text-xs text-gray-500">↓</p>
                          <Link href={`/florists/${order.stores.receiver.id || order.stores.receiver}`}>
                            <p className="text-green-600 font-medium hover:text-green-700 cursor-pointer">
                              {order.stores.receiver.business_name || (order.stores.receiver as any).name || order.stores.receiver}
                            </p>
                          </Link>
                        </>
                      )}
                      {!order.stores.receiver && order.status === 'pending' && (
                        <p className="text-xs text-red-600">미배정</p>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="text-sm">
                      <p className="font-medium">{order.customer.name}</p>
                      <p className="text-xs text-gray-500">{formatPhone(order.customer.phone)}</p>
                      <p className="text-xs text-gray-400">→ {order.recipient.name}</p>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <Link href={`/orders/${order.id}?source=${order.source}`}>
                      <div className="text-sm cursor-pointer hover:text-blue-600">
                        <p className="font-medium">{order.product.type}</p>
                        <p className="text-xs text-gray-600">{order.product.name}</p>
                        {order.product.ribbon_text && order.product.ribbon_text.length > 0 && (
                          <p className="text-xs text-blue-600">
                            리본: {Array.isArray(order.product.ribbon_text) 
                              ? order.product.ribbon_text.join(', ')
                              : order.product.ribbon_text}
                          </p>
                        )}
                      </div>
                    </Link>
                  </td>

                  <td className="px-3 py-3">
                    <div className="text-sm">
                      {order.source === 'homepage' ? (
                        <>
                          <p className="font-bold">{formatCurrency(order.pricing.homepage_detail?.consumer_price || 0)}</p>
                          {order.pricing.homepage_detail?.discount_amount && order.pricing.homepage_detail.discount_amount > 0 && (
                            <p className="text-xs text-red-600">
                              -{formatCurrency(order.pricing.homepage_detail.discount_amount)}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-bold">{formatCurrency(order.pricing.client_detail?.florist_price || 0)}</p>
                          {order.pricing.client_detail?.additional_fee && order.pricing.client_detail.additional_fee > 0 && (
                            <p className="text-xs text-orange-600">
                              +{formatCurrency(order.pricing.client_detail.additional_fee)}
                            </p>
                          )}
                        </>
                      )}
                      <p className="text-xs text-gray-500">
                        수수료: {formatCurrency(order.pricing.commission)}
                      </p>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      {order.status === 'pending' && !order.stores.receiver && (
                        <button
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          onClick={() => setSelectedOrder(order)}
                        >
                          배정
                        </button>
                      )}
                      {(order.status === 'accepted' || (order as any).status === 'assigned' || order.status === 'preparing' || order.status === 'delivering') && (
                        <button
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center gap-1"
                          onClick={() => setDeliveryCompleteOrder(order)}
                        >
                          <Camera className="w-3 h-3" />
                          배송완료
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Assignment Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">화원 배정</h2>
            
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm"><span className="font-medium">주문:</span> {selectedOrder.order_number}</p>
              <p className="text-sm"><span className="font-medium">상품:</span> {selectedOrder.product.name}</p>
              <p className="text-sm">
                <span className="font-medium">배송지:</span> {' '}
                {selectedOrder.recipient.address.sido} {selectedOrder.recipient.address.sigungu} {selectedOrder.recipient.address.dong}
              </p>
            </div>

            <select
              className="w-full p-2 border rounded mb-4"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              <option value="">화원 선택</option>
              {stores
                .filter(s => {
                  const addr = selectedOrder.recipient.address
                  return s.service_areas?.some((area: string) => 
                    area.includes(addr.sigungu) || area.includes(addr.dong)
                  )
                })
                .map((store: any) => (
                  <option key={store.id} value={store.id}>
                    {store.business_name} - {store.owner_name}
                  </option>
                ))}
            </select>

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
                onClick={handleAssign}
                disabled={!selectedStore}
              >
                배정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Complete Modal */}
      {deliveryCompleteOrder && (
        <AdminDeliveryCompleteModal
          isOpen={true}
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
