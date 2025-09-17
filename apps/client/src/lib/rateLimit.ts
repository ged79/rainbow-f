const requestCounts = new Map<string, number[]>()
const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 60

export async function checkRateLimit(identifier: string): Promise<boolean> {
  const now = Date.now()
  const windowStart = now - WINDOW_MS
  
  const timestamps = requestCounts.get(identifier) || []
  const recentTimestamps = timestamps.filter(ts => ts > windowStart)
  
  if (recentTimestamps.length >= MAX_REQUESTS) {
    return false
  }
  
  recentTimestamps.push(now)
  requestCounts.set(identifier, recentTimestamps)
  
  if (Math.random() < 0.01) {
    for (const [key, value] of requestCounts.entries()) {
      if (value.every(ts => ts < windowStart)) {
        requestCounts.delete(key)
      }
    }
  }
  
  return true
}
