/**
 * Enhanced API Service with proper error handling and logging
 */

import type { 
  Order,
  OrderWithStores,
  Store, 
  PointTransaction, 
  Settlement, 
  OrderStatus, 
  CreateOrderInput 
} from '@flower/shared/types'
import { logger } from './logger'

interface ApiError extends Error {
  code?: string
  status?: number
  details?: any
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class ApiService {
  private baseUrl = '/api'
  private maxRetries = 3
  private retryDelay = 1000
  private timeout = 30000 // 30 seconds

  private async request<T>(
    path: string,
    options: RequestInit = {},
    retries = 0
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    
    try {
      logger.debug(`API Request: ${options.method || 'GET'} ${path}`)
      
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      // Handle response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        
        const error: ApiError = new Error(errorData.error || `HTTP ${response.status}`)
        error.status = response.status
        error.code = errorData.code
        error.details = errorData
        
        // Log error
        logger.error(`API Error: ${path}`, error, {
          status: response.status,
          method: options.method || 'GET'
        })
        
        throw error
      }

      const data = await response.json()
      logger.debug(`API Success: ${path}`, { 
        method: options.method || 'GET',
        hasData: !!data 
      })
      
      return data
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      // Handle timeout
      if (error.name === 'AbortError') {
        logger.error(`API Timeout: ${path}`, error)
        const timeoutError: ApiError = new Error('Request timeout')
        timeoutError.code = 'TIMEOUT'
        timeoutError.status = 408
        throw timeoutError
      }
      
      // Retry logic
      if (retries < this.maxRetries && this.shouldRetry(error)) {
        const delay = this.retryDelay * Math.pow(2, retries)
        logger.warn(`Retrying API request: ${path}`, { 
          retry: retries + 1, 
          delay 
        })
        
        await this.wait(delay)
        return this.request<T>(path, options, retries + 1)
      }
      
      // Final failure
      logger.error(`API request failed: ${path}`, error, {
        retries,
        final: true
      })
      
      throw error
    }
  }

  private shouldRetry(error: ApiError): boolean {
    // Don't retry client errors (4xx)
    if (error.status && error.status >= 400 && error.status < 500) {
      return false
    }
    
    // Retry server errors and network errors
    return true
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Orders
  async getOrders(params?: {
    type?: 'sent' | 'received'
    status?: OrderStatus
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<OrderWithStores>> {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.set('type', params.type)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    
    return this.request<PaginatedResponse<OrderWithStores>>(
      `/orders?${searchParams.toString()}`
    )
  }

  async createOrder(data: CreateOrderInput): Promise<{ data: Order }> {
    logger.info('Creating order', { 
      customer: data.customer_name,
      product: data.product_name 
    })
    
    return this.request<{ data: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateOrderStatus(
    id: string, 
    status: OrderStatus
  ): Promise<{ data: OrderWithStores }> {
    logger.info('Updating order status', { orderId: id, status })
    
    return this.request<{ data: OrderWithStores }>(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async completeOrder(data: {
    orderId: string
    recipient_name: string  
    note: string
    photos: File[]
  }): Promise<{ data: OrderWithStores }> {
    logger.info('Completing order', { 
      orderId: data.orderId, 
      photoCount: data.photos.length 
    })
    
    const formData = new FormData()
    formData.append('recipient_name', data.recipient_name)
    formData.append('note', data.note)
    
    data.photos.forEach((photo) => {
      formData.append('photos', photo)
    })
    
    const response = await fetch(`${this.baseUrl}/orders/${data.orderId}/complete`, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json()
      logger.error('Order completion failed', error)
      throw new Error(error.error || 'Request failed')
    }
    
    const result = await response.json()
    logger.info('Order completed successfully', { orderId: data.orderId })
    return result
  }

  async getOrder(id: string): Promise<{ data: OrderWithStores }> {
    return this.request<{ data: OrderWithStores }>(`/orders/${id}`)
  }

  async updateOrder(
    id: string, 
    data: Partial<Order>
  ): Promise<{ data: OrderWithStores }> {
    logger.info('Updating order', { orderId: id })
    
    return this.request<{ data: OrderWithStores }>(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Stores
  async searchStores(
    sido: string, 
    sigungu?: string
  ): Promise<{ data: Store[] }> {
    const params = new URLSearchParams({ sido })
    if (sigungu) params.set('sigungu', sigungu)
    
    return this.request<{ data: Store[] }>(
      `/stores/search?${params.toString()}`
    )
  }

  // Points
  async getPoints(): Promise<{ 
    balance: number
    transactions: PointTransaction[] 
  }> {
    return this.request<{ 
      balance: number
      transactions: PointTransaction[] 
    }>('/points')
  }

  async chargePoints(amount: number): Promise<{ data: PointTransaction }> {
    logger.info('Charging points', { amount })
    
    return this.request<{ data: PointTransaction }>('/points', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  }

  async completeOrderWithDetails(id: string, completionData: {
    recipient_name: string
    recipient_phone?: string
    photos?: string[]
    photo_urls?: string[]
    note: string
  }): Promise<{ data: OrderWithStores }> {
    logger.info('Completing order with details', { orderId: id })
    
    return this.request<{ data: OrderWithStores }>(`/orders/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(completionData),
    })
  }

  // Settlements
  async getSettlements(): Promise<{ data: Settlement[] }> {
    return this.request<{ data: Settlement[] }>('/settlements')
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Export types
export type { PaginatedResponse, ApiError }
