'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Eye } from 'lucide-react'

export default function NewNoticePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isPinned, setIsPinned] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [preview, setPreview] = useState(false)
  
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
        .insert({
          title: title.trim(),
          content: content.trim(),
          is_active: isActive,
          is_pinned: isPinned
        })

      if (error) throw error
      
      toast.success('공지사항이 등록되었습니다')
      router.push('/notices')
    } catch (error) {
      console.error('Failed to create notice:', error)
      toast.error('공지사항 등록에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
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
        <h1 className="text-2xl font-bold text-gray-900">새 공지사항 작성</h1>
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
                <span className="text-sm font-medium text-gray-700">즉시 공개</span>
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
                  {isSubmitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium text-gray-900 mb-4">미리보기</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              {title || content ? (
                <>
                  <h4 className="font-bold text-lg mb-2">{title || '제목 없음'}</h4>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {content || '내용 없음'}
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  제목과 내용을 입력하면<br />
                  여기에 미리보기가 표시됩니다
                </p>
              )}
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
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <h4 className="font-medium text-yellow-800 mb-2">작성 가이드</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 명확하고 간결한 제목 사용</li>
              <li>• 중요 공지는 상단 고정 활용</li>
              <li>• 긴 내용은 단락으로 구분</li>
              <li>• 필요시 문의처 정보 포함</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}