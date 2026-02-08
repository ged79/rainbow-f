#!/bin/bash
# Rate Limiting 구현 - 안전한 미들웨어 추가
# 영향도: LOW - 기존 로직 변경 없음

echo "📦 Rate Limiting 파일 생성 중..."

# 1. Rate limiter utility 생성
cat > apps/homepage/src/lib/rateLimit.ts << 'EOF'
// Simple in-memory rate limiter
// Production에서는 Redis 사용 권장

const requestCounts = new Map<string, number[]>()
const WINDOW_MS = 60 * 1000 // 1분
const MAX_REQUESTS = 60 // 분당 60회

export async function checkRateLimit(identifier: string): Promise<boolean> {
  const now = Date.now()
  const windowStart = now - WINDOW_MS
  
  // Get existing timestamps
  const timestamps = requestCounts.get(identifier) || []
  
  // Filter old timestamps
  const recentTimestamps = timestamps.filter(ts => ts > windowStart)
  
  // Check if limit exceeded
  if (recentTimestamps.length >= MAX_REQUESTS) {
    return false
  }
  
  // Add current timestamp
  recentTimestamps.push(now)
  requestCounts.set(identifier, recentTimestamps)
  
  // Cleanup old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    for (const [key, value] of requestCounts.entries()) {
      if (value.every(ts => ts < windowStart)) {
        requestCounts.delete(key)
      }
    }
  }
  
  return true
}
EOF

echo "✅ Rate limiter 생성 완료"

# 2. Middleware 업데이트 스크립트
cat > update_middleware.md << 'EOF'
# Middleware 수동 업데이트 가이드

## apps/homepage/src/middleware.ts 에 추가:

```typescript
import { checkRateLimit } from './lib/rateLimit'

// API routes rate limiting 추가
if (request.nextUrl.pathname.startsWith('/api/')) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const identifier = `api:${ip}`
  
  const allowed = await checkRateLimit(identifier)
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

## 테스트 방법:
1. 개발환경에서 API 60회 이상 호출
2. 429 에러 확인
3. 1분 후 정상 작동 확인
EOF

echo "📝 적용 가이드: update_middleware.md 확인"
echo "⚠️  기존 middleware.ts 백업 후 적용하세요"
