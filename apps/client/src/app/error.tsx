'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { logger } from '@/services/logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    logger.error('Application error', error, {
      digest: error.digest,
      stack: error.stack
    })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        
        <h1 className="mt-4 text-xl font-semibold text-center text-gray-900">
          서비스에 문제가 발생했습니다
        </h1>
        
        <p className="mt-2 text-sm text-center text-gray-600">
          일시적인 오류가 발생했습니다. 
          잠시 후 다시 시도해주세요.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <summary className="cursor-pointer font-medium">
              Error Details
            </summary>
            <pre className="mt-2 overflow-auto">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="mt-6 flex gap-3">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            <RefreshCw size={16} />
            다시 시도
          </button>
          
          <a
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <Home size={16} />
            홈으로
          </a>
        </div>
      </div>
    </div>
  )
}