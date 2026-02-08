type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  storeId?: string
  orderId?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? JSON.stringify(context) : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`
  }
  
  private sendToMonitoring(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    // TODO: Integrate with monitoring service (Sentry, LogRocket, etc.)
    // Example:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureMessage(message, level)
    //   if (error) {
    //     window.Sentry.captureException(error, { extra: context })
    //   }
    // }
  }
  
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
    // console.debug(this.formatMessage('debug', message, context)) // REMOVED FOR PRODUCTION
    }
  }
  
  info(message: string, context?: LogContext) {
    // console.info(this.formatMessage('info', message, context))
    if (!this.isDevelopment) {
      this.sendToMonitoring('info', message, context)
    }
  }
  
  warn(message: string, context?: LogContext) {
    // console.warn(this.formatMessage('warn', message, context)) // REMOVED FOR PRODUCTION
    this.sendToMonitoring('warn', message, context)
  }
  
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    // console.error(this.formatMessage('error', message, context), errorObj) // REMOVED FOR PRODUCTION
    this.sendToMonitoring('error', message, context, errorObj)
  }
  
  // API specific logging
  apiError(endpoint: string, error: any, context?: LogContext) {
    this.error(`API Error: ${endpoint}`, error, {
      ...context,
      endpoint,
      statusCode: error.statusCode || error.status,
      errorCode: error.code,
    })
  }
  
  // Performance logging
  performance(operation: string, duration: number, context?: LogContext) {
    const message = `Performance: ${operation} took ${duration}ms`
    if (duration > 3000) {
      this.warn(message, { ...context, duration })
    } else if (this.isDevelopment) {
      this.debug(message, { ...context, duration })
    }
  }
  
  // Track user actions
  trackAction(action: string, context?: LogContext) {
    this.info(`User Action: ${action}`, context)
    // TODO: Send to analytics
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('event', action, context)
    // }
  }
}

export const logger = new Logger()

// Performance monitoring wrapper
export function measurePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>,
  context?: LogContext
): T | Promise<T> {
  const start = performance.now()
  
  try {
    const result = fn()
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start
        logger.performance(operation, duration, context)
      })
    }
    
    const duration = performance.now() - start
    logger.performance(operation, duration, context)
    return result
  } catch (error) {
    const duration = performance.now() - start
    logger.performance(operation, duration, { ...context, error: true })
    throw error
  }
}

// Usage examples:
/*
// Basic logging
logger.info('User logged in', { userId: 'user123' })
logger.error('Failed to load orders', error, { storeId: 'store456' })

// API error logging
logger.apiError('/api/orders', error, { userId: 'user123' })

// Performance monitoring
await measurePerformance(
  'loadDashboard',
  async () => {
    // Your async operation
  },
  { userId: 'user123' }
)

// Track user actions
logger.trackAction('order_created', { orderId: 'order789', amount: 50000 })
*/
