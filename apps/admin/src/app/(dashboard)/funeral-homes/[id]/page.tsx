'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Building2, MapPin, Phone, Mail, Users, Package, TrendingUp, Edit, AlertCircle, Clock, User } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Funeral {
  id: string
  room_number: number
  deceased_name: string
  age?: number
  placement_time?: string
  funeral_time?: string
  family_members?: Array<{ relation: string; name: string }>
}

function RoomStatus({ funeralHomeId }: { funeralHomeId: string }) {
  const [funerals, setFunerals] = useState<Funeral[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadFunerals()
  }, [funeralHomeId])

  const loadFunerals = async () => {
    try {
      const { data, error } = await supabase
        .from('funerals')
        .select('*')
        .eq('funeral_home_id', funeralHomeId)
        .eq('status', 'active')
        .order('room_number', { ascending: true })

      if (error) throw error
      setFunerals(data || [])
    } catch (error) {
      console.error('Failed to load funerals:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">로딩 중...</div>
  }

  if (funerals.length === 0) {
    return <div className="text-center py-8 text-gray-500">현재 사용 중인 빈소가 없습니다</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {funerals.map((funeral) => {
        const chiefMourner = funeral.family_members?.find((m: any) => m.relation === '상주')
        return (
          <div key={funeral.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  {funeral.room_number}빈소
                </span>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                사용중
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-lg font-bold text-gray-900">고 {funeral.deceased_name}</p>
                {funeral.age && (
                  <p className="text-sm text-gray-600">향년 {funeral.age}세</p>
                )}
              </div>
              {chiefMourner && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>상주: {chiefMourner.name}</span>
                </div>
              )}
              {funeral.funeral_time && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>발인: {new Date(funeral.funeral_time).toLocaleString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface FuneralHome {
  id: string
  name: string
  address: string
  phone: string
  email: string
  room_count: number
  contact_person: string
  status: 'active' | 'inactive'
  created_at: string
}

interface OrderStats {
  today: number
  thisWeek: number
  thisMonth: number
  total: number
  revenue: {
    today: number
    thisWeek: number
    thisMonth: number
    total: number
  }
}

export default function FuneralHomeDetailPage() {
  const params = useParams()
  const [funeralHome, setFuneralHome] = useState<FuneralHome | null>(null)
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      // Load funeral home
      const { data: home, error: homeError } = await supabase
        .from('funeral_homes')
        .select('*')
        .eq('id', params.id)
        .single()

      if (homeError) throw homeError
      setFuneralHome(home)

      // Load statistics
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

      const { count: todayCount } = await supabase
        .from('customer_orders')
        .select('*', { count: 'exact', head: true })
        .eq('funeral_home_id', params.id)
        .gte('created_at', today.toISOString())

      const { count: weekCount } = await supabase
        .from('customer_orders')
        .select('*', { count: 'exact', head: true })
        .eq('funeral_home_id', params.id)
        .gte('created_at', weekAgo.toISOString())

      const { count: monthCount } = await supabase
        .from('customer_orders')
        .select('*', { count: 'exact', head: true })
        .eq('funeral_home_id', params.id)
        .gte('created_at', monthStart.toISOString())

      const { count: totalCount } = await supabase
        .from('customer_orders')
        .select('*', { count: 'exact', head: true })
        .eq('funeral_home_id', params.id)

      // Load revenue
      const { data: todayRevenue } = await supabase
        .from('customer_orders')
        .select('final_price')
        .eq('funeral_home_id', params.id)
        .gte('created_at', today.toISOString())

      const { data: weekRevenue } = await supabase
        .from('customer_orders')
        .select('final_price')
        .eq('funeral_home_id', params.id)
        .gte('created_at', weekAgo.toISOString())

      const { data: monthRevenue } = await supabase
        .from('customer_orders')
        .select('final_price')
        .eq('funeral_home_id', params.id)
        .gte('created_at', monthStart.toISOString())

      const { data: totalRevenue } = await supabase
        .from('customer_orders')
        .select('final_price')
        .eq('funeral_home_id', params.id)

      setStats({
        today: todayCount || 0,
        thisWeek: weekCount || 0,
        thisMonth: monthCount || 0,
        total: totalCount || 0,
        revenue: {
          today: todayRevenue?.reduce((sum, o) => sum + (o.final_price || 0), 0) || 0,
          thisWeek: weekRevenue?.reduce((sum, o) => sum + (o.final_price || 0), 0) || 0,
          thisMonth: monthRevenue?.reduce((sum, o) => sum + (o.final_price || 0), 0) || 0,
          total: totalRevenue?.reduce((sum, o) => sum + (o.final_price || 0), 0) || 0
        }
      })

      // Load recent orders
      const { data: orders } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('funeral_home_id', params.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentOrders(orders || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('데이터를 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async () => {
    if (!funeralHome) return

    const newStatus = funeralHome.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase
      .from('funeral_homes')
      .update({ status: newStatus })
      .eq('id', funeralHome.id)

    if (error) {
      toast.error('상태 변경에 실패했습니다')
    } else {
      setFuneralHome({ ...funeralHome, status: newStatus })
      toast.success(`상태가 ${newStatus === 'active' ? '활성' : '비활성'}으로 변경되었습니다`)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!funeralHome) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">장례식장을 찾을 수 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Link
        href="/funeral-homes"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>장례식장 목록으로</span>
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{funeralHome.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {funeralHome.address}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {funeralHome.phone}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                  funeralHome.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {funeralHome.status === 'active' ? '활성' : '비활성'}
                </span>
                <span className="text-sm text-gray-500">
                  빈소 {funeralHome.room_count}개
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleStatus}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {funeralHome.status === 'active' ? '비활성화' : '활성화'}
            </button>
            <Link
              href={`/funeral-homes/${funeralHome.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              수정
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">오늘 주문</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.today}</p>
            <p className="text-sm text-gray-500 mt-1">₩{stats.revenue.today.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">이번 주</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.thisWeek}</p>
            <p className="text-sm text-gray-500 mt-1">₩{stats.revenue.thisWeek.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">이번 달</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.thisMonth}</p>
            <p className="text-sm text-gray-500 mt-1">₩{stats.revenue.thisMonth.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">전체</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            <p className="text-sm text-gray-500 mt-1">₩{stats.revenue.total.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Room Status */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">빈소 현황</h2>
        </div>
        <div className="p-6">
          <RoomStatus funeralHomeId={funeralHome.id} />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">최근 주문</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    주문 내역이 없습니다
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{order.order_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.product_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">₩{order.final_price?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleString('ko-KR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
