'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/useStore'
import { apiService } from '@/services/api'
import { 
  CreditCard,
  TrendingUp,
  TrendingDown,
  Plus,
  History,
  DollarSign,
  Package
} from 'lucide-react'
import type { PointTransaction } from '@flower/shared/types'
import { formatCurrency } from '@flower/shared/utils'
import { BUSINESS_RULES } from '@flower/shared/constants'
import toast from 'react-hot-toast'

const CHARGE_OPTIONS = [
  { amount: 100000, label: '10만원' },
  { amount: 300000, label: '30만원' },
  { amount: 500000, label: '50만원', bonus: '추천' },
  { amount: 1000000, label: '100만원', bonus: '인기' },
]

export default function PointsPage() {
  const router = useRouter()
  const { currentStore, setCurrentStore } = useStore()
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<PointTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showChargeModal, setShowChargeModal] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState(500000)
  const [isCharging, setIsCharging] = useState(false)
  const [filter, setFilter] = useState<'all' | 'charge' | 'payment' | 'income'>('all')

  useEffect(() => {
    if (!currentStore) {
      router.push('/login')
      return
    }
    loadPointData()
  }, [currentStore])

  const loadPointData = async () => {
    try {
      const result = await apiService.getPoints()
      
      if (result.transactions) {
        setTransactions(result.transactions)
        setFilteredTransactions(result.transactions)
      }
    } catch (error) {
      toast.error('포인트 정보를 불러올 수 없습니다')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 필터 변경 시 거래내역 필터링
    if (filter === 'all') {
      setFilteredTransactions(transactions)
    } else {
      setFilteredTransactions(transactions.filter(t => t.type === filter))
    }
  }, [filter, transactions])

  const handleCharge = async () => {
    if (selectedAmount < BUSINESS_RULES.MIN_CHARGE) {
      toast.error(`최소 충전 금액은 ${formatCurrency(BUSINESS_RULES.MIN_CHARGE)}입니다`)
      return
    }
    
    setIsCharging(true)
    try {
      const result = await apiService.chargePoints(selectedAmount)
      
      if (result.data) {
        toast.success('포인트 충전이 완료되었습니다')
        setShowChargeModal(false)
        
        if (currentStore) {
          setCurrentStore({
            ...currentStore,
            points_balance: (currentStore.points_balance || 0) + selectedAmount
          })
        }
        await loadPointData()
      }
    } catch (error) {
      toast.error('충전 실패')
    } finally {
      setIsCharging(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch(type) {
      case 'charge': return <Plus className="text-green-500" size={20} />
      case 'payment': return <Package className="text-red-500" size={20} />
      case 'income': return <TrendingUp className="text-blue-500" size={20} />
      default: return <DollarSign className="text-gray-500" size={20} />
    }
  }

  const getTransactionLabel = (description: string, type: string) => {
    // 영어 타입을 한글로 변환
    if (type === 'charge') return '포인트 충전'
    if (type === 'payment') {
      if (description.includes('Order payment')) return '주문 결제'
      if (description.includes('partial refund')) return '주문 수정 - 부분 환불'
      return description
    }
    if (type === 'income' && description.includes('수수료')) {
      const match = description.match(/(\d{8}-\d{4})/)
      if (match) return `주문 수수료 25% - ${match[1]}`
    }
    return description
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">포인트 관리</h1>
          <p className="text-gray-600 mt-1">포인트 충전 및 사용 내역</p>
        </div>
        <button
          onClick={() => setShowChargeModal(true)}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 flex items-center gap-2"
        >
          <Plus size={20} />
          포인트 충전
        </button>
      </div>

      {/* 잔액 카드 - 크기 축소 */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg text-white p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-pink-100 text-sm mb-1">현재 포인트 잔액</p>
            <p className="text-3xl font-bold">{formatCurrency(currentStore?.points_balance || 0)}</p>
            {(currentStore?.points_balance || 0) < 100000 && (
              <p className="text-xs text-pink-200 mt-1">⚠️ 잔액 부족</p>
            )}
          </div>
          <CreditCard size={40} className="text-white opacity-30" />
        </div>
      </div>

      {/* 거래내역 - 정돈된 형태 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">거래 내역</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded ${filter === 'all' ? 'bg-pink-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                전체
              </button>
              <button
                onClick={() => setFilter('charge')}
                className={`px-3 py-1 text-sm rounded ${filter === 'charge' ? 'bg-pink-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                충전
              </button>
              <button
                onClick={() => setFilter('payment')}
                className={`px-3 py-1 text-sm rounded ${filter === 'payment' ? 'bg-pink-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                사용
              </button>
              <button
                onClick={() => setFilter('income')}
                className={`px-3 py-1 text-sm rounded ${filter === 'income' ? 'bg-pink-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                수익
              </button>
            </div>
          </div>
        </div>
        
        <div className="divide-y">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <History className="mx-auto mb-2 text-gray-400" size={32} />
              {filter === 'all' ? '거래 내역이 없습니다' : `${filter === 'charge' ? '충전' : filter === 'payment' ? '사용' : '수익'} 내역이 없습니다`}
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const isIncome = transaction.type === 'charge' || transaction.type === 'income'
              const date = new Date(transaction.created_at)
              
              return (
                <div key={transaction.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    {/* 아이콘 */}
                    <div className="mr-3">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    
                    {/* 날짜/시간 */}
                    <div className="min-w-[140px] mr-4">
                      <p className="text-sm font-medium">
                        {date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    {/* 설명 */}
                    <div className="flex-1">
                      <p className="text-sm">
                        {getTransactionLabel(transaction.description || '', transaction.type)}
                      </p>
                    </div>
                    
                    {/* 금액 */}
                    <div className="text-right">
                      <p className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      <p className="text-xs text-gray-500">
                        잔액 {formatCurrency(transaction.balance_after)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {showChargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">포인트 충전</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {CHARGE_OPTIONS.map((option) => (
                <button
                  key={option.amount}
                  onClick={() => setSelectedAmount(option.amount)}
                  className={`relative p-3 rounded-lg border-2 transition ${
                    selectedAmount === option.amount
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.bonus && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {option.bonus}
                    </span>
                  )}
                  <p className="font-semibold">{option.label}</p>
                </button>
              ))}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">충전 금액</span>
                <span className="text-xl font-bold text-pink-600">
                  {formatCurrency(selectedAmount)}
                </span>
              </div>
            </div>
            
            {/* 결제 수단 선택 */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">결제 수단 선택</p>
              <div className="space-y-2">
                <button className="w-full p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                      💳
                    </div>
                    <span>카드 결제</span>
                  </div>
                  <span className="text-gray-400">&gt;</span>
                </button>
                <button className="w-full p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      🏦
                    </div>
                    <span>무통장 입금</span>
                  </div>
                  <span className="text-gray-400">&gt;</span>
                </button>
                <button className="w-full p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                      <span className="text-xs font-bold">N</span>
                    </div>
                    <span>네이버페이</span>
                  </div>
                  <span className="text-gray-400">&gt;</span>
                </button>
                <button className="w-full p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded flex items-center justify-center">
                      💬
                    </div>
                    <span>카카오페이</span>
                  </div>
                  <span className="text-gray-400">&gt;</span>
                </button>
                <button className="w-full p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-xs font-bold">T</span>
                    </div>
                    <span>토스페이</span>
                  </div>
                  <span className="text-gray-400">&gt;</span>
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  toast.error('결제 시스템 연동 준비중입니다')
                }}
                className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              >
                결제하기
              </button>
              <button
                onClick={() => setShowChargeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
