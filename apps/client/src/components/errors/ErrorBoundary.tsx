'use client'
import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
interface Props {
  children: React.ReactNode
}
interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
    }
    // TODO: Send error to monitoring service
    // logErrorToService(error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }
  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-center text-gray-900">
              문제가 발생했습니다
            </h1>
            <p className="mt-2 text-sm text-center text-gray-600">
              예기치 않은 오류가 발생했습니다. 불편을 드려 죄송합니다.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-700 font-mono overflow-auto">
                <p className="font-semibold">Error:</p>
                <p>{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <>
                    <p className="mt-2 font-semibold">Stack:</p>
                    <pre className="whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
              >
                <RefreshCw size={16} />
                다시 시도
              </button>
              <a
                href="/"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                <Home size={16} />
                홈으로
              </a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
