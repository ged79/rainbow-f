interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  shouldRetry?: (error: any, attempt: number) => boolean
  onRetry?: (error: any, attempt: number) => void
}
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    shouldRetry = () => true,
    onRetry = () => {}
  } = options
  let lastError: any
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      // Check if we should retry
      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error
      }
      // Call onRetry callback
      onRetry(error, attempt)
      // Calculate delay
      const waitTime = backoff === 'exponential' 
        ? delay * Math.pow(2, attempt - 1)
        : delay * attempt
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  throw lastError
}
// Network-aware retry
export async function withNetworkRetry<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'shouldRetry'> = {}
): Promise<T> {
  return withRetry(fn, {
    ...options,
    shouldRetry: (error) => {
      // Retry on network errors
      if (error.code === 'NETWORK_ERROR') return true
      if (error.message?.includes('fetch')) return true
      if (error.message?.includes('Network')) return true
      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) return false
      // Retry on server errors (5xx)
      if (error.status >= 500) return true
      return true
    }
  })
}
// Usage example:
/*
const data = await withRetry(
  async () => {
    const response = await fetch('/api/orders')
    if (!response.ok) throw new Error('Failed')
    return response.json()
  },
  {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    onRetry: (error, attempt) => {
    }
  }
)
*/
