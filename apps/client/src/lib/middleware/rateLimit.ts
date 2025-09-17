// Rate limiting middleware for API routes
// apps/client/src/lib/middleware/rateLimit.ts

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (for production, use Redis)
const rateLimitStore: RateLimitStore = {}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  requests: number  // Number of requests
  window: number   // Time window in seconds
}

export function rateLimit(config: RateLimitConfig = { requests: 100, window: 60 }) {
  return async function middleware(request: NextRequest) {
    // Get client identifier (IP or user ID)
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const key = `${request.nextUrl.pathname}:${ip}`
    const now = Date.now()
    const resetTime = now + (config.window * 1000)
    
    // Get or create rate limit entry
    if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
      rateLimitStore[key] = {
        count: 1,
        resetTime
      }
    } else {
      rateLimitStore[key].count++
    }
    
    // Check if limit exceeded
    if (rateLimitStore[key].count > config.requests) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          retryAfter: Math.ceil((rateLimitStore[key].resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitStore[key].resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitStore[key].resetTime - now) / 1000).toString()
          }
        }
      )
    }
    
    // Add rate limit headers to response
    const remaining = config.requests - rateLimitStore[key].count
    
    return {
      headers: {
        'X-RateLimit-Limit': config.requests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': rateLimitStore[key].resetTime.toString()
      }
    }
  }
}

// Preset configurations
export const rateLimits = {
  strict: { requests: 10, window: 60 },      // 10 req/min
  standard: { requests: 100, window: 60 },   // 100 req/min
  relaxed: { requests: 500, window: 60 },    // 500 req/min
  auth: { requests: 5, window: 300 },        // 5 req/5min for auth
  order: { requests: 30, window: 60 }        // 30 req/min for orders
}