'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Search, Building2, MapPin, Phone, Mail, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface FuneralHome {
  id: string
  name: string
  address: string
  phone: string
  email: string
  room_count: number
  status: 'active' | 'inactive'
  created_at: string
  monthly_orders?: number
  total_revenue?: number
}

export default function FuneralHomesPage() {
  const [funeralHomes, setFuneralHomes] = useState<FuneralHome[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    monthlyOrders: 0,
    monthlyRevenue: 0
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadFuneralHomes()
  }, [])

  const loadFuneralHomes = async () => {
    try {
      const { data, error } = await supabase
        .from('funeral_homes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Load order stats for each funeral home
      const homesWithStats = await Promise.all(
        (data || []).map(async (home) => {
          const { count: monthlyOrders } = await supabase
            .from('customer_orders')
            .select('*', { count: 'exact', head: true })
            .eq('funeral_home_id', home.id)
            .gte('created_at', new Date(new Date().setDate(1)).toISOString())

          const { data: revenueData } = await supabase
            .from('customer_orders')
            .select('final_price')
            .eq('funeral_home_id', home.id)
            .gte('created_at', new Date(new Date().setDate(1)).toISOString())

          const total_revenue = revenueData?.reduce((sum, order) => sum + (order.final_price || 0), 0) || 0

          return {
            ...home,
            monthly_orders: monthlyOrders || 0,
            total_revenue
          }
        })
      )

      setFuneralHomes(homesWithStats)

      // Calculate stats
      const active = homesWithStats.filter(h => h.status === 'active').length
      const monthlyOrders = homesWithStats.reduce((sum, h) => sum + (h.monthly_orders || 0), 0)
      const monthlyRevenue = homesWithStats.reduce((sum, h) => sum + (h.total_revenue || 0), 0)

      setStats({
        total: homesWithStats.length,
        active,
        monthlyOrders,
        monthlyRevenue
      })
    } catch (error) {
      console.error('Failed to load funeral homes:', error)
      toast.error('장례식장 목록을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  const filteredHomes = funeralHomes.filter(home =>
    home.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    home.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">장례식장 관리</h1>
          <p className="text-gray-600 mt-1">플랫폼에 등록된 장례식장을 관리합니다</p>
        </div>
        <Link
          href="/funeral-homes/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>새 장례식장 등록</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 장례식장</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <Building2 className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">활성 장례식장</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% 활성률
              </p>
            </div>
            <AlertCircle className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">이번 달 주문</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.monthlyOrders}</p>
              <p className="text-xs text-gray-500 mt-1">전체 장례식장 합계</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">이번 달 매출</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(stats.monthlyRevenue / 10000).toFixed(0)}만
              </p>
              <p className="text-xs text-gray-500 mt-1">₩{stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="장례식장 이름, 지역으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-gray-900"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                장례식장명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                위치
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                빈소 수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                연락처
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이번 달 주문
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                매출
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : filteredHomes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm ? '검색 결과가 없습니다' : '등록된 장례식장이 없습니다'}
                </td>
              </tr>
            ) : (
              filteredHomes.map((home) => (
                <tr key={home.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">{home.name}</div>
                        <div className="text-xs text-gray-500">{home.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 line-clamp-2">{home.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{home.room_count}개</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{home.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {home.monthly_orders}건
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      ₩{(home.total_revenue || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      home.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {home.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/funeral-homes/${home.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        상세보기
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={`/funeral-homes/${home.id}/edit`}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        수정
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
