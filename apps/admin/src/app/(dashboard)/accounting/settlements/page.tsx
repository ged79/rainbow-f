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
  
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    storeId: '',
    dateFrom: '',
    dateTo: ''
  })

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
      setStores(data as Store[] || [])
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

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
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

      const { data, error } = await query.order('period_start', { ascending: false })

      if (error) throw error
      
      const settlementsWithNet = (data || []).map(s => ({
        ...s,
        net_amount: s.net_amount || (s.total_amount - s.commission_amount)
      }))
      
      setSettlements(settlementsWithNet)
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

  const getNextSettlementDate = (): Date => {
    const now = new Date()
    const daysUntilFriday = (BUSINESS_RULES.SETTLEMENT_DAY - now.getDay() + 7) % 7
    const nextFriday = new Date(now)
    nextFriday.setDate(now.getDate() + (daysUntilFriday || 7))
    nextFriday.setHours(
      BUSINESS_RULES.SETTLEMENT_HOUR,
      0,
      0,
      0
    )
    
    if (now.getDay() === BUSINESS_RULES.SETTLEMENT_DAY && 
        now.getHours() >= BUSINESS_RULES.SETTLEMENT_HOUR) {
      nextFriday.setDate(nextFriday.getDate() + 7)
    }
    
    return nextFriday
  }

  const stats = {
    total: settlements.length,
    pending: settlements.filter(s => s.status === 'pending').length,
    completed: settlements.filter(s => s.status === 'completed').length,
    totalAmount: settlements.reduce((sum, s) => sum + (s.total_amount || 0), 0),
    totalCommission: settlements.reduce((sum, s) => sum + (s.commission_amount || 0), 0),
    totalSettlement: settlements.reduce((sum, s) => sum + (s.net_amount || 0), 0)
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
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">정산 관리</h1>
            <p className="text-gray-500 mt-1">
              매주 금요일 {BUSINESS_RULES.SETTLEMENT_HOUR}시 정산 (수수료 25%)
            </p>
          </div>
        </div>

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
                <p className="text-2xl font-bold">25%</p>
              </div>
              <AlertCircle className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">정산번호</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가맹점</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">정산기간</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문수</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총액</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수수료(25%)</th>
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
                      {formatCurrency(settlement.net_amount || 0)}
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
    </div>
  )
}