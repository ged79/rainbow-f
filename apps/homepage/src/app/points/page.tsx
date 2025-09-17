'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EmotionalNavbar from '../../components/EmotionalNavbar'
import { ArrowLeft, Gift, ShoppingBag, Users, Star, Calendar, Clock, Wallet } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  amount: number
  type: 'purchase' | 'referral' | 'welcome'
  created_at: string
  expires_at: string
  used_at: string | null
  customer_phone: string
}

export default function PointsPage() {
  const router = useRouter()
  const [points, setPoints] = useState<Coupon[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [breakdown, setBreakdown] = useState({
    purchase: 0,
    referral: 0,
    welcome: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'purchase' | 'referral' | 'welcome'>('all')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const memberSession = localStorage.getItem('flower-member')
    
    if (!memberSession) {
      router.push('/login')
      return
    }

    try {
      const member = JSON.parse(memberSession)
      await loadPoints(member.phone)
    } catch (e) {
      console.error('Failed to parse member session:', e)
      router.push('/login')
    }
  }

  const loadPoints = async (phone: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/coupons/available?phone=${encodeURIComponent(phone)}`)
      if (res.ok) {
        const data = await res.json()
        setPoints(data.coupons || [])
        setTotalPoints(data.totalPoints || 0)
        setBreakdown(data.breakdown || { purchase: 0, referral: 0, welcome: 0 })
      }
    } catch (error) {
      console.error('Failed to load points:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingBag className="w-4 h-4 text-blue-500" />
      case 'referral':
        return <Users className="w-4 h-4 text-purple-500" />
      case 'welcome':
        return <Star className="w-4 h-4 text-yellow-500" />
      default:
        return <Gift className="w-4 h-4 text-gray-500" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return '구매 적립'
      case 'referral':
        return '추천 적립'
      case 'welcome':
        return '회원가입 쿠폰'
      default:
        return '포인트'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`
  }

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredPoints = activeTab === 'all' 
    ? points 
    : points.filter(p => p.type === activeTab)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmotionalNavbar fixed />
        <div className="pt-32 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmotionalNavbar fixed />
      
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* 헤더 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>뒤로가기</span>
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">포인트 내역</h1>
            <p className="text-gray-600">사용 가능한 포인트를 확인하세요</p>
          </div>

          {/* 포인트 요약 */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">총 보유 포인트</h2>
              <p className="text-2xl font-bold text-green-600">{totalPoints.toLocaleString()}원</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">구매 적립</p>
                <p className="text-lg font-semibold text-blue-600">{breakdown.purchase.toLocaleString()}원</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">추천 적립</p>
                <p className="text-lg font-semibold text-purple-600">{breakdown.referral.toLocaleString()}원</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">회원가입</p>
                <p className="text-lg font-semibold text-yellow-600">{breakdown.welcome.toLocaleString()}원</p>
              </div>
            </div>
            
            {/* 출금 버튼 추가 */}
            {totalPoints >= 5000 && (
              <button
                onClick={() => router.push('/withdraw')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Wallet className="w-5 h-5" />
                <span>포인트 출금 (최소 5,000원)</span>
              </button>
            )}
          </div>

          {/* 탭 메뉴 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'text-rose-600 border-b-2 border-rose-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                전체 ({points.length})
              </button>
              <button
                onClick={() => setActiveTab('purchase')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'purchase'
                    ? 'text-rose-600 border-b-2 border-rose-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                구매 ({points.filter(p => p.type === 'purchase').length})
              </button>
              <button
                onClick={() => setActiveTab('referral')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'referral'
                    ? 'text-rose-600 border-b-2 border-rose-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                추천 ({points.filter(p => p.type === 'referral').length})
              </button>
              <button
                onClick={() => setActiveTab('welcome')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'welcome'
                    ? 'text-rose-600 border-b-2 border-rose-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                이벤트 ({points.filter(p => p.type === 'welcome').length})
              </button>
            </div>
          </div>

          {/* 포인트 리스트 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredPoints.length === 0 ? (
              <div className="p-8 text-center">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">포인트 내역이 없습니다</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredPoints.map((point) => {
                  const daysRemaining = getDaysRemaining(point.expires_at)
                  const isExpiringSoon = daysRemaining <= 7
                  
                  return (
                    <div key={point.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getTypeIcon(point.type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {getTypeLabel(point.type)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              코드: {point.code}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(point.created_at)}
                              </span>
                              <span className={`flex items-center gap-1 ${isExpiringSoon ? 'text-orange-500 font-medium' : ''}`}>
                                <Clock className="w-3 h-3" />
                                {isExpiringSoon ? `${daysRemaining}일 남음` : `${daysRemaining}일 후 만료`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            +{point.amount.toLocaleString()}원
                          </p>
                          {point.used_at && (
                            <p className="text-xs text-gray-400 mt-1">사용완료</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 안내사항 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">포인트 사용 안내</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• 포인트는 주문 시 자동으로 적용됩니다</li>
              <li>• 포인트 유효기간은 발급일로부터 30일입니다</li>
              <li>• 구매 금액의 3% (추천인 있을 시 5%) 적립</li>
              <li>• 추천한 친구 구매 시 3% 추가 적립</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
