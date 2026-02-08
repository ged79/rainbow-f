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
} from '@/shared/utils'
import { UnifiedOrder } from '@/shared/types'
import { 
  CheckCircle, 
  Package, 
  Search,
  Calendar,
  User,
  Phone,
  Camera,
  Clock,
  AlertCircle,
  Eye
} from 'lucide-react'

export default function CompletedOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<UnifiedOrder[]>([])
  const [funeralOrders, setFuneralOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<UnifiedOrder[]>([])
  const [filteredFuneralOrders, setFilteredFuneralOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'regular' | 'funeral'>('regular')
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
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
  }, [orders, funeralOrders, searchQuery, sourceFilter])

  const loadCompletedOrders = async () => {
    try {
      const { data: clientOrders } = await supabase
        .from('orders')
        .select(`
          *,
          sender_store:stores!sender_store_id(*),
          receiver_store:stores!receiver_store_id(*)
        `)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })

      const { data: homepageOrders } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('status', 'completed')
        .neq('order_source', 'funeral')  // funeral 제외
        .is('linked_order_id', null)
        .order('updated_at', { ascending: false })

      const { data: funeralCompleteOrders } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('status', 'completed')
        .eq('order_source', 'funeral')  // funeral만
        .order('updated_at', { ascending: false })

      // funeral_orders 테이블 제거, customer_orders로 통합

      const unified = [
        ...(clientOrders || []).map(clientToUnifiedOrder),
        ...(homepageOrders || []).map(homepageToUnifiedOrder)
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const funeralUnified = (funeralCompleteOrders || []).map(homepageToUnifiedOrder)

      setOrders(unified)
      setFuneralOrders(funeralUnified)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    // 일반 주문 필터링
    let filtered = [...orders]
    
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(o => o.source === sourceFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(o => 
        o.order_number.toLowerCase().includes(query) ||
        o.customer.name.toLowerCase().includes(query) ||
        o.recipient.name.toLowerCase().includes(query) ||
        o.recipient.phone.includes(query)
      )
    }
    
    setFilteredOrders(filtered)

    // 부고 주문 필터링
    let filteredFuneral = [...funeralOrders]
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredFuneral = filteredFuneral.filter(o =>
        o.order_number.toLowerCase().includes(query) ||
        o.customer.name.toLowerCase().includes(query) ||
        o.recipient.name.toLowerCase().includes(query) ||
        o.recipient.phone.includes(query)
      )
    }
    
    setFilteredFuneralOrders(filteredFuneral)
  }

  const stats = {
    total: filteredOrders.length,
    today: filteredOrders.filter(o => {
      const completed = new Date((o as any).completion?.completed_at || o.updated_at)
      const today = new Date()
      return completed.toDateString() === today.toDateString()
    }).length,
    client: filteredOrders.filter(o => o.source === 'client').length,
    homepage: filteredOrders.filter(o => o.source === 'homepage').length
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">로딩중...</div>
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl lg:text-2xl font-bold mb-3">배송완료 주문 내역</h1>
        
        {/* 탭 */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab('regular')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'regular'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            일반 주문 ({filteredOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('funeral')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'funeral'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            부고 주문 ({filteredFuneralOrders.length})
          </button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-white p-2 rounded border text-center">
            <p className="text-xs text-gray-600">전체</p>
            <p className="text-lg font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-2 rounded border text-center">
            <p className="text-xs text-gray-600">오늘</p>
            <p className="text-lg font-bold text-green-600">{stats.today}</p>
          </div>
          <div className="bg-white p-2 rounded border text-center">
            <p className="text-xs text-gray-600">Client</p>
            <p className="text-lg font-bold text-blue-600">{stats.client}</p>
          </div>
          <div className="bg-white p-2 rounded border text-center">
            <p className="text-xs text-gray-600">Homepage</p>
            <p className="text-lg font-bold text-green-600">{stats.homepage}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 border rounded text-sm"
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="px-3 py-2 border rounded text-sm"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">전체</option>
            <option value="client">Client</option>
            <option value="homepage">Homepage</option>
          </select>
        </div>
      </div>

      {/* Mobile View - Cards */}
      <div className="lg:hidden">
        <div className="space-y-2">
          {(activeTab === 'regular' ? filteredOrders : filteredFuneralOrders).map((order) => (
            <div key={order.id} className="bg-white border rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`inline-block px-1.5 py-0.5 text-xs rounded mr-2 ${
                    order.source === 'funeral'
                      ? 'bg-purple-100 text-purple-700'
                      : order.source === 'homepage' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.source === 'homepage' ? 'HP' : order.source === 'funeral' ? 'FNR' : 'CL'}
                  </span>
                  <span className="text-sm font-medium">{order.order_number}</span>
                </div>
                <span className="text-sm font-bold">{formatCurrency(order.payment?.total || 0)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">주문일:</span> {formatDate(order.created_at)}
                </div>
                <div>
                  <span className="text-gray-600">완료일:</span> {formatDate(order.completion?.completed_at || order.updated_at)}
                </div>
                <div>
                  <span className="text-gray-600">주문자:</span> {order.customer?.name || '-'}
                </div>
                <div>
                  <span className="text-gray-600">받는분:</span> {order.recipient?.name || '-'}
                </div>
                <div>
                  <span className="text-gray-600">연락처:</span> {formatPhone(order.recipient.phone)}
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">상품:</span> {order.products?.[0]?.name || order.product?.name || '상품정보 없음'}
                  {order.products?.length > 1 && ` 외 ${order.products.length - 1}건`}
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">배송지:</span> 
                  <div>{order.recipient?.address?.sigungu || ''} {order.recipient?.address?.dong || ''}</div>
                  {order.recipient?.address?.detail && (
                    <div className="text-gray-500 text-xs">{order.recipient.address.detail}</div>
                  )}
                </div>
              </div>

              <Link href={`/orders/${order.id}?source=${order.source === 'funeral' ? 'funeral' : order.source}`} className="mt-2 block">
                <button className="w-full py-1.5 bg-gray-100 text-xs rounded hover:bg-gray-200">
                  상세보기
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop View - Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full bg-white border rounded-lg">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">출처</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">주문번호</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">주문일시</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">완료일시</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">발송화원</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">받는분</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">연락처</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">배송지</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">상품</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">금액</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(activeTab === 'regular' ? filteredOrders : filteredFuneralOrders).map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <span className={`inline-block px-1.5 py-0.5 text-xs rounded ${
                    order.source === 'funeral'
                      ? 'bg-purple-100 text-purple-700'
                      : order.source === 'homepage' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.source === 'funeral' ? 'FNR' : order.source === 'homepage' ? 'HP' : 'CL'}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs font-medium">
                  {order.order_number}
                  {order.source === 'funeral' && (
                    <span className="ml-1 text-purple-600 text-xs">🏺</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs">{formatDate(order.created_at)}</td>
                <td className="px-3 py-2 text-xs">
                  {formatDate(order.completion?.completed_at || order.updated_at)}
                </td>
                <td className="px-3 py-2 text-xs">
                  {order.sender?.store_name || order.customer?.name || '-'}
                </td>
                <td className="px-3 py-2 text-xs font-medium">{order.recipient?.name || '-'}</td>
                <td className="px-3 py-2 text-xs">{formatPhone(order.recipient?.phone || '')}</td>
                <td className="px-3 py-2 text-xs">
                  {order.recipient?.address?.sigungu || ''} {order.recipient?.address?.dong || ''}
                  {order.recipient?.address?.detail && (
                    <div className="text-gray-500">{order.recipient.address.detail}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-xs">
                  {order.products?.[0]?.name || order.product?.name || '-'}
                  {order.products?.length > 1 && ` 외 ${order.products.length - 1}`}
                </td>
                <td className="px-3 py-2 text-xs font-bold text-right">
                  {formatCurrency(order.payment?.total || 0)}
                </td>
                <td className="px-3 py-2 text-center">
                  <Link href={`/orders/${order.id}?source=${order.source === 'funeral' ? 'funeral' : order.source}`}>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Eye className="h-4 w-4 text-gray-600" />
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(activeTab === 'regular' ? filteredOrders.length === 0 : filteredFuneralOrders.length === 0) && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">조건에 맞는 주문이 없습니다</p>
        </div>
      )}
    </div>
  )
}