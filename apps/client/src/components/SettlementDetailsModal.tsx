'use client'
import { useState, useEffect } from 'react'
import { 
  X, 
  Download, 
  Package, 
  Calendar, 
  Receipt,
  Clock,
  CheckCircle,
  TrendingDown,
  ShoppingBag
} from 'lucide-react'
import { formatCurrency } from '@flower/shared'
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
}
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
interface SettlementDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  settlement: Settlement | null
}
export default function SettlementDetailsModal({ 
  isOpen, 
  onClose, 
  settlement 
}: SettlementDetailsModalProps) {
  const [items, setItems] = useState<SettlementItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (isOpen && settlement) {
      loadSettlementItems()
    } else {
      // Reset state when modal closes
      setItems([])
      setError(null)
    }
  }, [isOpen, settlement])
  const loadSettlementItems = async () => {
    if (!settlement) return
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/settlements-items/${settlement.id}`)
      if (!response.ok) {
        throw new Error('Failed to load settlement details')
      }
      const data = await response.json()
      setItems(data.items || [])
    } catch (err) {
      setError('정산 상세 내역을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
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
  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.getFullYear()}. ${String(startDate.getMonth() + 1).padStart(2, '0')}. ${String(startDate.getDate()).padStart(2, '0')}. ~ ${endDate.getFullYear()}. ${String(endDate.getMonth() + 1).padStart(2, '0')}. ${String(endDate.getDate()).padStart(2, '0')}.`
  }
  const exportToCSV = () => {
    if (!settlement || items.length === 0) return
    const headers = ['주문번호', '주문일시', '상품명', '수량', '주문금액', '수수료율', '수수료', '정산금액']
    const rows = items.map(item => [
      item.order_number,
      formatDate(item.order_date),
      item.product_name,
      item.quantity.toString(),
      item.original_amount.toString(),
      `${item.commission_rate}%`,
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
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 text-yellow-700">
            <Clock size={16} />
            <span>정산 대기</span>
          </div>
        )
      case 'completed':
        return (
          <div className="flex items-center gap-1.5 text-green-700">
            <CheckCircle size={16} />
            <span>정산 완료</span>
          </div>
        )
      default:
        return null
    }
  }
  if (!isOpen || !settlement) return null
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">정산 상세 내역</h2>
                <p className="text-purple-100 text-sm mt-1">
                  {formatPeriod(settlement.period_start, settlement.period_end)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          {/* Status */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            {getStatusBadge(settlement.status)}
          </div>
          {/* Summary */}
          <div className="p-6 bg-white border-b">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                  <ShoppingBag size={14} />
                  <span>총 주문</span>
                </div>
                <p className="text-xl font-bold">{settlement.total_orders}건</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                  <Receipt size={14} />
                  <span>총 매출</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(settlement.total_amount)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
                  <TrendingDown size={14} />
                  <span>수수료</span>
                </div>
                <p className="text-xl font-bold text-red-600">
                  -{formatCurrency(settlement.commission_amount)}
                </p>
                <p className="text-xs text-gray-500">{settlement.commission_rate}%</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-indigo-600 text-sm mb-1">
                  <CheckCircle size={14} />
                  <span>정산 금액</span>
                </div>
                <p className="text-xl font-bold text-indigo-600">
                  {formatCurrency(settlement.net_amount)}
                </p>
              </div>
            </div>
          </div>
          {/* Items List */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: '400px' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Package size={16} className="text-indigo-600" />
                주문 내역 ({items.length}건)
              </h3>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
                disabled={items.length === 0}
              >
                <Download size={14} />
                다운로드
              </button>
            </div>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm">로딩 중...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto text-gray-300 mb-2" size={48} />
                <p className="text-gray-500">주문 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">{item.order_number}</p>
                        <p className="text-xs text-gray-500">{formatDate(item.order_date)}</p>
                      </div>
                      <span className={index === 0 ? "text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded" : "text-xs bg-gray-100 px-2 py-1 rounded"}>
                        {index + 1}개
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{item.product_name}</p>
                    <div className="flex justify-between text-xs">
                      <div>
                        <p className="text-gray-500">주문금액</p>
                        <p className="font-semibold">{formatCurrency(item.original_amount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">수수료</p>
                        <p className="font-semibold text-red-600">-{formatCurrency(item.commission_amount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">정산금액</p>
                        <p className="font-semibold text-indigo-600">{formatCurrency(item.net_amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
