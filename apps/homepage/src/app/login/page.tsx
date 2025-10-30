'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EmotionalNavbar from '../../components/EmotionalNavbar'
import { Phone, Lock, LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.phone || !formData.password) {
      alert('전화번호와 비밀번호를 입력해주세요')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ 쿠키 수신
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      console.log('Login response:', data)

      if (!res.ok) {
        alert(data.error || '로그인 실패')
        return
      }

      if (data.user) {
        // ✅ 마스킹되지 않은 원본 전화번호 저장 필요
        const cleanPhone = formData.phone.replace(/-/g, '')
        localStorage.setItem('flower-member', JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          phone: cleanPhone, // 원본 전화번호
          email: data.user.email,
          accessToken: data.accessToken // 토큰 저장
        }))
      }

      alert('로그인 성공!')
      window.dispatchEvent(new Event('storage'))
      router.push('/')
      
    } catch (error) {
      console.error('Login error:', error)
      alert('로그인 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <EmotionalNavbar />
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto px-4 pt-32">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-rose-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
              <p className="text-sm text-gray-600 mt-2">회원 로그인 후 더 많은 혜택을 받으세요</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="010-1234-5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      phone: formatPhoneNumber(e.target.value)
                    })}
                    maxLength={13}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="비밀번호 입력"
                    value={formData.password}
                    onChange={(e) => setFormData({
                      ...formData,
                      password: e.target.value
                    })}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 mt-6"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">또는</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => router.push('/signup')}
                className="w-full py-3 bg-white text-rose-500 font-semibold rounded-lg border-2 border-rose-500 hover:bg-rose-50 transition-colors"
              >
                회원가입
              </button>

              <div className="text-center mt-6">
                <button 
                  type="button"
                  onClick={() => router.push('/order-check')}
                  className="text-sm text-gray-600 hover:text-rose-600 underline"
                >
                  비회원 주문 조회
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
