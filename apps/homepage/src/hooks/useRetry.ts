import { useState, useEffect } from 'react'

interface UseRetryOptions {
  maxRetries?: number
  delay?: number
  onError?: (error: Error, attempt: number) => void
}

export function useRetry<T>(
  fn: () => Promise<T>,
  options: UseRetryOptions = {}
) {
  const { maxRetries = 3, delay = 1000, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const execute = async () => {
    setLoading(true)
    setError(null)
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await fn()
        setData(result)
        setLoading(false)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        
        if (i === maxRetries) {
          setError(error)
          setLoading(false)
          throw error
        }
        
        onError?.(error, i + 1)
        setAttempt(i + 1)
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  return { data, error, loading, attempt, retry: execute }
}