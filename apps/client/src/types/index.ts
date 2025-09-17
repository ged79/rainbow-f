/**
 * Global type definitions and re-exports
 */

// Re-export all types from shared package for convenience
export * from '@flower/shared/types'
export * from '@flower/shared/constants'

// Component Props types
export interface LayoutProps {
  children: React.ReactNode
}

export interface PageProps {
  params: { [key: string]: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Form types
export interface FormState {
  isSubmitting: boolean
  isValid: boolean
  errors: Record<string, string>
}

// UI State types  
export interface LoadingState {
  isLoading: boolean
  error: Error | null
  retry: () => void
}

// Re-export utility functions from shared
export { formatCurrency, formatDate, formatPhone } from '@flower/shared/utils'
