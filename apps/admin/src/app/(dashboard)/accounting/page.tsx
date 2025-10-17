'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { formatCurrency, formatDate, calculateCommission } from '@flower/shared/utils'
import type { Order, Store } from '@flower/shared/types'
import toast from 'react-hot-toast'
import { 
  TrendingUp,
  TrendingDown,
  DollarSign, 
  Package,
  Users,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

interface RevenueData {
  date: string
  revenue: number
  commission: number
  orders: number
}

interface StoreRevenue {
  store_id: string
  store_name: string
  total_revenue: number
  total_commission: number
  total_orders: number
  growth_rate: number
}

export default function RevenueAnalysisPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [storeRevenue, setStoreRevenue] = useState<StoreRevenue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedStore, setSelectedStore] = useState('all')
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    setDateTo(today.toISOString().split('T')[0])
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
    
    loadStores()
  }, [])

  useEffect(() => {
    if (dateFrom && dateTo) {
      loadRevenueData()
    }
  }, [dateFrom, dateTo, selectedStore, viewMode])

  const loadStores = async () => {
    const { data } = await supabase
      .from('stores')
      .select('id, business_name')
      .eq('status', 'active')
      .order('business_name')
    
    if (data) setStores(data as Store[])
  }

  const loadRevenueData = async () => {
    setIsLoading(true)
    try {
      // 1. Client orders (기존 로직 유지)
      let clientQuery = supabase
        .from('orders')
        .select('*, receiver_store:stores!receiver_store_id(business_name)')
        .eq('status', 'completed')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59')

      if (selectedStore !== 'all') {
        clientQuery = clientQuery.eq('receiver_store_id', selectedStore)
      }

      const { data: clientOrders, error: clientError } = await clientQuery
      if (clientError) throw clientError

      // 2. Homepage/Funeral orders (신규 추가)
      let homepageQuery = supabase
        .from('customer_orders')
        .select('*, assigned_store:stores!assigned_store_id(business_name)')
        .eq('status', 'completed')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59')

      if (selectedStore !== 'all') {
        homepageQuery = homepageQuery.eq('assigned_store_id', selectedStore)
      }

      const { data: homepageOrders, error: homepageError } = await homepageQuery
      if (homepageError) throw homepageError

      // Process revenue data
      const revenueByDate = new Map<string, RevenueData>()
      const revenueByStore = new Map<string, StoreRevenue>()

      // Process client orders (기존 로직)
      clientOrders?.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0]
        const revenue = order.payment?.total || 0
        const { commission } = calculateCommission(revenue)
        
        // Daily revenue
        if (!revenueByDate.has(date)) {
          revenueByDate.set(date, {
            date,
            revenue: 0,
            commission: 0,
            orders: 0
          })
        }
        const dayData = revenueByDate.get(date)!
        dayData.revenue += revenue
        dayData.commission += commission
        dayData.orders += 1

        // Store revenue
        const storeId = order.receiver_store_id || 'unassigned'
        const storeName = storeId === '00000000-0000-0000-0000-000000000000' 
          ? '본사 직접배송' 
          : storeId === 'unassigned'
          ? '미배정 주문'
          : order.receiver_store?.business_name || 'Unknown'
        
        if (!revenueByStore.has(storeId)) {
          revenueByStore.set(storeId, {
            store_id: storeId,
            store_name: storeName,
            total_revenue: 0,
            total_commission: 0,
            total_orders: 0,
            growth_rate: 0
          })
        }
        const storeData = revenueByStore.get(storeId)!
        storeData.total_revenue += revenue
        storeData.total_commission += commission
        storeData.total_orders += 1
      })

      // Process homepage/funeral orders (신규)
      homepageOrders?.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0]
        const revenue = order.total_amount || 0
        // Homepage orders: commission is already in payment data or calculate from total
        const commission = order.payment?.commission || Math.floor(revenue * 0.25)
        
        // Daily revenue
        if (!revenueByDate.has(date)) {
          revenueByDate.set(date, {
            date,
            revenue: 0,
            commission: 0,
            orders: 0
          })
        }
        const dayData = revenueByDate.get(date)!
        dayData.revenue += revenue
        dayData.commission += commission
        dayData.orders += 1

        // Store revenue
        const storeId = order.assigned_store_id || 'unassigned'
        const storeName = storeId === '00000000-0000-0000-0000-000000000000'
          ? '본사 직접배송'
          : storeId === 'unassigned'
          ? '미배정 주문'
          : order.assigned_store?.business_name || 'Unknown'
        
        if (!revenueByStore.has(storeId)) {
          revenueByStore.set(storeId, {
            store_id: storeId,
            store_name: storeName,
            total_revenue: 0,
            total_commission: 0,
            total_orders: 0,
            growth_rate: 0
          })
        }
        const storeData = revenueByStore.get(storeId)!
        storeData.total_revenue += revenue
        storeData.total_commission += commission
        storeData.total_orders += 1
      })

      setRevenueData(Array.from(revenueByDate.values()).sort((a, b) => a.date.localeCompare(b.date)))
      setStoreRevenue(Array.from(revenueByStore.values()).sort((a, b) => b.total_revenue - a.total_revenue))
    } catch (error) {
      console.error('Failed to load revenue data:', error)
      toast.error('수익 데이터를 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate totals
  const totals = {
    revenue: revenueData.reduce((sum, d) => sum + d.revenue, 0),
    commission: revenueData.reduce((sum, d) => sum + d.commission, 0),
    orders: revenueData.reduce((sum, d) => sum + d.orders, 0),
    avgOrderValue: revenueData.length > 0 
      ? Math.floor(revenueData.reduce((sum, d) => sum + d.revenue, 0) / revenueData.reduce((sum, d) => sum + d.orders, 0))
      : 0
  }

  // Calculate growth
  const currentPeriodRevenue = totals.revenue
  const previousPeriodRevenue = currentPeriodRevenue * 0.85 // Mock data
  const growthRate = previousPeriodRevenue > 0 
    ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue * 100).toFixed(1)
    : '0'

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">수익 분석</h1>
        <p className="text-gray-500">매출 트렌드와 화원별 실적을 분석합니다</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
        <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-6 w-6 lg:h-8 lg:w-8 text-blue-500" />
            <span className={`text-xs lg:text-sm flex items-center ${Number(growthRate) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Number(growthRate) >= 0 ? <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4" /> : <TrendingDown className="h-3 w-3 lg:h-4 lg:w-4" />}
              {Math.abs(Number(growthRate))}%
            </span>
          </div>
          <p className="text-xs lg:text-sm text-gray-600">총 매출</p>
          <p className="text-base lg:text-xl font-bold">{formatCurrency(totals.revenue)}</p>
        </div>

        <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-6 w-6 lg:h-8 lg:w-8 text-purple-500" />
          </div>
          <p className="text-xs lg:text-sm text-gray-600">수수료 수익</p>
          <p className="text-base lg:text-xl font-bold text-purple-600">{formatCurrency(totals.commission)}</p>
        </div>

        <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <Package className="h-6 w-6 lg:h-8 lg:w-8 text-green-500" />
          </div>
          <p className="text-xs lg:text-sm text-gray-600">총 주문수</p>
          <p className="text-base lg:text-xl font-bold">{totals.orders.toLocaleString()}건</p>
        </div>

        <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-6 w-6 lg:h-8 lg:w-8 text-orange-500" />
          </div>
          <p className="text-xs lg:text-sm text-gray-600">평균 주문액</p>
          <p className="text-base lg:text-xl font-bold">{formatCurrency(totals.avgOrderValue)}</p>
        </div>

        <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-6 w-6 lg:h-8 lg:w-8 text-indigo-500" />
          </div>
          <p className="text-xs lg:text-sm text-gray-600">활성 화원</p>
          <p className="text-base lg:text-xl font-bold">{storeRevenue.length}개</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 lg:p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-4">
          <Calendar className="h-4 w-4 text-gray-500 hidden lg:block" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <span className="text-center lg:inline">~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">전체 화원</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.business_name}</option>
            ))}
          </select>

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="daily">일별</option>
            <option value="weekly">주별</option>
            <option value="monthly">월별</option>
          </select>

          <button className="lg:ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">엑셀 다운로드</span>
            <span className="sm:hidden">다운로드</span>
          </button>
        </div>
      </div>

      {/* Revenue Chart Area */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">일별 매출 추이</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <BarChart3 className="h-16 w-16" />
            <p className="ml-4">차트 영역</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">화원별 매출 비중</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <PieChart className="h-16 w-16" />
            <p className="ml-4">차트 영역</p>
          </div>
        </div>
      </div>

      {/* Top Stores Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b">
          <h3 className="text-base lg:text-lg font-semibold">화원별 실적</h3>
        </div>
        
        {/* Mobile View */}
        <div className="lg:hidden divide-y">
          {storeRevenue.slice(0, 10).map((store, index) => (
            <div key={store.store_id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900">{store.store_name}</span>
                </div>
                <span className="text-sm font-bold">{formatCurrency(store.total_revenue)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                <div>
                  <span className="block text-gray-500">수수료</span>
                  <span className="text-purple-600 font-medium">{formatCurrency(store.total_commission)}</span>
                </div>
                <div>
                  <span className="block text-gray-500">주문수</span>
                  <span className="font-medium">{store.total_orders}건</span>
                </div>
                <div>
                  <span className="block text-gray-500">평균액</span>
                  <span className="font-medium">{formatCurrency(Math.floor(store.total_revenue / store.total_orders))}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">순위</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">화원명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">매출액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수수료</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">평균 주문액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {storeRevenue.slice(0, 10).map((store, index) => (
                <tr key={store.store_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {store.store_name}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">
                    {formatCurrency(store.total_revenue)}
                  </td>
                  <td className="px-6 py-4 text-sm text-purple-600">
                    {formatCurrency(store.total_commission)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {store.total_orders}건
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatCurrency(Math.floor(store.total_revenue / store.total_orders))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}