'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/useStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { logger } from '@/services/logger'

export default function LoginPage() {
  const router = useRouter()
  const store = useStore() // Get the whole store
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      logger.info('Login attempt', { email: formData.email })
      
      // Clear previous session before login
      store.clearSession()
      
      // Clear localStorage to prevent cache conflicts
      if (typeof window !== 'undefined') {
        localStorage.removeItem('flower-app-storage')
      }
      
      // Use server-side auth for proper session management
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        logger.error('Login failed', { 
          status: response.status, 
          error: data.error 
        })
        toast.error(data.error || '로그인 실패')
        return
      }

      // Set local state for UI
      if (data.user && data.store) {
        store.setSession({
          user: {
            id: data.user.id,
            email: data.user.email,
            store_id: data.store?.id
          },
          store: data.store
        })
        store.setCurrentStore(data.store)
        
        logger.info('Login successful', { 
          userId: data.user.id,
          storeId: data.store?.id 
        })
      }

      toast.success('로그인 성공!')
      
      // Navigate to dashboard
      router.push('/dashboard')
      router.refresh()
      
    } catch (error: any) {
      logger.error('Login error', error)
      toast.error(error.message || '로그인 실패')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🌸 로그인
            </h1>
            <p className="text-gray-600">
              전국 꽃배달 플랫폼에 오신 것을 환영합니다
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="example@flower.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                />
                <span className="text-sm text-gray-600">자동 로그인</span>
              </label>
              <a href="/forgot-password" className="text-sm text-pink-500 hover:underline">
                비밀번호 찾기
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              아직 계정이 없으신가요?{' '}
              <a href="/register" className="text-pink-500 font-semibold hover:underline">
                회원가입
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}