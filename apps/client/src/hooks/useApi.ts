import { useState, useCallback } from 'react'
import { showToast } from '@/lib/toast'
interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
  errorMessage?: string
}
export function useApi<T = any>(
  apiCall: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const execute = useCallback(async (...args: any[]) => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await apiCall(...args)
      setData(result)
      if (options.onSuccess) {
        options.onSuccess(result)
      }
      if (options.showSuccessToast !== false && options.successMessage) {
        showToast.success(options.successMessage)
      }
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      if (options.onError) {
        options.onError(error)
      }
      if (options.showErrorToast !== false) {
        const message = options.errorMessage || error.message || '오류가 발생했습니다'
        showToast.error(message)
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [apiCall, options])
  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])
  return {
    data,
    error,
    isLoading,
    execute,
    reset
  }
}
// Usage example:
/*
const { execute, isLoading } = useApi(
  async (orderId: string) => {
    const response = await fetch(`/api/orders/${orderId}`)
    if (!response.ok) throw new Error('Failed to fetch order')
    return response.json()
  },
  {
    onSuccess: (data) => ,
    successMessage: '주문을 불러왔습니다',
    errorMessage: '주문을 불러오는데 실패했습니다'
  }
)
// Call it
await execute('order-123')
*/
