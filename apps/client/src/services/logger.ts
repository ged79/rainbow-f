/**
 * Enhanced Logging Service
 * Provides structured logging with different levels and remote logging capability
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  stack?: string
  userId?: string
  sessionId?: string
  environment: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logBuffer: LogEntry[] = []
  private maxBufferSize = 100
  private flushInterval = 30000 // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null

  constructor() {
    // Start flush timer
    if (!this.isDevelopment) {
      this.startFlushTimer()
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  private getSessionInfo() {
    // Get session info from localStorage if available
    try {
      const storage = localStorage.getItem('flower-app-storage')
      if (storage) {
        const data = JSON.parse(storage)
        return {
          userId: data.state?.session?.user?.id,
          sessionId: data.state?.session?.id
        }
      }
    } catch {
      // Ignore errors
    }
    return {}
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    const { userId, sessionId } = this.getSessionInfo()
    
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId,
      sessionId,
      environment: process.env.NODE_ENV || 'production',
      stack: level === 'error' || level === 'fatal' 
        ? new Error().stack 
        : undefined
    }
  }

  private log(entry: LogEntry) {
    // Console output in development
    if (this.isDevelopment) {
      const style = this.getConsoleStyle(entry.level)
      // Commenting out console.log for production build
      // console.log(
      //   `%c[${entry.level.toUpperCase()}]`,
      //   style,
      //   entry.message,
      //   entry.context || ''
      // )
      
      if (entry.stack) {
        // console.log(entry.stack)
      }
      return
    }

    // Add to buffer for production
    this.logBuffer.push(entry)
    
    // Flush if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush()
    }
    
    // Immediately flush critical errors
    if (entry.level === 'fatal') {
      this.flush()
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: 'color: gray',
      info: 'color: blue',
      warn: 'color: orange',
      error: 'color: red; font-weight: bold',
      fatal: 'color: white; background-color: red; font-weight: bold'
    }
    return styles[level]
  }

  private async flush() {
    if (this.logBuffer.length === 0) return
    
    const logsToSend = [...this.logBuffer]
    this.logBuffer = []
    
    try {
      // Send logs to server
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToSend })
      })
    } catch (error) {
      // If sending fails, add back to buffer (with limit)
      this.logBuffer = [
        ...logsToSend.slice(-50), // Keep only last 50
        ...this.logBuffer
      ]
    }
  }

  // Public methods
  debug(message: string, context?: Record<string, any>) {
    this.log(this.createLogEntry('debug', message, context))
  }

  info(message: string, context?: Record<string, any>) {
    this.log(this.createLogEntry('info', message, context))
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(this.createLogEntry('warn', message, context))
  }

  error(message: string, error?: Error | any, context?: Record<string, any>) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    }
    
    this.log(this.createLogEntry('error', message, errorContext))
  }

  fatal(message: string, error?: Error | any, context?: Record<string, any>) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    }
    
    this.log(this.createLogEntry('fatal', message, errorContext))
  }

  // Track performance
  time(label: string) {
    if (this.isDevelopment) {
      // console.time(label)
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment) {
      // console.timeEnd(label)
    }
  }

  // Cleanup
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flush()
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export for type usage
export type { LogLevel, LogEntry }