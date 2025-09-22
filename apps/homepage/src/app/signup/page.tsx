'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import EmotionalNavbar from '../../components/EmotionalNavbar'
import { User, Phone, Lock, Mail, Gift, Check, TrendingUp } from 'lucide-react'

// URL 파라미터 처리 컴포넌트
function URLParamsHandler({ onParamsLoaded }: { onParamsLoaded: (phone: string, name: string) => void }) {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const phone = searchParams.get('phone') || ''
    const name = searchParams.get('name') || ''
    onParamsLoaded(phone, name)
  }, [searchParams, onParamsLoaded])
  
  return null
}

function SignupForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    passwordConfirm: '',
    name: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [welcomeCoupon, setWelcomeCoupon] = useState<any>(null)
  
  // 기존 포인트 관련 state 추가
  const [existingPoints, setExistingPoints] = useState(0)
  const [existingCoupons, setExistingCoupons] = useState<any[]>([])
  const [isCheckingPoints, setIsCheckingPoints] = useState(false)

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // URL 파라미터 처리
  const handleParamsLoaded = (phone: string, name: string) => {
    if (phone) {
      const formattedPhone = formatPhoneNumber(phone)
      setFormData(prev => ({ ...prev, phone: formattedPhone }))
      // 해당 전화번호의 포인트 조회
      fetchExistingPoints(formattedPhone)
    }
    if (name) {
      setFormData(prev => ({ ...prev, name }))
    }
  }

  // 기존 포인트 조회
  const fetchExistingPoints = async (phone: string) => {
    if (!phone || phone.length < 13) return // 전화번호 형식이 완성되지 않으면 조회하지 않음
    
    setIsCheckingPoints(true)
    try {
      const res = await fetch(`/api/coupons/available?phone=${encodeURIComponent(phone)}`)
      if (res.ok) {
        const data = await res.json()
        setExistingPoints(data.totalPoints || 0)
        setExistingCoupons(data.coupons || [])
        console.log(`Found existing points: ${data.totalPoints}원 (${data.count} coupons)`)
      }
    } catch (error) {
      console.error('Failed to fetch existing points:', error)
    } finally {
      setIsCheckingPoints(false)
    }
  }

  // 전화번호 변경 시 포인트 조회
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    setFormData({ ...formData, phone: formatted })
    
    // 전화번호가 완성되면 포인트 조회
    if (formatted.length === 13) {
      fetchExistingPoints(formatted)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 유효성 검사
    if (!formData.phone || !formData.password || !formData.name) {
      alert('필수 정보를 모두 입력해주세요')
      return
    }

    if (formData.password.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다')
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          existingPoints, // 기존 포인트 정보 전달
          existingCoupons // 기존 쿠폰 정보 전달
        })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '회원가입 실패')
        return
      }

      // 회원가입 성공
      if (data.welcomeCoupon) {
        setWelcomeCoupon(data.welcomeCoupon)
      }
      
      // 이관된 포인트 정보가 있으면 표시
      if (data.transferredPoints) {
        setExistingPoints(data.transferredPoints)
      }
      
      setShowSuccess(true)
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (error) {
      alert('서버 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 성공 화면
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <EmotionalNavbar />
        <div className="max-w-md mx-auto px-4 pt-32">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              회원가입 완료!
            </h2>
            <p className="text-gray-600 mb-6">
              {formData.name}님, 환영합니다!
            </p>
            
            {/* 포인트 이관 정보 표시 */}
            {existingPoints > 0 && (
              <div className="bg-orange-50 rounded-lg p-4 mb-4">
                <TrendingUp className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-orange-600 mb-1">
                  기존 포인트 연결 완료
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {existingPoints.toLocaleString()}원
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  비회원 구매 포인트가 자동으로 연결되었습니다
                </p>
              </div>
            )}
            
            {welcomeCoupon && (
              <div className="bg-rose-50 rounded-lg p-4 mb-6">
                <Gift className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-rose-600 mb-1">
                  회원가입 축하 쿠폰
                </p>
                <p className="text-2xl font-bold text-rose-600">
                  {welcomeCoupon.amount.toLocaleString()}원
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  쿠폰번호: {welcomeCoupon.code}
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-500">
              잠시 후 로그인 페이지로 이동합니다...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <EmotionalNavbar />
      
      <div className="max-w-md mx-auto px-4 pt-20 pb-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
            회원가입
          </h1>
          
          <Suspense fallback={null}>
            <URLParamsHandler onParamsLoaded={handleParamsLoaded} />
          </Suspense>
          
          {/* 기존 포인트 안내 - URL 파라미터로 왔을 때만 표시 */}
          {existingPoints > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-6 border border-yellow-200">
              <div className="flex items-center gap-3">
                <Gift className="w-8 h-8 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">
                    🎉 {existingPoints.toLocaleString()}원의 포인트 발견!
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    회원가입 시 자동으로 연결됩니다
                  </p>
                  {existingCoupons.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      쿠폰 {existingCoupons.length}개 ({existingCoupons.filter(c => c.type === 'purchase').length}개 구매, {existingCoupons.filter(c => c.type === 'referral').length}개 추천)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSignup} className="space-y-4">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="홍길동"
                  required
                />
              </div>
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="010-1234-5678"
                  maxLength={13}
                  required
                />
                {isCheckingPoints && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-500"></div>
                  </div>
                )}
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 (선택)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="6자 이상"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={formData.passwordConfirm}
                  onChange={(e) => setFormData({...formData, passwordConfirm: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="비밀번호 재입력"
                  required
                />
              </div>
            </div>

            {/* 혜택 안내 */}
            <div className="bg-rose-50 rounded-lg p-4 my-6">
              <p className="text-sm font-semibold text-rose-600 mb-2">
                🎁 회원가입 혜택
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 신규가입 4,900포인트 즉시 지급</li>
                <li>• 구매금액의 3~5% 포인트 적립</li>
                <li>• 추천번호 입력 시 2% 추가 적립</li>
                {existingPoints > 0 && (
                  <li className="text-orange-600 font-semibold">
                    • 기존 포인트 {existingPoints.toLocaleString()}원 자동 연결!
                  </li>
                )}
              </ul>
            </div>

            {/* 가입 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? '처리중...' : 
               existingPoints > 0 ? `가입하고 ${existingPoints.toLocaleString()}원 받기` : '가입하기'}
            </button>

            {/* 로그인 링크 */}
            <p className="text-center text-sm text-gray-600 mt-4">
              이미 회원이신가요?{' '}
              <a href="/login" className="text-rose-600 hover:underline">
                로그인
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return <SignupForm />
}