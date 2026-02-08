'use client'

import { useEffect, useState } from 'react'
import { getAnalytics } from '@/lib/analytics'
import { useRouter } from 'next/navigation'

interface AnalyticsData {
  totalVisitors: number
  topPages: any[]
  topReferrers: any[]
  deviceStats: any[]
  browserStats: any[]
}

export default function AnalyticsDashboard() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(30)

  // 간단한 비밀번호 인증 (실제로는 더 강력한 인증 권장)
  const ADMIN_PASSWORD = 'rainbow2025'

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      fetchAnalytics()
    } else {
      alert('비밀번호가 틀렸습니다')
    }
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const data = await getAnalytics(days)
      if (data) {
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      alert('분석 데이터를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics()
    }
  }, [days])

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            🌈 레인보우
          </h1>
          <h2 className="text-center text-gray-600 mb-8">분석 대시보드</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition"
            >
              접속
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            권한이 없는 접근은 기록됩니다
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">📊 분석 대시보드</h1>
            <p className="text-gray-600 mt-2">지난 {days}일간의 방문자 통계</p>
          </div>

          <button
            onClick={() => {
              setIsAuthenticated(false)
              setPassword('')
            }}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
          >
            로그아웃
          </button>
        </div>

        {/* 기간 선택 */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <label className="text-sm font-medium text-gray-700 mr-4">
            기간 선택:
          </label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value={7}>지난 7일</option>
            <option value={30}>지난 30일</option>
            <option value={90}>지난 90일</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        ) : analytics ? (
          <div className="space-y-8">
            {/* 주요 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium">총 방문자 수</h3>
                <p className="text-4xl font-bold text-pink-600 mt-2">
                  {analytics.totalVisitors.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium">
                  인기 페이지
                </h3>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {analytics.topPages.length}개
                </p>
              </div>
            </div>

            {/* 인기 페이지 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🔥 인기 페이지
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-gray-700">
                        페이지
                      </th>
                      <th className="px-6 py-3 font-semibold text-gray-700 text-right">
                        방문 수
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topPages.map((page, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">{page.page_path}</td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {page.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 유입 경로 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🔗 유입 경로 (Top 10)
              </h2>
              <div className="space-y-3">
                {analytics.topReferrers.map((ref, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-gray-700 truncate">
                      {ref.referrer || '(직접 방문)'}
                    </span>
                    <span className="text-gray-600">{ref.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 기기 분포 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  📱 기기 분포
                </h2>
                <div className="space-y-3">
                  {analytics.deviceStats.map((device, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-gray-700">
                        {device.device_type || '불명'}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {device.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 브라우저 분포 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  🌐 브라우저
                </h2>
                <div className="space-y-3">
                  {analytics.browserStats.map((browser, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-gray-700">{browser.browser}</span>
                      <span className="font-semibold text-gray-900">
                        {browser.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">분석 데이터가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
