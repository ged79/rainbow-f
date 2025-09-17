import { useState, useEffect } from 'react'
import { logger } from '@/services/logger'

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const execute = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await asyncFunction()
        if (!cancelled) {
          setData(result)
        }
      } catch (err: any) {
        logger.error('useAsync error', err)
        if (!cancelled) {
          setError(err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    execute()

    return () => {
      cancelled = true
    }
  }, deps)

  const retry = () => {
    const execute = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await asyncFunction()
        setData(result)
      } catch (err: any) {
        logger.error('useAsync retry error', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    execute()
  }

  return { data, loading, error, retry }
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      logger.error('useLocalStorage read error', error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      logger.error('useLocalStorage write error', error)
    }
  }

  return [storedValue, setValue] as const
}
