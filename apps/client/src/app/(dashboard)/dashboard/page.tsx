'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/useStore'
import { apiService } from '@/services/api'
import { 
  Package, 
  TrendingUp,
  Clock,
  CheckCircle,
  Megaphone,
  Wallet,
  Calendar,
  Plus,
  Bell
} from 'lucide-react'
import type { Order, Notice } from '@flower/shared/types'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@flower/shared/utils'
interface DashboardStats {
  todayOrders: {
    sent: number
    received: number
  }
  pendingOrders: number
  completedOrders: number
  todaySales: number
}
interface SettlementInfo {
  pendingAmount: number
  pendingOrders: number
  nextSettlementDate: string
}
export default function DashboardPage() {
  const router = useRouter()
  const store = useStore()
  const currentStore = store.currentStore
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: { sent: 0, received: 0 },
    pendingOrders: 0,
    completedOrders: 0,
    todaySales: 0
  })
  const [systemNotices, setSystemNotices] = useState<Notice[]>([])
  const supabase = createClient()
  const [receivedOrders, setReceivedOrders] = useState<Order[]>([])
  const [sentOrders, setSentOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [settlementInfo, setSettlementInfo] = useState<SettlementInfo>({
    pendingAmount: 0,
    pendingOrders: 0,
    nextSettlementDate: ''
  })
  useEffect(() => {
    if (!currentStore) {
      router.push('/login')
      return
    }
    loadDashboardData()
    loadSettlementInfo()
    loadSystemNotice()
  }, [currentStore])
  
  const loadSystemNotice = async () => {
    try {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (data) setSystemNotices(data)
    } catch (error) {
      // 공지사항 로드 실패
    }
  }
  const loadSettlementInfo = async () => {
    if (!currentStore) return
    try {
      const response = await fetch('/api/settlements')
      if (response.ok) {
        const data = await response.json()
        setSettlementInfo({
          pendingAmount: data.pending?.total_amount || 0,
          pendingOrders: data.pending?.total_orders || 0,
          nextSettlementDate: data.next_settlement_date || ''
        })
      }
    } catch (error) {
    }
  }
  const loadDashboardData = async () => {
    if (!currentStore) return
    try {
      const ordersResult = await apiService.getOrders({
        page: 1,
        limit: 100
      })
      if (ordersResult.data) {
        const orders = ordersResult.data
        const sent = orders.filter(o => o.sender_store_id === currentStore.id)
        const received = orders.filter(o => o.receiver_store_id === currentStore.id)
        setSentOrders(sent.slice(0, 5))
        setReceivedOrders(received.slice(0, 5))
        setStats({
          todayOrders: {
            sent: sent.length,
            received: received.length
          },
          pendingOrders: orders.filter(o => o.status === 'pending').length,
          completedOrders: orders.filter(o => o.status === 'completed').length,
          todaySales: sent.reduce((sum, o) => sum + (o.payment?.total || 0), 0)
        })
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800'
    }
    const labels: Record<string, string> = {
      pending: '대기',
      accepted: '수락',
      completed: '완료',
      cancelled: '취소',
      rejected: '거절'
    }
    return (
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    )
  }
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">{currentStore?.business_name}</h1>
            <button
              onClick={() => router.push('/orders/new')}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              새 주문
            </button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-4">
        {/* 시스템 공지 - 최상단 */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="text-blue-600" size={16} />
            <p className="text-sm font-medium text-blue-900">시스템 공지</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-xs mt-0.5">•</span>
              <span className="text-xs text-blue-700">
                정산은 매주 월요일에 진행됩니다. 포인트 잔액을 확인해주세요.
              </span>
            </div>
            {systemNotices.map((notice, index) => (
              <div key={notice.id} className="flex items-start gap-2">
                <span className="text-blue-600 text-xs mt-0.5">•</span>
                <span className="text-xs text-blue-700">
                  {notice.is_pinned && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-600 text-white mr-1">
                      고정
                    </span>
                  )}
                  {notice.title}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* 주요 통계 - 2개만 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex justify-between items-center mb-1">
              <p className="text-lg font-bold">{formatCurrency(stats.todaySales)}</p>
            </div>
            <p className="text-xs text-gray-600">오늘 매출</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex justify-between items-center mb-1">
              <p className="text-lg font-bold">{formatCurrency(currentStore?.points_balance || 0)}</p>
            </div>
            <p className="text-xs text-gray-600">포인트 잔액</p>
          </div>
        </div>
        
        {/* 정산 정보 */}
        {settlementInfo.pendingAmount > 0 && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-green-600" size={16} />
                <div>
                  <p className="text-sm font-medium text-green-900">정산 예정</p>
                  <p className="text-xs text-green-700">
                    {settlementInfo.pendingOrders}건 / {formatCurrency(settlementInfo.pendingAmount)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/settlements')}
                className="text-green-600 hover:text-green-700 text-xs font-medium"
              >
                상세보기 →
              </button>
            </div>
          </div>
        )}
        {/* 주문 목록 - 수주 먼저 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow">
            <div className="p-3 border-b flex justify-between items-center">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                최근 수주
                {stats.todayOrders.received > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    {stats.todayOrders.received}
                  </span>
                )}
                {stats.pendingOrders > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Clock size={10} />
                    {stats.pendingOrders}
                  </span>
                )}
              </h2>
              <button
                onClick={() => router.push('/orders/received')}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                전체보기
              </button>
            </div>
            <div className="divide-y max-h-64 overflow-y-auto">
              {receivedOrders.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Package className="mx-auto mb-1 text-gray-300" size={24} />
                  <p className="text-xs">수주 내역이 없습니다</p>
                </div>
              ) : (
                receivedOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="p-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium truncate">{order.order_number}</p>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-xs text-gray-600 truncate">{order.customer?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{order.product?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{formatCurrency(order.payment?.subtotal || 0)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-3 border-b flex justify-between items-center">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                최근 발주 
                {stats.todayOrders.sent > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    {stats.todayOrders.sent}
                  </span>
                )}
              </h2>
              <button
                onClick={() => router.push('/orders?type=sent')}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                전체보기
              </button>
            </div>
            <div className="divide-y max-h-64 overflow-y-auto">
              {sentOrders.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Package className="mx-auto mb-1 text-gray-300" size={24} />
                  <p className="text-xs">발주 내역이 없습니다</p>
                </div>
              ) : (
                sentOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="p-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium truncate">{order.order_number}</p>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-xs text-gray-600 truncate">{order.recipient?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{order.product?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{formatCurrency(order.payment?.total || 0)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
