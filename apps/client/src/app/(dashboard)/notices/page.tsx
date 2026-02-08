'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@flower/shared/utils'
import type { Notice } from '@flower/shared/types'
import { Megaphone, Pin, Eye, ChevronRight } from 'lucide-react'

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    loadNotices()
  }, [])

  const loadNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotices(data || [])
    } catch (error) {
      console.error('Failed to load notices:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const incrementViewCount = async (notice: Notice) => {
    setSelectedNotice(notice)
    
    // 조회수 증가
    await supabase
      .from('notices')
      .update({ view_count: notice.view_count + 1 })
      .eq('id', notice.id)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Megaphone className="text-indigo-600" size={24} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
              <p className="text-sm text-gray-600">중요한 소식과 업데이트를 확인하세요</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {selectedNotice ? (
          // 상세보기
          <div className="bg-white rounded-lg shadow-lg p-6">
            <button
              onClick={() => setSelectedNotice(null)}
              className="mb-4 text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
            >
              ← 목록으로
            </button>
            
            <div className="mb-4">
              {selectedNotice.is_pinned && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 mb-2">
                  <Pin className="h-3 w-3 mr-1" />
                  고정
                </span>
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedNotice.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{formatDate(selectedNotice.created_at)}</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {selectedNotice.view_count}
                </span>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {selectedNotice.content}
              </div>
            </div>
          </div>
        ) : (
          // 목록
          <div className="space-y-3">
            {notices.length > 0 ? (
              notices.map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => incrementViewCount(notice)}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {notice.is_pinned && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
                            <Pin className="h-3 w-3 mr-1" />
                            고정
                          </span>
                        )}
                        <h3 className="font-semibold text-gray-900">
                          {notice.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {notice.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatDate(notice.created_at)}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {notice.view_count}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 mt-1" />
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Megaphone className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">공지사항이 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}