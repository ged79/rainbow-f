import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 rounded-full">
          <FileQuestion className="w-8 h-8 text-gray-600" />
        </div>
        
        <h1 className="mt-6 text-4xl font-bold text-gray-900">404</h1>
        
        <h2 className="mt-2 text-xl font-semibold text-gray-700">
          페이지를 찾을 수 없습니다
        </h2>
        
        <p className="mt-2 text-sm text-gray-600">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
          >
            <Home size={16} />
            대시보드로 이동
          </Link>
        </div>
      </div>
    </div>
  )
}
