'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EmotionalNavbar from '../../components/EmotionalNavbar'
import { TrendingUp, Users, Gift, Share2, Copy, MessageCircle, Calendar, DollarSign, Award, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface ReferralStats {
  totalReferrals: number
  totalEarned: number
  thisMonth: number
  lastMonth: number
  currentTier: string
  nextTier: string
  referralsToNext: number
}

interface ReferralItem {
  id: string
  buyerName: string
  orderDate: string
  orderAmount: number
  earnedPoints: number
  status: string
}

const TIER_INFO = {
  BRONZE: { 
    name: '브론즈', 
    badge: '🥉', 
    rate: 3, 
    min: 0, 
    max: 4,
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600'
  },
  SILVER: { 
    name: '실버', 
    badge: '🥈', 
    rate: 3.5, 
    min: 5, 
    max: 9,
    color: 'from-gray-400 to-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600'
  },
  GOLD: { 
    name: '골드', 
    badge: '🥇', 
    rate: 4, 
    min: 10, 
    max: 19,
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600'
  },
  VIP: { 
    name: 'VIP', 
    badge: '💎', 
    rate: 5, 
    min: 20, 
    max: null,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  }
}

export default function MyReferralsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalEarned: 0,
    thisMonth: 0,
    lastMonth: 0,
    currentTier: 'BRONZE',
    nextTier: 'SILVER',
    referralsToNext: 5
  })
  const [referrals, setReferrals] = useState<ReferralItem[]>([])
  const [userPhone, setUserPhone] = useState('')
  const [userName, setUserName] = useState('')
  const [referralLink, setReferralLink] = useState('')
  const [showCopyToast, setShowCopyToast] = useState(false)

  useEffect(() => {
    checkAuth()
    loadReferralData()
  }, [])

  const checkAuth = () => {
    const memberSession = localStorage.getItem('flower-member')
    if (!memberSession) {
      alert('로그인이 필요합니다')
      router.push('/login')
      return
    }
    
    try {
      const member = JSON.parse(memberSession)
      setUserPhone(member.phone || '')
      setUserName(member.name || '')
      
      // 추천 링크 생성
      const baseUrl = window.location.origin
      const link = `${baseUrl}?ref=${encodeURIComponent(member.phone)}`
      setReferralLink(link)
    } catch (e) {
      console.error('Failed to parse member session:', e)
      router.push('/login')
    }
  }

  const loadReferralData = async () => {
    const memberSession = localStorage.getItem('flower-member')
    if (!memberSession) return
    
    try {
      const member = JSON.parse(memberSession)
      
      // 추천 통계 조회
      const statsRes = await fetch(`/api/referrals/stats?phone=${encodeURIComponent(member.phone)}`)
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats || stats)
      }
      
      // 추천 내역 조회
      const historyRes = await fetch(`/api/referrals/history?phone=${encodeURIComponent(member.phone)}`)
      if (historyRes.ok) {
        const data = await historyRes.json()
        setReferrals(data.referrals || [])
      }
    } catch (error) {
      console.error('Failed to load referral data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setShowCopyToast(true)
    setTimeout(() => setShowCopyToast(false), 2000)
  }

  const shareKakao = () => {
    // Kakao SDK가 로드되지 않았으면 alert
    if (typeof window !== 'undefined' && !(window as any).Kakao) {
      alert('카카오톡 공유 기능을 준비 중입니다.')
      return
    }

    const Kakao = (window as any).Kakao
    
    if (!Kakao.isInitialized()) {
      Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY)
    }

    Kakao.Share.sendDefault({
      objectType: 'commerce',
      content: {
        title: '🌸 꽃배달 서비스 추천합니다!',
        description: `${userName}님의 추천으로 가입하시면 5% 포인트 적립! (일반 3%)`,
        imageUrl: 'https://images.unsplash.com/photo-1587556439426-dfcc3adf499b?w=800',
        link: {
          mobileWebUrl: referralLink,
          webUrl: referralLink,
        },
      },
      commerce: {
        productName: '프리미엄 꽃배달 서비스',
        regularPrice: 100000,
        discountPrice: 85000,
        discountRate: 15,
      },
      buttons: [
        {
          title: '5% 추가 적립받기',
          link: {
            mobileWebUrl: referralLink,
            webUrl: referralLink,
          },
        },
      ],
    })
  }

  const shareNaver = () => {
    const encUrl = encodeURIComponent(referralLink)
    const encTxt = encodeURIComponent(`🌸 꽃배달 추천! 가입 시 5% 포인트 적립`)
    window.open(`https://share.naver.com/web/shareView?url=${encUrl}&title=${encTxt}`)
  }

  const currentTierInfo = TIER_INFO[stats.currentTier as keyof typeof TIER_INFO] || TIER_INFO.BRONZE
  const nextTierInfo = TIER_INFO[stats.nextTier as keyof typeof TIER_INFO] || TIER_INFO.SILVER
  const progressPercent = currentTierInfo.max 
    ? ((stats.thisMonth - currentTierInfo.min) / (currentTierInfo.max - currentTierInfo.min + 1)) * 100
    : 100

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50">
        <EmotionalNavbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50">
      <EmotionalNavbar />
      
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">나의 추천 현황</h1>
          <p className="text-gray-600">친구를 추천하고 포인트를 받으세요!</p>
        </div>

        {/* 현재 등급 및 진행 상황 */}
        <div className={`bg-gradient-to-r ${currentTierInfo.color} rounded-2xl p-6 text-white mb-6 shadow-lg`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-4xl">{currentTierInfo.badge}</span>
                <div>
                  <h3 className="text-xl font-bold">{currentTierInfo.name} 등급</h3>
                  <p className="text-sm opacity-90">추천 보상 {currentTierInfo.rate}%</p>
                </div>
              </div>
            </div>
            <Award className="w-8 h-8 opacity-50" />
          </div>

          {/* 다음 등급까지 진행률 */}
          {stats.currentTier !== 'VIP' && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>다음 등급: {nextTierInfo.badge} {nextTierInfo.name}</span>
                <span>{stats.referralsToNext}명 더 추천 필요</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div 
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <Users className="w-6 h-6 text-rose-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
            <p className="text-sm text-gray-600">총 추천</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <DollarSign className="w-6 h-6 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalEarned.toLocaleString()}원</p>
            <p className="text-sm text-gray-600">총 적립</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <Calendar className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
            <p className="text-sm text-gray-600">이번 달</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <TrendingUp className="w-6 h-6 text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.lastMonth}</p>
            <p className="text-sm text-gray-600">지난 달</p>
          </div>
        </div>

        {/* 추천 링크 섹션 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-rose-500" />
            나의 추천 링크
          </h3>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 text-sm"
            />
            <button
              onClick={copyLink}
              className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              복사
            </button>
          </div>

          {/* 공유 버튼들 */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={shareKakao}
              className="px-4 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              카카오톡
            </button>
            <button
              onClick={shareNaver}
              className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              네이버
            </button>
            <button
              onClick={() => {
                const text = `🌸 꽃배달 추천!\n${userName}님의 추천으로 가입하시면 5% 포인트 적립!\n${referralLink}`
                navigator.clipboard.writeText(text)
                setShowCopyToast(true)
                setTimeout(() => setShowCopyToast(false), 2000)
              }}
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="w-5 h-5" />
              텍스트 복사
            </button>
          </div>

          {/* 안내 문구 */}
          <div className="mt-4 p-3 bg-rose-50 rounded-lg">
            <p className="text-sm text-gray-700">
              💡 <strong>추천 혜택:</strong> 친구가 구매하면 구매금액의 {currentTierInfo.rate}%를 포인트로 적립!
            </p>
          </div>
        </div>

        {/* 추천 내역 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-rose-500" />
            추천 내역
          </h3>
          
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">아직 추천 내역이 없습니다</p>
              <p className="text-sm text-gray-400">
                위의 추천 링크를 공유하여 친구를 초대해보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{item.buyerName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.orderDate).toLocaleDateString()} 구매
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      +{item.earnedPoints.toLocaleString()}원
                    </p>
                    <p className="text-xs text-gray-500">
                      구매금액 {item.orderAmount.toLocaleString()}원
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 등급 안내 */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4">등급별 혜택</h3>
          <div className="space-y-3">
            {Object.entries(TIER_INFO).map(([key, tier]) => (
              <div 
                key={key} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  key === stats.currentTier ? tier.bgColor : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tier.badge}</span>
                  <div>
                    <p className={`font-medium ${key === stats.currentTier ? tier.textColor : 'text-gray-700'}`}>
                      {tier.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      월 {tier.min}{tier.max ? `~${tier.max}` : '+'} 건 추천
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${key === stats.currentTier ? tier.textColor : 'text-gray-700'}`}>
                    {tier.rate}% 적립
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 복사 완료 토스트 */}
      {showCopyToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          복사되었습니다!
        </div>
      )}
    </div>
  )
}