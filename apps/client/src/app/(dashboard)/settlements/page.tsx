'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/useStore'
import { 
  Wallet, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  FileText,
  Download,
  ChevronRight,
  ChevronDown,
  Package,
  Receipt,
  TrendingDown
} from 'lucide-react'
import { formatCurrency, calculateCommission } from '@flower/shared/utils'
interface Settlement {
  id: string
  period_start: string
  period_end: string
  total_orders: number
  total_amount: number
  commission_rate: number
  commission_amount: number
  net_amount: number
  status: 'pending' | 'processing' | 'completed'
  processed_at?: string
  created_at: string
}
interface SettlementItem {
  id: string
  order_id: string
  order_number: string
  order_date: string
  product_name: string
  quantity: number
  original_amount: number
  commission_rate: number
  commission_amount: number
  net_amount: number
  sender_store_name?: string
  receiver_store_name?: string
}
interface SettlementSummary {
  pendingAmount: number
  pendingOrders: number
  nextSettlementDate: string
  completedThisMonth: number
  totalCompleted: number
}
export default function SettlementsPage() {
  const router = useRouter()
  const { currentStore } = useStore()
  const [pendingSettlements, setPendingSettlements] = useState<Settlement[]>([])
  const [completedSettlements, setCompletedSettlements] = useState<Settlement[]>([])
  const [summary, setSummary] = useState<SettlementSummary>({
    pendingAmount: 0,
    pendingOrders: 0,
    nextSettlementDate: '',
    completedThisMonth: 0,
    totalCompleted: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  // 확장된 정산 상세를 추적
  const [expandedSettlement, setExpandedSettlement] = useState<string | null>(null)
  const [settlementItems, setSettlementItems] = useState<Record<string, SettlementItem[]>>({})
  const [loadingItems, setLoadingItems] = useState<string | null>(null)
  useEffect(() => {
    if (!currentStore) {
      router.push('/login')
      return
    }
    loadSettlements()
  }, [currentStore])
  const loadSettlements = async () => {
    try {
      const response = await fetch('/api/settlements')
      if (response.ok) {
        const data = await response.json()
        // API 응답 구조 수정
        const allSettlements = data.data || []
        // Ensure commission is calculated correctly
        const settlementsWithCommission = allSettlements.map((s: Settlement) => {
          const calc = calculateCommission(s.total_amount)
          return {
            ...s,
            commission_amount: s.commission_amount || calc.commission,
            net_amount: s.net_amount || calc.netAmount
          }
        })
        setPendingSettlements(settlementsWithCommission.filter((s: Settlement) => s.status === 'pending'))
        setCompletedSettlements(settlementsWithCommission.filter((s: Settlement) => s.status === 'completed'))
        const thisMonth = new Date().getMonth()
        const completedList = allSettlements.filter((s: Settlement) => s.status === 'completed')
        const thisMonthCompleted = completedList
          .filter((s: Settlement) => new Date(s.processed_at || s.created_at).getMonth() === thisMonth)
          .reduce((sum: number, s: Settlement) => sum + (s.net_amount || 0), 0)
        const totalCompleted = completedList
          .reduce((sum: number, s: Settlement) => sum + (s.net_amount || 0), 0)
        setSummary({
          pendingAmount: data.pending?.total_amount || 0,
          pendingOrders: data.pending?.total_orders || 0,
          nextSettlementDate: data.next_settlement_date || '',
          completedThisMonth: thisMonthCompleted,
          totalCompleted: totalCompleted
        })
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }
  const loadSettlementItems = async (settlementId: string) => {
    try {
      setLoadingItems(settlementId)
      const response = await fetch(`/api/settlements-items/${settlementId}`)
      if (response.ok) {
        const data = await response.json()
        // 데이터 불일치 체크
        if (data.total_orders_declared !== data.actual_items_count) {
        }
        setSettlementItems(prev => ({
          ...prev,
          [settlementId]: data.items || []
        }))
      }
    } catch (error) {
    } finally {
      setLoadingItems(null)
    }
  }
  const toggleSettlement = async (settlementId: string) => {
    if (expandedSettlement === settlementId) {
      setExpandedSettlement(null)
    } else {
      setExpandedSettlement(settlementId)
      if (!settlementItems[settlementId]) {
        await loadSettlementItems(settlementId)
      }
    }
  }
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock size={12} />
            정산 대기
          </span>
        )
      case 'processing':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <AlertCircle size={12} />
            처리중
          </span>
        )
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle size={12} />
            정산 완료
          </span>
        )
      default:
        return null
    }
  }
  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} - ${endDate.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  const exportSettlementItems = (settlement: Settlement) => {
    const items = settlementItems[settlement.id] || []
    if (items.length === 0) return
    const headers = ['주문번호', '주문일시', '상품명', '수량', '주문금액', '수수료', '정산금액']
    const rows = items.map(item => [
      item.order_number,
      formatDate(item.order_date),
      item.product_name,
      item.quantity.toString(),
      item.original_amount.toString(),
      item.commission_amount.toString(),
      item.net_amount.toString()
    ])
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `정산상세_${settlement.period_start}_${settlement.period_end}.csv`
    link.click()
  }
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">정산 내역을 불러오는 중...</p>
        </div>
      </div>
    )
  }
  const renderSettlementCard = (settlement: Settlement) => {
    const isExpanded = expandedSettlement === settlement.id
    const items = settlementItems[settlement.id] || []
    const isLoadingItems = loadingItems === settlement.id
    return (
      <div key={settlement.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        {/* 정산 요약 카드 - 클릭 가능 */}
        <div 
          className="p-5 hover:bg-gray-50 transition cursor-pointer"
          onClick={() => toggleSettlement(settlement.id)}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <p className="text-base font-bold text-gray-900">
                  {formatPeriod(settlement.period_start, settlement.period_end)}
                </p>
                {getStatusBadge(settlement.status)}
              </div>
              <p className="text-sm text-gray-600">
                주문 {settlement.total_orders}건
              </p>
            </div>
            <div className="flex items-center">
              {isExpanded ? (
                <ChevronDown size={20} className="text-gray-400" />
              ) : (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 py-3 border-t border-b">
            <div>
              <p className="text-xs text-gray-500 mb-1">총 매출</p>
              <p className="font-bold text-gray-900">{formatCurrency(settlement.total_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">수수료 ({settlement.commission_rate}%)</p>
              <p className="font-bold text-red-600">-{formatCurrency(settlement.commission_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">정산 금액</p>
              <p className="font-bold text-indigo-600">{formatCurrency(settlement.net_amount)}</p>
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">
                {settlement.status === 'completed' ? '정산완료일' : '정산예정일'}
              </span>
              <span className="ml-2 text-gray-900 font-semibold">
                {settlement.status === 'completed' && settlement.processed_at
                  ? new Date(settlement.processed_at).toLocaleDateString('ko-KR', { 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'short'
                    })
                  : new Date(new Date(settlement.period_end).getTime() + 5 * 24 * 60 * 60 * 1000)
                      .toLocaleDateString('ko-KR', { 
                        month: 'long', 
                        day: 'numeric', 
                        weekday: 'short' 
                      })}
              </span>
            </div>
            <div className="text-lg font-bold text-indigo-600">
              +{formatCurrency(settlement.net_amount)}
            </div>
          </div>
        </div>
        {/* 확장된 상세 내역 */}
        {isExpanded && (
          <div className="border-t bg-gray-50">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package size={16} className="text-indigo-600" />
                  주문 상세 내역 ({items.length}건)
                  {settlement.total_orders !== items.length && (
                    <span className="text-xs text-orange-600 ml-2">
                      (정산 요약: {settlement.total_orders}건)
                    </span>
                  )}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    exportSettlementItems(settlement)
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-100 text-sm transition"
                  disabled={items.length === 0}
                >
                  <Download size={14} />
                  다운로드
                </button>
              </div>
              {isLoadingItems ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600 text-sm">로딩 중...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-6">
                  <Package className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-gray-500 text-sm">주문 내역이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={item.id} className="bg-white rounded-lg p-3 border hover:shadow-sm transition">
                      {/* 첫 줄: 날짜, 주문번호 */}
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold">{item.order_number}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.order_date).toLocaleDateString('ko-KR', { 
                            month: 'numeric', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {/* 둘째 줄: 상품명, 화원정보 */}
                      <div className="mb-2">
                        <div className="text-sm text-gray-700">{item.product_name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          발주: {item.sender_store_name || '알 수 없음'} → 수주: {item.receiver_store_name || '본사배정'}
                        </div>
                      </div>
                      {/* 셋째 줄: 금액 정보 */}
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <div className="flex gap-4">
                          <div>
                            <span className="text-xs text-gray-500">주문금액</span>
                            <p className="font-bold">{formatCurrency(item.original_amount)}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">수수료</span>
                            <p className="font-bold text-red-600">-{formatCurrency(item.commission_amount)}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">정산금액</span>
                            <p className="font-bold text-indigo-600">{formatCurrency(item.net_amount)}</p>
                          </div>
                        </div>
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {item.quantity}개
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* 합계 */}
                  <div className="bg-indigo-50 rounded-lg p-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-indigo-900">합계</span>
                      <div className="flex gap-6 text-sm">
                        <div className="text-right">
                          <p className="text-xs text-indigo-700">총 매출</p>
                          <p className="font-bold">{formatCurrency(settlement.total_amount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-red-600">수수료</p>
                          <p className="font-bold text-red-600">-{formatCurrency(settlement.commission_amount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-indigo-700">정산 금액</p>
                          <p className="font-bold text-indigo-600 text-base">{formatCurrency(settlement.net_amount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="text-indigo-600" size={24} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">정산 관리</h1>
                <p className="text-sm text-gray-600">주간 정산 내역을 확인하세요</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              대시보드로
            </button>
          </div>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">현재 포인트</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(currentStore?.points_balance || 0)}
                </p>
              </div>
              <Wallet className="text-gray-400" size={20} />
            </div>
          </div>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">정산 예정</p>
                <p className="text-lg font-bold text-indigo-600">
                  +{formatCurrency(summary.pendingAmount)}
                </p>
                <p className="text-xs text-gray-500">
                  {summary.pendingOrders}건
                </p>
              </div>
              <Clock className="text-indigo-400" size={20} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">다음 정산일</p>
                <p className="text-sm font-bold text-gray-900">
                  {summary.nextSettlementDate ? 
                    new Date(summary.nextSettlementDate).toLocaleDateString('ko-KR', {
                      month: 'numeric',
                      day: 'numeric',
                      weekday: 'short'
                    }) : '-'
                  }
                </p>
                <p className="text-xs text-gray-500">매주 금요일</p>
              </div>
              <Calendar className="text-gray-400" size={20} />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">이번달 정산</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(summary.completedThisMonth)}
                </p>
                <p className="text-xs text-gray-500">
                  누적: {formatCurrency(summary.totalCompleted)}
                </p>
              </div>
              <TrendingUp className="text-green-400" size={20} />
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => {
                  setActiveTab('pending')
                  setExpandedSettlement(null)
                }}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === 'pending'
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                정산 대기 ({pendingSettlements.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('completed')
                  setExpandedSettlement(null)
                }}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === 'completed'
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                정산 완료 ({completedSettlements.length})
              </button>
            </div>
          </div>
          {/* Settlement List */}
          <div className="p-4">
            {activeTab === 'pending' ? (
              pendingSettlements.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">정산 대기중인 내역이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSettlements.map(renderSettlementCard)}
                </div>
              )
            ) : (
              completedSettlements.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">완료된 정산 내역이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedSettlements.map(renderSettlementCard)}
                </div>
              )
            )}
          </div>
        </div>
        {/* Info Box */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
        <AlertCircle className="text-blue-600 mt-0.5" size={20} />
        <div className="text-sm text-blue-900">
        <p className="font-medium mb-1">정산 안내</p>
        <ul className="space-y-1 text-blue-800">
        <li>• 매주 금요일 오전 10시에 일괄 정산됩니다</li>
        <li>• 정산 금액은 총 매출에서 25% 수수료를 차감한 금액입니다</li>
        <li>• 정산 완료 후 포인트로 자동 지급됩니다</li>
        <li className="font-medium">• 각 정산 항목을 클릭하면 주문 상세 내역이 펼쳐집니다</li>
        <li>• 문의사항은 고객센터(1234-5678)로 연락주세요</li>
        </ul>
        </div>
        </div>
        </div>
      </div>
    </div>
  )
}
