'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { formatCurrency, formatDate } from '@/shared/utils'
import { BUSINESS_RULES } from '@/shared/constants'
import type { Settlement, Store } from '@/shared/types'
import toast from 'react-hot-toast'
import { DollarSign, Clock, CheckCircle, XCircle, TrendingUp, Download, RefreshCw } from 'lucide-react'

interface SettlementWithStore extends Settlement {
  store?: Store
}

export default function AccountingPage() {
  const [settlements, setSettlements] = useState<SettlementWithStore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadSettlements()
  }, [])

  const loadSettlements = async () => {
    setIsLoading(true)
    try {
      // Fetch settlements with store information
      const { data, error } = await supabase
        .from('settlements')
        .select(`
          *,
          store:stores(
            id,
            business_name,
            owner_name,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error loading settlements:', error)
        toast.error('정산 내역을 불러오는데 실패했습니다')
      } else {
        setSettlements(data || [])
      }
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
      await loadSettlements()
    } catch (error) {
      console.error('Settlement processing error:', error)
      toast.error('정산 처리에 실패했습니다')
    } finally {
      setProcessingId(null)
    }
  }

  const processAllPendingSettlements = async () => {
    const pendingSettlements = settlements.filter(s => s.status === 'pending')
    
    if (pendingSettlements.length === 0) {
      toast.error('처리할 대기중인 정산이 없습니다')
      return
    }

    setProcessingId('all')
    
    try {
      for (const settlement of pendingSettlements) {
        await supabase
          .from('settlements')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', settlement.id)
      }
      
      toast.success(`${pendingSettlements.length}건의 정산이 처리되었습니다`)
      await loadSettlements()
    } catch (error) {
      toast.error('일괄 정산 처리에 실패했습니다')
    } finally {
      setProcessingId(null)
    }
  }

  // Calculate stats with null safety
  const stats = {
    total: settlements.length,
    pending: settlements.filter(s => s.status === 'pending').length,
    completed: settlements.filter(s => s.status === 'completed').length,
    totalAmount: settlements.reduce((sum, s) => sum + (s.total_amount || 0), 0),
    totalCommission: settlements.reduce((sum, s) => sum + (s.commission_amount || 0), 0)
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing': return <Clock className="h-4 w-4 text-blue-500" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'completed': return 'bg-green-50 text-green-700 border-green-200'
      case 'failed': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return '대기중'
      case 'processing': return '처리중'
      case 'completed': return '완료'
      case 'failed': return '실패'
      default: return status
    }
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
      {/* Header with stats */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">회계 관리</h1>
          <button
            onClick={loadSettlements}
            className="p-2 text-gray-600 hover:text-gray-900"
            title="새로고침"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-5 gap-4">
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
                <p className="text-sm text-gray-600">총 정산액</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 수수료</p>
                <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.totalCommission)}</p>
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
              <TrendingUp className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={processAllPendingSettlements}
          disabled={processingId !== null || stats.pending === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {processingId === 'all' ? '처리중...' : `일괄 정산 (${stats.pending}건)`}
        </button>
        <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
          <Download className="h-4 w-4" />
          엑셀 다운로드
        </button>
      </div>

      {/* Settlements table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {settlements.length > 0 ? (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">정산기간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가맹점</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수수료</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">정산액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {settlements.map((settlement) => (
                <tr key={settlement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">{formatDate(settlement.period_start)}</p>
                      <p className="text-gray-500">~ {formatDate(settlement.period_end)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {settlement.store?.business_name || 'Unknown Store'}
                      </p>
                      <p className="text-gray-500">
                        {settlement.store?.owner_name || settlement.store_id.slice(0, 8)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {settlement.total_orders || 0}건
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(settlement.total_amount)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-orange-600">
                    {formatCurrency(settlement.commission_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(settlement.settlement_amount)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(settlement.status)}`}>
                      {getStatusIcon(settlement.status)}
                      {getStatusLabel(settlement.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {settlement.status === 'pending' ? (
                      <button
                        onClick={() => processSettlement(settlement.id)}
                        disabled={processingId !== null}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                      >
                        {processingId === settlement.id ? '처리중...' : '정산'}
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
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            정산 내역이 없습니다
          </div>
        )}
      </div>
    </div>
  )
}