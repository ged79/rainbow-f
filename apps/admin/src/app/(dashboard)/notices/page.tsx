'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { formatDate } from '@/shared/utils'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Pin,
  Search,
  Filter
} from 'lucide-react'

interface Notice {
  id: string
  title: string
  content: string
  is_active: boolean
  is_pinned: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadNotices()
  }, [])

  useEffect(() => {
    filterNotices()
  }, [notices, searchQuery, filterActive])

  const loadNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotices(data || [])
    } catch (error) {
      console.error('Failed to load notices:', error)
      toast.error('공지사항을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const filterNotices = () => {
    let filtered = [...notices]

    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterActive !== 'all') {
      filtered = filtered.filter(n => 
        filterActive === 'active' ? n.is_active : !n.is_active
      )
    }

    setFilteredNotices(filtered)
  }

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_active: !currentState })
        .eq('id', id)

      if (error) throw error
      
      toast.success(currentState ? '비활성화되었습니다' : '활성화되었습니다')
      loadNotices()
    } catch (error) {
      toast.error('상태 변경에 실패했습니다')
    }
  }

  const togglePin = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_pinned: !currentState })
        .eq('id', id)

      if (error) throw error
      
      toast.success(currentState ? '고정 해제되었습니다' : '고정되었습니다')
      loadNotices()
    } catch (error) {
      toast.error('고정 상태 변경에 실패했습니다')
    }
  }

  const deleteNotice = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success('삭제되었습니다')
      loadNotices()
    } catch (error) {
      toast.error('삭제에 실패했습니다')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">공지사항 관리</h1>
          <p className="text-gray-500 mt-1">클라이언트 앱에 표시될 공지사항을 관리합니다</p>
        </div>
        <button
          onClick={() => router.push('/notices/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          새 공지사항
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목 또는 내용 검색..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">전체 공지</p>
          <p className="text-2xl font-bold">{notices.length}개</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">활성 공지</p>
          <p className="text-2xl font-bold text-green-600">
            {notices.filter(n => n.is_active).length}개
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">고정 공지</p>
          <p className="text-2xl font-bold text-blue-600">
            {notices.filter(n => n.is_pinned).length}개
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">총 조회수</p>
          <p className="text-2xl font-bold">
            {notices.reduce((sum, n) => sum + n.view_count, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Notices List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">조회수</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성일</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredNotices.length > 0 ? (
              filteredNotices.map((notice) => (
                <tr key={notice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {notice.is_pinned && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                          <Pin className="h-3 w-3 mr-1" />
                          고정
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        notice.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {notice.is_active ? '활성' : '비활성'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{notice.title}</p>
                      <p className="text-sm text-gray-500 truncate max-w-md">
                        {notice.content.replace(/<[^>]*>/g, '').slice(0, 50)}...
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-gray-400" />
                      {notice.view_count.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(notice.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => togglePin(notice.id, notice.is_pinned)}
                        className={`p-1 rounded hover:bg-gray-100 ${
                          notice.is_pinned ? 'text-blue-600' : 'text-gray-400'
                        }`}
                        title={notice.is_pinned ? '고정 해제' : '고정'}
                      >
                        <Pin className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(notice.id, notice.is_active)}
                        className={`p-1 rounded hover:bg-gray-100 ${
                          notice.is_active ? 'text-green-600' : 'text-gray-400'
                        }`}
                        title={notice.is_active ? '비활성화' : '활성화'}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/notices/${notice.id}/edit`)}
                        className="p-1 rounded hover:bg-gray-100 text-blue-600"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteNotice(notice.id)}
                        className="p-1 rounded hover:bg-gray-100 text-red-600"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  공지사항이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}