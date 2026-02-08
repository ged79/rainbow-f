'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmotionalNavbar from '../../components/EmotionalNavbar'
import { User, Gift, ShoppingBag, Ticket, LogOut, ChevronRight, TrendingUp, Star, Users } from 'lucide-react'

export default function MyPage() {
  const router = useRouter()
  const [memberInfo, setMemberInfo] = useState<any>(null)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalPoints: 0,
    availableCoupons: 0,
    referralCount: 0,
    pointsBreakdown: {
      purchase: 0,
      referral: 0,
      welcome: 0
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    // Updated to use the correct session key
    const memberSession = localStorage.getItem('flower-member')
    
    if (!memberSession) {
      router.push('/login')
      return
    }

    try {
      const member = JSON.parse(memberSession)
      setMemberInfo(member)
      
      // 실제 데이터 로드
      await loadStats(member)
    } catch (e) {
      console.error('Failed to parse member session:', e)
      router.push('/login')
    }
  }

  const loadStats = async (member: any) => {
    setIsLoading(true)
    try {
      // 1. 주문 내역 조회
      try {
        const ordersRes = await fetch(`/api/orders?name=${encodeURIComponent(member.name)}&phone=${encodeURIComponent(member.phone)}`)
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          setStats(prev => ({ ...prev, totalOrders: ordersData.orders?.length || 0 }))
        }
      } catch (e) {
        console.log('Orders fetch failed:', e)
      }
      
      // 2. 포인트/쿠폰 조회
      try {
        const couponsRes = await fetch(`/api/coupons/available?phone=${encodeURIComponent(member.phone)}`)
        if (couponsRes.ok) {
          const couponsData = await couponsRes.json()
          setStats(prev => ({ 
            ...prev, 
            totalPoints: couponsData.totalPoints || 0,
            availableCoupons: couponsData.count || 0,
            pointsBreakdown: couponsData.breakdown || {
              purchase: 0,
              referral: 0,
              welcome: 0
            }
          }))
        }
      } catch (e) {
        console.log('Coupons fetch failed:', e)
      }
      
      // 3. 추천인 통계 조회
      try {
        const referralsRes = await fetch(`/api/referrals/stats?phone=${encodeURIComponent(member.phone)}`)
        if (referralsRes.ok) {
          const referralsData = await referralsRes.json()
          setStats(prev => ({ ...prev, referralCount: referralsData.referralCount || 0 }))
        }
      } catch (e) {
        console.log('Referrals fetch failed:', e)
      }
      
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('flower-member')
    router.push('/')
  }

  if (!memberInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
        <EmotionalNavbar fixed />
        <div className="pt-32 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50">
      <EmotionalNavbar fixed />
      
      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Profile Section */}
          <div className="bg-white rounded-xl shadow-sm border border-rose-100 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{memberInfo.name}님</h2>
                  <p className="text-gray-600">{memberInfo.phone}</p>
                  {memberInfo.email && (
                    <p className="text-gray-500 text-sm">{memberInfo.email}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">로그아웃</span>
              </button>
            </div>
          </div>

          {/* Stats Grid - 로딩 중일 때 스켈레톤 표시 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 hover:shadow-md transition-shadow md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">주문 내역</p>
                  {isLoading ? (
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-xl font-bold text-gray-900">{stats.totalOrders}건</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-4 hover:shadow-md transition-shadow md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-600 text-sm">보유 포인트</p>
                  {isLoading ? (
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}원</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4 hover:shadow-md transition-shadow md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">추천인</p>
                  {isLoading ? (
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-xl font-bold text-gray-900">{stats.referralCount}명</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 포인트 상세 내역 */}
          {stats.totalPoints > 0 && !isLoading && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">포인트 상세</h3>
                <p className="text-lg font-bold text-green-600">{stats.totalPoints.toLocaleString()}원</p>
              </div>
              <div className="space-y-2">
                {stats.pointsBreakdown.purchase > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <ShoppingBag className="w-4 h-4 text-blue-500" />
                      구매 적립
                    </span>
                    <span className="font-medium">{stats.pointsBreakdown.purchase.toLocaleString()}원</span>
                  </div>
                )}
                {stats.pointsBreakdown.referral > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4 text-purple-500" />
                      추천 적립
                    </span>
                    <span className="font-medium">{stats.pointsBreakdown.referral.toLocaleString()}원</span>
                  </div>
                )}
                {stats.pointsBreakdown.welcome > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500" />
                      회원가입 쿠폰
                    </span>
                    <span className="font-medium">{stats.pointsBreakdown.welcome.toLocaleString()}원</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Menu List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <Link href="/shopping-cart?tab=orders" className="flex items-center justify-between p-4 hover:bg-rose-50 border-b transition-colors">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-gray-700" />
                <span className="text-gray-900 font-medium">주문/찜한 내역</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            
            <Link href="/my-referrals" className="flex items-center justify-between p-4 hover:bg-rose-50 border-b transition-colors">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-700" />
                <span className="text-gray-900 font-medium">추천인 관리</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            
            <Link href="/points" className="flex items-center justify-between p-4 hover:bg-rose-50 transition-colors">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-gray-700" />
                <span className="text-gray-900 font-medium">포인트 내역</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>

          {/* Notice - 동적으로 표시 */}
          {stats.totalPoints > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-900 flex items-start gap-2">
                <span className="text-lg">💐</span>
                <span>
                  {stats.totalPoints.toLocaleString()}원의 포인트를 사용할 수 있습니다!
                  {stats.pointsBreakdown.welcome > 0 && ' (회원가입 쿠폰 포함)'}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}