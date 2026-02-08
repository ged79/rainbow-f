'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Eye } from 'lucide-react'

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

export default function EditNoticePage() {
  const [notice, setNotice] = useState<Notice | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isPinned, setIsPinned] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [preview, setPreview] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const noticeId = params.id as string
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadNotice()
  }, [noticeId])

  const loadNotice = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('id', noticeId)
        .single()

      if (error) throw error
      
      if (data) {
        setNotice(data)
        setTitle(data.title)
        setContent(data.content)
        setIsActive(data.is_active)
        setIsPinned(data.is_pinned)
      }
    } catch (error) {
      console.error('Failed to load notice:', error)
      toast.error('공지사항을 불러오는데 실패했습니다')
      router.push('/notices')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('notices')
        .update({
          title: title.trim(),
          content: content.trim(),
          is_active: isActive,
          is_pinned: isPinned,
          updated_at: new Date().toISOString()
        })
        .eq('id', noticeId)

      if (error) throw error
      
      toast.success('공지사항이 수정되었습니다')
      router.push('/notices')
    } catch (error) {
      console.error('Failed to update notice:', error)
      toast.error('공지사항 수정에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!notice) {
    return (
      <div className="p-6">
        <p className="text-gray-500">공지사항을 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </button>
        <h1 className="text-2xl font-bold text-gray-900">공지사항 수정</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="공지사항 제목을 입력하세요"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/200</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={15}
                placeholder="공지사항 내용을 입력하세요..."
              />
            </div>

            <div className="flex items-center gap-6 mb-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">공개</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">상단 고정</span>
              </label>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {preview ? '편집' : '미리보기'}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? '수정 중...' : '수정'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium text-gray-900 mb-4">미리보기</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-bold text-lg mb-2">{title || '제목 없음'}</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {content || '내용 없음'}
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">상태</span>
                <span className={isActive ? 'text-green-600' : 'text-gray-500'}>
                  {isActive ? '공개' : '비공개'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">고정</span>
                <span className={isPinned ? 'text-blue-600' : 'text-gray-500'}>
                  {isPinned ? '상단 고정' : '일반'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">조회수</span>
                <span className="font-medium">{notice.view_count.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h4 className="font-medium text-blue-800 mb-2">수정 정보</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>작성일: {new Date(notice.created_at).toLocaleString('ko-KR')}</p>
              <p>수정일: {new Date(notice.updated_at).toLocaleString('ko-KR')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}