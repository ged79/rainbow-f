'use client'
import React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
interface Props {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}
interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorCount: number
}
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))
    // Send error to logging service (when implemented)
    this.logErrorToService(error, errorInfo)
  }
  logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: Send to Sentry or similar service
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
    }
    // For now, just log to console in development
    if (process.env.NODE_ENV === 'development') {
    }
  }
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }
  handleHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }
  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error!}
            reset={this.handleReset}
          />
        )
      }
      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-center text-gray-900">
              문제가 발생했습니다
            </h1>
            <p className="mt-2 text-sm text-center text-gray-600">
              예기치 않은 오류가 발생했습니다. 불편을 드려 죄송합니다.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-medium">
                  개발자 정보
                </summary>
                <pre className="mt-2 overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="mt-6 flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
              >
                <RefreshCw size={16} />
                다시 시도
              </button>
              <button
                onClick={this.handleHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                <Home size={16} />
                홈으로
              </button>
            </div>
            {this.state.errorCount > 2 && (
              <p className="mt-4 text-xs text-center text-red-600">
                오류가 반복되고 있습니다. 고객센터로 문의해주세요.
              </p>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
export default ErrorBoundary
