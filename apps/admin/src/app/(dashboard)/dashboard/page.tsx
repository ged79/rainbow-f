'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Package,
  ChevronRight,
  Phone,
  RefreshCw,
  Zap,
  Users,
  DollarSign
} from 'lucide-react'
import { formatCurrency, homepageToUnifiedOrder, clientToUnifiedOrder } from '@/shared/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface DashboardMetrics {
  todayRevenue: number
  todayOrders: number
  acceptanceRate: number
  onTimeRate: number
  pendingOrders: number
  waitingAcceptance: number
  delayedDeliveries: number
  lowPointStores: number
  homepageOrders: number
  clientOrders: number
}

interface ProblemOrder {
  id: string
  order_number: string
  source: 'homepage' | 'client' | 'funeral'
  type: 'unassigned' | 'waiting' | 'delayed'
  duration: number
  store_name?: string
  product_type: string
  delivery_time: string
  delivery_date: string
}

interface ProblemStore {
  id: string
  business_name: string
  issue: string
  severity: 'critical' | 'warning' | 'info'
  metrics: {
    acceptance_rate?: number
    on_time_rate?: number
    points_balance?: number
    current_load?: number
  }
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todayRevenue: 0,
    todayOrders: 0,
    acceptanceRate: 0,
    onTimeRate: 0,
    pendingOrders: 0,
    waitingAcceptance: 0,
    delayedDeliveries: 0,
    lowPointStores: 0,
    homepageOrders: 0,
    clientOrders: 0
  })
  const [problemOrders, setProblemOrders] = useState<ProblemOrder[]>([])
  const [problemStores, setProblemStores] = useState<ProblemStore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboard = async () => {
    const now = new Date()
    const today = new Date(now.setHours(0, 0, 0, 0))

    // Client 주문
    const { data: clientOrders } = await supabase
      .from('orders')
      .select(`
        *,
        sender_store:stores!sender_store_id(business_name),
        receiver_store:stores!receiver_store_id(business_name)
      `)
      .gte('created_at', today.toISOString())

    // Homepage 주문
    const { data: homepageOrders } = await supabase
      .from('customer_orders')
      .select('*')
      .gte('created_at', today.toISOString())

    // 통합 주문 변환
    const allOrders = [
      ...(clientOrders || []).map(clientToUnifiedOrder),
      ...(homepageOrders || []).map(homepageToUnifiedOrder)
    ]

    // 수수료 계산
    const revenue = allOrders.reduce((sum, o) => sum + o.pricing.commission, 0)
    
    // 수락률 계산
    const accepted = allOrders.filter(o => 
      o.status !== 'rejected' && o.status !== 'cancelled'
    ).length
    const acceptanceRate = allOrders.length > 0 ? (accepted / allOrders.length) * 100 : 0

    // 미배정 주문
    const unassignedClient = clientOrders?.filter(o => 
      !o.receiver_store_id && o.status === 'pending'
    ) || []
    const unassignedHomepage = homepageOrders?.filter(o => 
      !o.assigned_store_id && o.status === 'pending'
    ) || []
    const totalUnassigned = unassignedClient.length + unassignedHomepage.length

    // 수락 대기중
    const waitingClient = clientOrders?.filter(o => 
      o.receiver_store_id && o.status === 'pending'
    ) || []
    const waitingHomepage = homepageOrders?.filter(o => 
      o.assigned_store_id && o.status === 'assigned'
    ) || []
    const totalWaiting = waitingClient.length + waitingHomepage.length

    // 배송 지연 체크
    const currentTime = new Date()
    const delayedOrders = allOrders.filter(order => {
      if (order.status === 'completed' || order.status === 'cancelled') return false
      const deliveryDateTime = new Date(`${order.delivery.date} ${order.delivery.time}`)
      return deliveryDateTime < currentTime
    })

    // 문제 주문 찾기
    const problems: ProblemOrder[] = []
    
    // Client 미배정
    unassignedClient.forEach(order => {
      const duration = (Date.now() - new Date(order.created_at).getTime()) / 60000
      if (duration > 10) {
        problems.push({
          id: order.id,
          order_number: order.order_number,
          source: 'client',
          type: 'unassigned',
          duration: Math.round(duration),
          product_type: order.product?.type || '기타',
          delivery_time: order.delivery_time,
          delivery_date: order.delivery_date
        })
      }
    })

    // Homepage 미배정
    unassignedHomepage.forEach(order => {
      const duration = (Date.now() - new Date(order.created_at).getTime()) / 60000
      if (duration > 10) {
        problems.push({
          id: order.id,
          order_number: order.order_number,
          source: 'homepage',
          type: 'unassigned',
          duration: Math.round(duration),
          product_type: order.mapped_category || order.product_category || '기타',
          delivery_time: order.delivery_time,
          delivery_date: order.delivery_date
        })
      }
    })

    // 수락 대기중
    waitingClient.forEach(order => {
      const duration = (Date.now() - new Date(order.created_at).getTime()) / 60000
      if (duration > 15) {
        problems.push({
          id: order.id,
          order_number: order.order_number,
          source: 'client',
          type: 'waiting',
          duration: Math.round(duration),
          store_name: order.receiver_store?.business_name,
          product_type: order.product?.type || '기타',
          delivery_time: order.delivery_time,
          delivery_date: order.delivery_date
        })
      }
    })

    // 지연 배송
    delayedOrders.forEach(order => {
      const deliveryDateTime = new Date(`${order.delivery.date} ${order.delivery.time}`)
      const delayMinutes = (Date.now() - deliveryDateTime.getTime()) / 60000
      problems.push({
        id: order.id,
        order_number: order.order_number,
        source: order.source,
        type: 'delayed',
        duration: Math.round(delayMinutes),
        store_name: order.stores.receiver?.business_name,
        product_type: order.product.type,
        delivery_time: order.delivery.time,
        delivery_date: order.delivery.date
      })
    })

    // 문제 화원 찾기
    const { data: stores } = await supabase
      .from('stores')
      .select('*')
      .eq('status', 'active')

    const storeProblems: ProblemStore[] = []
    stores?.forEach(store => {
      // 포인트 부족
      if (store.points_balance < 50000) {
        storeProblems.push({
          id: store.id,
          business_name: store.business_name,
          issue: '포인트 부족',
          severity: store.points_balance < 10000 ? 'critical' : 'warning',
          metrics: { points_balance: store.points_balance }
        })
      }

      // 낮은 평점
      if (store.rating && store.rating < 3.5) {
        storeProblems.push({
          id: store.id,
          business_name: store.business_name,
          issue: `평점 ${store.rating}점`,
          severity: store.rating < 3.0 ? 'critical' : 'warning',
          metrics: { on_time_rate: store.rating * 20 }
        })
      }
    })

    // 정시율 계산 (완료 주문 기준)
    const completedToday = allOrders.filter(o => o.status === 'completed')
    const onTimeRate = completedToday.length > 0 
      ? ((completedToday.length - delayedOrders.length) / completedToday.length) * 100 
      : 100

    setMetrics({
      todayRevenue: revenue,
      todayOrders: allOrders.length,
      acceptanceRate,
      onTimeRate,
      pendingOrders: totalUnassigned,
      waitingAcceptance: totalWaiting,
      delayedDeliveries: delayedOrders.length,
      lowPointStores: storeProblems.filter(s => s.issue === '포인트 부족').length,
      homepageOrders: homepageOrders?.length || 0,
      clientOrders: clientOrders?.length || 0
    })
    
    setProblemOrders(problems.sort((a, b) => b.duration - a.duration).slice(0, 5))
    setProblemStores(storeProblems.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1
      if (b.severity === 'critical' && a.severity !== 'critical') return 1
      return 0
    }).slice(0, 5))
    
    setLastUpdate(new Date())
    setIsLoading(false)
  }

  const handleQuickAction = async (action: string, targetId?: string) => {
    switch(action) {
      case 'auto-assign':
        toast.success('자동 배정 시작')
        break
      case 'notify-store':
        toast.success('알림 전송')
        break
      case 'notify-all':
        toast.success('전체 알림 전송')
        break
    }
    loadDashboard()
  }

  if (isLoading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* 실시간 모니터링 */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">실시간 모니터링</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
            </span>
            <button 
              onClick={loadDashboard}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <div className={`p-4 rounded-lg ${metrics.pendingOrders > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">미배정 주문</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.pendingOrders}건</p>
                <p className="text-xs text-gray-500 mt-1">
                  HP: {metrics.pendingOrders > 0 ? '대기중' : '0'} | CL: {metrics.pendingOrders > 0 ? '대기중' : '0'}
                </p>
              </div>
              <Package className={`h-8 w-8 ${metrics.pendingOrders > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            {metrics.pendingOrders > 0 && (
              <Link href="/orders/assignment" className="mt-3 block">
                <button className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                  배정하기
                </button>
              </Link>
            )}
          </div>

          <div className={`p-4 rounded-lg ${metrics.waitingAcceptance > 0 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">수락 대기중</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.waitingAcceptance}건</p>
              </div>
              <Clock className={`h-8 w-8 ${metrics.waitingAcceptance > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
            </div>
            {metrics.waitingAcceptance > 0 && (
              <button 
                onClick={() => handleQuickAction('notify-all')}
                className="mt-3 w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
              >
                재촉 알림
              </button>
            )}
          </div>

          <div className={`p-4 rounded-lg ${metrics.delayedDeliveries > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">배송 지연</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.delayedDeliveries}건</p>
              </div>
              <AlertCircle className={`h-8 w-8 ${metrics.delayedDeliveries > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
            </div>
            {metrics.delayedDeliveries > 0 && (
              <Link href="/unified-orders" className="mt-3 block">
                <button className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm">
                  확인하기
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 오늘 실적 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">오늘 수수료</p>
              <p className="text-xl font-bold">{formatCurrency(metrics.todayRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">총 주문</p>
              <p className="text-xl font-bold">{metrics.todayOrders}건</p>
              <p className="text-xs text-gray-500">HP:{metrics.homepageOrders} CL:{metrics.clientOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">수락률</p>
              <p className="text-xl font-bold">{metrics.acceptanceRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-600">정시율</p>
              <p className="text-xl font-bold">{metrics.onTimeRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">문제 화원</p>
              <p className="text-xl font-bold">{metrics.lowPointStores}개</p>
            </div>
          </div>
        </div>
      </div>

      {/* 긴급 처리 & 문제 화원 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 긴급 처리 필요 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-medium text-gray-900">긴급 처리 필요</h3>
            {problemOrders.length > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                {problemOrders.length}건
              </span>
            )}
          </div>
          <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
            {problemOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-4">문제 없음 ✅</p>
            ) : (
              problemOrders.map(order => (
                <div key={order.id} className={`flex items-center justify-between p-3 rounded ${
                  order.type === 'delayed' ? 'bg-orange-50' : 
                  order.type === 'unassigned' ? 'bg-red-50' : 'bg-yellow-50'
                }`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{order.order_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        order.source === 'homepage' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.source === 'homepage' ? 'HP' : 'CL'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        order.type === 'delayed' ? 'bg-orange-100 text-orange-800' :
                        order.type === 'unassigned' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.duration}분 {order.type === 'delayed' ? '지연' : '경과'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {order.product_type} | {order.delivery_date} {order.delivery_time}
                      {order.store_name && ` | ${order.store_name}`}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      if (order.type === 'unassigned') {
                        window.location.href = '/orders/assignment'
                      } else {
                        handleQuickAction('notify-store', order.id)
                      }
                    }}
                    className={`px-3 py-1 text-white text-sm rounded ${
                      order.type === 'delayed' ? 'bg-orange-600 hover:bg-orange-700' :
                      order.type === 'unassigned' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                  >
                    {order.type === 'unassigned' ? '배정' : 
                     order.type === 'delayed' ? '확인' : '재촉'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 문제 가맹점 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-medium text-gray-900">문제 가맹점</h3>
            {problemStores.length > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                {problemStores.length}개
              </span>
            )}
          </div>
          <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
            {problemStores.length === 0 ? (
              <p className="text-center text-gray-500 py-4">문제 없음 ✅</p>
            ) : (
              problemStores.map(store => (
                <div key={`${store.id}-${store.issue}`} className={`flex items-center justify-between p-3 rounded ${
                  store.severity === 'critical' ? 'bg-red-50' : 
                  store.severity === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
                }`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{store.business_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        store.severity === 'critical' ? 'bg-red-100 text-red-800' : 
                        store.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {store.issue}
                      </span>
                    </div>
                    {store.metrics.points_balance !== undefined && (
                      <p className="text-xs text-gray-600 mt-1">
                        잔액: {formatCurrency(store.metrics.points_balance)}
                      </p>
                    )}
                    {store.metrics.on_time_rate !== undefined && (
                      <p className="text-xs text-gray-600">
                        정시율: {store.metrics.on_time_rate.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <Link href={`/florists/${store.id}`}>
                    <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                      상세
                    </button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/orders/assignment" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">미배정 주문</p>
              <p className="text-sm text-gray-600">즉시 배정 필요</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>
        
        <Link href="/unified-orders" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">통합 주문관리</p>
              <p className="text-sm text-gray-600">전체 주문 현황</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>
        
        <Link href="/florists" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">화원 관리</p>
              <p className="text-sm text-gray-600">가맹점 현황</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>
        
        <Link href="/settlements" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">정산 관리</p>
              <p className="text-sm text-gray-600">수수료 정산</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>
      </div>
    </div>
  )
}