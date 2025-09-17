/**
 * Request Deduplication Hook
 * Prevents duplicate API calls
 */

import { useRef, useCallback } from 'react'

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

export function useRequestDedup(cacheTime = 1000) {
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map())

  const dedupedRequest = useCallback(async <T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> => {
    const now = Date.now()
    const pending = pendingRequests.current.get(key)

    // Return existing promise if still valid
    if (pending && now - pending.timestamp < cacheTime) {
      return pending.promise
    }

    // Create new request
    const promise = requestFn()
    pendingRequests.current.set(key, { promise, timestamp: now })

    // Clean up after completion
    promise.finally(() => {
      setTimeout(() => {
        const current = pendingRequests.current.get(key)
        if (current && current.timestamp === now) {
          pendingRequests.current.delete(key)
        }
      }, cacheTime)
    })

    return promise
  }, [cacheTime])

  return dedupedRequest
}

// Usage example in component:
/*
const dedupRequest = useRequestDedup()

const fetchOrders = async () => {
  return dedupRequest('orders-list', () => 
    apiService.getOrders({ type: 'sent' })
  )
}
*/
