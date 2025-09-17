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
  clientToUnifiedOrder
} from '@flower/shared/utils'
import { UnifiedOrder } from '@flower/shared/types'
import { 
  CheckCircle, 
  Package, 
  Search,
  Calendar,
  User,
  Phone
} from 'lucide-react'

export default function CompletedOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<UnifiedOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<UnifiedOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadCompletedOrders()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [orders, searchQuery, dateFilter, sourceFilter])

  const loadCompletedOrders = async () => {
    try {
      // Client 완료 주문 (화원이 최종 배송완료한 것)
      const { data: clientOrders } = await supabase
        .from('orders')
        .select(`
          *,
          sender_store:stores!sender_store_id(*),
          receiver_store:stores!receiver_store_id(*)
        `)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })

      // Homepage 완료 주문은 제외 (Client로 이전되어 중복)
      // const { data: homepageOrders } = await supabase
      //   .from('customer_orders')
      //   .select('*')
      //   .eq('status', 'completed')
      //   .order('completed_at', { ascending: false })

      const unified = [
        ...(clientOrders || []).map(clientToUnifiedOrder)
      ].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())

      setOrders(unified)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...orders]
    
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(o => o.source === sourceFilter)
    }
    
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.setHours(0, 0, 0, 0))
      const week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const month = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.updated_at || o.created_at)
        if (dateFilter === 'today') return orderDate >= today
        if (dateFilter === 'week') return orderDate >= week
        if (dateFilter === 'month') return orderDate >= month
        return true
      })
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(o => 
        o.order_number.toLowerCase().includes(query) ||
        o.customer.name.toLowerCase().includes(query) ||
        o.recipient.name.toLowerCase().includes(query)
      )
    }
    
    setFilteredOrders(filtered)
  }

  const stats = {
    total: filteredOrders.length,
    client: filteredOrders.filter(o => o.source === 'client').length,
    homepage: filteredOrders.filter(o => o.source === 'homepage').length,
    revenue: filteredOrders.reduce((sum, o) => sum + o.pricing.commission, 0)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">로딩중...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">완료 주문 내역</h1>
        
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-600">전체 완료</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-600">Client</p>
            <p className="text-2xl font-bold text-blue-600">{stats.client}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-600">Homepage</p>
            <p className="text-2xl font-bold text-green-600">{stats.homepage}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-600">총 수수료</p>
            <p className="text-xl font-bold">{formatCurrency(stats.revenue)}</p>
          </div>
        </div>
      </div>

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
            <option value="all">전체 출처</option>
            <option value="client">Client</option>
            <option value="homepage">Homepage</option>
          </select>
          <select 
            className="px-3 py-2 border rounded"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">전체 기간</option>
            <option value="today">오늘</option>
            <option value="week">1주일</option>
            <option value="month">1개월</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문정보</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">완료일시</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">발주/수주</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객/수령인</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">배송지</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredOrders.map((order) => (
              <tr key={`${order.source}-${order.id}`}>
                <td className="px-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{order.order_number}</p>
                    <span className={`text-xs px-1 py-0.5 rounded ${
                      order.source === 'homepage' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {order.source === 'homepage' ? 'HP' : 'CL'}
                    </span>
                  </div>
                </td>

                <td className="px-3 py-3">
                  <p className="text-sm">
                    {formatDate(order.tracking?.completed_at || order.updated_at || order.created_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.tracking?.completed_at || order.updated_at || order.created_at)
                      .toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </td>

                <td className="px-3 py-3">
                  <Link href={order.stores.sender?.id ? `/florists/${order.stores.sender.id}` : '#'}>
                    <p className="text-sm font-medium hover:text-blue-600 cursor-pointer">
                      {order.stores.sender?.business_name || '홈페이지'}
                    </p>
                  </Link>
                  {order.stores.receiver && (
                    <Link href={`/florists/${order.stores.receiver.id || order.stores.receiver}`}>
                      <p className="text-xs text-green-600 hover:text-green-700 cursor-pointer">
                        → {order.stores.receiver.business_name || order.stores.receiver.name}
                      </p>
                    </Link>
                  )}
                </td>

                <td className="px-3 py-3">
                  <p className="text-sm">{order.customer.name}</p>
                  <p className="text-xs text-gray-500">{formatPhone(order.customer.phone)}</p>
                  <p className="text-xs text-gray-400">→ {order.recipient.name}</p>
                  <p className="text-xs text-gray-500">{formatPhone(order.recipient.phone)}</p>
                </td>

                <td className="px-3 py-3">
                  <div className="text-xs">
                    {typeof order.recipient.address === 'string' ? (
                      <p className="font-medium">{order.recipient.address}</p>
                    ) : (
                      <>
                        <p className="font-medium">
                          {order.recipient.address?.sido} {order.recipient.address?.sigungu}
                        </p>
                        {order.recipient.address?.dong && (
                          <p className="text-gray-600">{order.recipient.address.dong}</p>
                        )}
                        {order.recipient.address?.detail && (
                          <p className="text-gray-500">{order.recipient.address.detail}</p>
                        )}
                      </>
                    )}
                  </div>
                </td>

                <td className="px-3 py-3">
                  <Link href={`/orders/${order.id}?source=${order.source}`}>
                    <div className="cursor-pointer hover:text-blue-600">
                      <p className="text-sm font-medium">{order.product.name}</p>
                      {order.product.original_name && order.product.original_name !== order.product.name && (
                        <p className="text-xs text-gray-500">({order.product.original_name})</p>
                      )}
                      <p className="text-xs text-gray-600">{order.product.type}</p>
                    </div>
                  </Link>
                </td>

                <td className="px-3 py-3">
                  <p className="text-sm font-bold">{formatCurrency(order.pricing.final_amount)}</p>
                  <p className="text-xs text-gray-500">
                    수수료: {formatCurrency(order.pricing.commission)}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            완료된 주문이 없습니다
          </div>
        )}
      </div>
    </div>
  )
}
