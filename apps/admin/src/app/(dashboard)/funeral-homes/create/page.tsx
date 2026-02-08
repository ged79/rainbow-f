'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Users, Copy, Check, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function CreateFuneralHomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<'login' | 'password' | null>(null)
  const [credentials, setCredentials] = useState<{
    login_id: string
    password: string
  } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    room_count: 6,
    contact_person: '',
    status: 'active' as 'active' | 'inactive'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/funeral-homes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '등록 실패')
      }

      // 생성된 계정 정보 표시
      setCredentials(result.data.credentials)
      toast.success('장례식장이 등록되었습니다')
      
    } catch (error: any) {
      console.error('Failed to create funeral home:', error)
      toast.error(error.message || '장례식장 등록에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: 'login' | 'password') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    toast.success('복사되었습니다')
    setTimeout(() => setCopied(null), 2000)
  }

  // 등록 완료 후 계정 정보 표시
  if (credentials) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b bg-green-50">
            <h1 className="text-2xl font-bold text-green-900">✅ 등록 완료</h1>
            <p className="text-green-700 mt-1">장례식장 계정이 생성되었습니다</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ 아래 정보는 한 번만 표시됩니다. 반드시 복사해서 안전하게 보관하세요.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  로그인 ID
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={credentials.login_id}
                    className="flex-1 px-4 py-3 border rounded-lg bg-gray-50 font-mono text-lg"
                  />
                  <button
                    onClick={() => copyToClipboard(credentials.login_id, 'login')}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {copied === 'login' ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      readOnly
                      value={credentials.password}
                      className="w-full px-4 py-3 border rounded-lg bg-gray-50 font-mono text-lg pr-12"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.password, 'password')}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {copied === 'password' ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>장례식장 담당자에게 전달:</strong><br />
                위 로그인 ID와 비밀번호로 funeral-app에 접속할 수 있습니다.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => router.push('/funeral-homes')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                장례식장 목록으로
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 등록 폼
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href="/funeral-homes"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>장례식장 목록으로</span>
      </Link>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-bold text-gray-900">새 장례식장 등록</h1>
          <p className="text-gray-600 mt-1">로그인 ID와 비밀번호가 자동 생성됩니다</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              기본 정보
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                장례식장명 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 영동병원장례식장"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소 *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="충청북도 영동군 영동읍 대학로 106"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호 *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="043-743-4493"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  빈소 개수 *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={formData.room_count}
                  onChange={(e) => setFormData({ ...formData, room_count: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5" />
              담당자 정보
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자 이름 *
              </label>
              <input
                type="text"
                required
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="yeongdong@hospital.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Link
              href="/funeral-homes"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
