'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { formatCurrency, formatDate } from '@/shared/utils'
import { BUSINESS_RULES } from '@/shared/constants'
import type { Settlement, Store } from '@/shared/types'
import toast from 'react-hot-toast'
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Download,
  Calendar,
  Building,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  X
} from 'lucide-react'

interface SettlementWithStore extends Settlement {
  store?: Store
}

interface FilterState {
  status: 'all' | 'pending' | 'completed'
  storeId: string
  dateFrom: string
  dateTo: string
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementWithStore[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    storeId: '',
    dateFrom: '',
    dateTo: ''
  })

  // View mode: 'list' | 'store' | 'date'
  const [viewMode, setViewMode] = useState<'list' | 'store' | 'date'>('list')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadStores()
    loadSettlements()
  }, [filters])

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, business_name, owner_name')
        .eq('status', 'active')
        .order('business_name')

      if (error) throw error
      setStores(data as any || [])
    } catch (error) {
      console.error('Failed to load stores:', error)
    }
  }

  const loadSettlements = async () => {
    try {
      let query = supabase
        .from('settlements')
        .select(`
          *,
          store:stores(
            id,
            business_name,
            owner_name,
            phone,
            bank_name,
            account_number,
            account_holder
          )
        `)

      // Apply filters
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status === 'pending' ? 'pending' : 'completed')
      }

      if (filters.storeId) {
        query = query.eq('store_id', filters.storeId)
      }

      if (filters.dateFrom) {
        query = query.gte('period_start', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('period_end', filters.dateTo)
      }

      // Order by date
      query = query.order('period_start', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setSettlements(data || [])
    } catch (error) {
      console.error('Failed to load settlements:', error)
      toast.error('정산 내역을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const processSettlement = async (settlementId: string) => {
    setProcessingId(settlementId)
    try {
      const { error } = await supabase
        .from('settlements')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', settlementId)

      if (error) throw error

      toast.success('정산 처리가 완료되었습니다')
      loadSettlements()
    } catch (error) {
      console.error('Settlement processing error:', error)
      toast.error('정산 처리에 실패했습니다')
    } finally {
      setProcessingId(null)
    }
  }

  const createNewSettlement = async () => {
    try {
      const nextDate = getNextSettlementDate()
      toast.success(`다음 정산일: ${formatDate(nextDate)}`)
      // Implementation for settlement creation would go here
    } catch (error) {
      toast.error('정산 생성에 실패했습니다')
    }
  }

  const getNextSettlementDate = (): Date => {
    const now = new Date()
    const daysUntilFriday = (BUSINESS_RULES.SETTLEMENT_SCHEDULE.DAY_OF_WEEK - now.getDay() + 7) % 7
    const nextFriday = new Date(now)
    nextFriday.setDate(now.getDate() + (daysUntilFriday || 7))
    nextFriday.setHours(
      BUSINESS_RULES.SETTLEMENT_SCHEDULE.HOUR,
      BUSINESS_RULES.SETTLEMENT_SCHEDULE.MINUTE,
      0,
      0
    )
    
    if (now.getDay() === BUSINESS_RULES.SETTLEMENT_SCHEDULE.DAY_OF_WEEK && 
        now.getHours() >= BUSINESS_RULES.SETTLEMENT_SCHEDULE.HOUR) {
      nextFriday.setDate(nextFriday.getDate() + 7)
    }
    
    return nextFriday
  }

  const resetFilters = () => {
    setFilters({
      status: 'all',
      storeId: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  // Group settlements by store
  const settlementsByStore = settlements.reduce((acc, settlement) => {
    const storeId = settlement.store_id
    if (!acc[storeId]) {
      acc[storeId] = {
        store: settlement.store,
        settlements: [],
        totalAmount: 0,
        totalCommission: 0,
        totalSettlement: 0,
        count: 0
      }
    }
    acc[storeId].settlements.push(settlement)
    acc[storeId].totalAmount += settlement.total_amount || 0
    acc[storeId].totalCommission += settlement.commission_amount || 0
    acc[storeId].totalSettlement += settlement.net_amount || settlement.settlement_amount || 0
    acc[storeId].count += 1
    return acc
  }, {} as Record<string, any>)

  // Group settlements by month
  const settlementsByMonth = settlements.reduce((acc, settlement) => {
    const date = new Date(settlement.period_start)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        settlements: [],
        totalAmount: 0,
        totalCommission: 0,
        totalSettlement: 0,
        count: 0,
        storeCount: new Set()
      }
    }
    acc[monthKey].settlements.push(settlement)
    acc[monthKey].totalAmount += settlement.total_amount || 0
    acc[monthKey].totalCommission += settlement.commission_amount || 0
    acc[monthKey].totalSettlement += settlement.net_amount || settlement.settlement_amount || 0
    acc[monthKey].count += 1
    acc[monthKey].storeCount.add(settlement.store_id)
    return acc
  }, {} as Record<string, any>)

  // Calculate statistics
  const stats = {
    total: settlements.length,
    pending: settlements.filter(s => s.status === 'pending').length,
    completed: settlements.filter(s => s.status === 'completed').length,
    totalAmount: settlements.reduce((sum, s) => sum + (s.total_amount || 0), 0),
    totalCommission: settlements.reduce((sum, s) => sum + (s.commission_amount || 0), 0),
    totalSettlement: settlements.reduce((sum, s) => sum + (s.net_amount || s.settlement_amount || 0), 0)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { icon: Clock, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      processing: { icon: Clock, color: 'bg-blue-50 text-blue-700 border-blue-200' },
      completed: { icon: CheckCircle, color: 'bg-green-50 text-green-700 border-green-200' },
      failed: { icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' }
    }
    
    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {status === 'pending' ? '대기중' : 
         status === 'completed' ? '완료' :
         status === 'processing' ? '처리중' : '실패'}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">정산 관리</h1>
            <p className="text-gray-500 mt-1">
              매주 {['일','월','화','수','목','금','토'][BUSINESS_RULES.SETTLEMENT_SCHEDULE.DAY_OF_WEEK]}요일{' '}
              {BUSINESS_RULES.SETTLEMENT_SCHEDULE.HOUR}시 정산
            </p>
          </div>
          <button
            onClick={createNewSettlement}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            정산 생성
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체</p>
                <p className="text-2xl font-bold">{stats.total}건</p>
              </div>
              <Building className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">대기중</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}건</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">완료</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}건</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 매출</p>
                <p className="text-lg font-bold">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 수수료</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalCommission)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">수수료율</p>
                <p className="text-2xl font-bold">
                  {(BUSINESS_RULES.COMMISSION_RATE * 100).toFixed(0)}%
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs & Filters */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              전체 목록
            </button>
            <button
              onClick={() => setViewMode('store')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'store' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              화원별 보기
            </button>
            <button
              onClick={() => setViewMode('date')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'date' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              월별 보기
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              필터
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="h-4 w-4" />
              엑셀 다운로드
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  <option value="pending">대기중</option>
                  <option value="completed">완료</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">화원 선택</label>
                <select
                  value={filters.storeId}
                  onChange={(e) => setFilters({...filters, storeId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체 화원</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.business_name} ({store.owner_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  초기화
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">정산번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가맹점</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">정산기간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수수료</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">정산액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {settlements.length > 0 ? (
                settlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{settlement.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {settlement.store?.business_name || 'Unknown Store'}
                        </p>
                        <p className="text-gray-500">
                          {settlement.store?.owner_name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">{formatDate(settlement.period_start)}</p>
                        <p className="text-gray-500">~ {formatDate(settlement.period_end)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {settlement.total_orders || 0}건
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(settlement.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-orange-600 font-medium">
                      {formatCurrency(settlement.commission_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(settlement.net_amount || settlement.settlement_amount || 0)}
                      </p>
                      {settlement.store?.bank_name && (
                        <p className="text-xs text-gray-500">
                          {settlement.store.bank_name} {settlement.store.account_number}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(settlement.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {settlement.status === 'pending' ? (
                        <button
                          onClick={() => processSettlement(settlement.id)}
                          disabled={processingId !== null}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                        >
                          {processingId === settlement.id ? '처리중...' : '정산하기'}
                        </button>
                      ) : settlement.status === 'completed' ? (
                        <span className="text-sm text-gray-500">
                          {formatDate(settlement.processed_at)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    정산 내역이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'store' && (
        <div className="space-y-4">
          {Object.entries(settlementsByStore).map(([storeId, data]) => (
            <div key={storeId} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {data.store?.business_name || 'Unknown Store'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {data.store?.owner_name} | {data.store?.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">총 {data.count}건의 정산</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(data.totalSettlement)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">총 매출</p>
                  <p className="text-sm font-bold">{formatCurrency(data.totalAmount)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">총 수수료</p>
                  <p className="text-sm font-bold text-orange-600">{formatCurrency(data.totalCommission)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">정산 완료</p>
                  <p className="text-sm font-bold text-green-600">
                    {data.settlements.filter((s: Settlement) => s.status === 'completed').length}건
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">대기중</p>
                  <p className="text-sm font-bold text-yellow-600">
                    {data.settlements.filter((s: Settlement) => s.status === 'pending').length}건
                  </p>
                </div>
              </div>

              {/* Recent settlements for this store */}
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 mb-2">최근 정산 내역</p>
                <div className="space-y-1">
                  {data.settlements.slice(0, 3).map((settlement: Settlement) => (
                    <div key={settlement.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {formatDate(settlement.period_start)} ~ {formatDate(settlement.period_end)}
                      </span>
                      <span className="font-medium">{formatCurrency(settlement.net_amount || settlement.settlement_amount || 0)}</span>
                      {getStatusBadge(settlement.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'date' && (
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">월</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">화원 수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">정산 건수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 매출</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 수수료</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 정산액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">평균 수수료율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(settlementsByMonth)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([month, data]) => {
                  const [year, monthNum] = month.split('-')
                  const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long' 
                  })
                  
                  return (
                    <tr key={month} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {monthName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {data.storeCount.size}개
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {data.count}건
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(data.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-orange-600 font-medium">
                        {formatCurrency(data.totalCommission)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {formatCurrency(data.totalSettlement)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {data.totalAmount > 0 
                          ? ((data.totalCommission / data.totalAmount) * 100).toFixed(1)
                          : '0'}%
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}