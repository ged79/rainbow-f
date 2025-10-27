'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { formatCurrency, formatDate } from '@/shared/utils'
import type { SettlementWithStore } from '@/shared/types'
import { 
  DollarSign, 
  Calendar, 
  Building, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Send,
  CreditCard
} from 'lucide-react'

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementWithStore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('pending')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadSettlements()
  }, [statusFilter])

  const loadSettlements = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('settlements')
        .select(`
          *,
          store:stores(*)
        `)
        .order('created_at', { ascending: false })
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setSettlements(data || [])
    } catch (error) {
      console.error('Error loading settlements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const processSettlement = async (settlementId: string) => {
    if (!confirm('정산을 처리하시겠습니까?')) return
    
    setProcessing(settlementId)
    try {
      const { data: { user } } = await (supabase.auth as any).getUser()
      
      const { data, error } = await supabase.rpc('process_settlement', {
        p_settlement_id: settlementId,
        p_admin_user_id: user?.id,
        p_transfer_note: '정산 완료'
      })
      
      if (error) throw error
      
      if (data?.success) {
        alert(`${data.store_name} 정산 완료: ${formatCurrency(data.amount)}`)
        loadSettlements()
      } else {
        alert(data?.error || '정산 처리 실패')
      }
    } catch (error) {
      console.error('Error processing settlement:', error)
      alert('정산 처리 중 오류 발생')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { icon: Clock, text: '대기', color: 'text-yellow-600 bg-yellow-100' },
      processing: { icon: Send, text: '처리중', color: 'text-blue-600 bg-blue-100' },
      completed: { icon: CheckCircle, text: '완료', color: 'text-green-600 bg-green-100' },
      failed: { icon: AlertCircle, text: '실패', color: 'text-red-600 bg-red-100' }
    }
    
    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon size={12} />
        {badge.text}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">정산 관리</h1>
        <p className="text-gray-600 mt-2">화원별 정산 내역을 관리합니다</p>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2">
        {['all', 'pending', 'completed', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? '전체' : 
             status === 'pending' ? '대기중' :
             status === 'completed' ? '완료' : '실패'}
          </button>
        ))}
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">화원</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기간</th>
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
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {settlement.store?.business_name || '알 수 없음'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {settlement.store?.owner_name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatDate(settlement.period_start)} ~ {formatDate(settlement.period_end)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {settlement.total_orders}건
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatCurrency(settlement.total_amount)}
                </td>
                <td className="px-6 py-4 text-sm text-orange-600">
                  {formatCurrency(settlement.commission_amount)}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                  {formatCurrency(settlement.settlement_amount)}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(settlement.status)}
                </td>
                <td className="px-6 py-4">
                  {settlement.status === 'pending' && (
                    <button
                      onClick={() => processSettlement(settlement.id)}
                      disabled={processing === settlement.id}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition ${
                        processing === settlement.id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <CreditCard size={14} />
                      {processing === settlement.id ? '처리중...' : '정산처리'}
                    </button>
                  )}
                  {settlement.status === 'completed' && (
                    <span className="text-sm text-gray-500">
                      {settlement.processed_at && formatDate(settlement.processed_at)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {settlements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">정산 내역이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
