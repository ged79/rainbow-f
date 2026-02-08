# HOMEPAGE 보안 Double Check 리포트
작성일: 2025-10-20  
대상: C:\work_station\flower\apps\homepage

---

## 🔐 보안 검증 결과 요약

### ✅ 완료된 보안 조치

#### 1. **인증/인가 시스템 (JWT)**
- ✅ JWT 토큰 기반 인증 구현
- ✅ Access Token + Refresh Token 이중 구조
- ✅ 토큰 만료 시간 설정 (24h / 7d)
- ✅ 세션 저장소 구현 (메모리 기반)
- ⚠️ **주의**: 프로덕션에서는 Redis로 전환 필요

```typescript
// jwt-auth.ts
const TOKEN_EXPIRY = '24h'
const REFRESH_TOKEN_EXPIRY = '7d'
```

#### 2. **Rate Limiting**
- ✅ IP 기반 요청 제한 구현
- ✅ 엔드포인트별 다른 제한 설정
- ✅ 429 응답 + Retry-After 헤더
- ✅ IP 차단 리스트 (영구/임시)

```typescript
// 설정된 Rate Limits
- 로그인: 5분에 5회
- 회원가입: 1시간에 3회
- SMS 발송: 1시간에 5회
- 일반 API: 1분에 60회
```

#### 3. **입력값 검증 (XSS/SQL Injection 방어)**
- ✅ HTML 특수문자 이스케이프
- ✅ SQL 위험 키워드 필터링
- ✅ 전화번호/이메일 형식 검증
- ✅ URL 파라미터 sanitization
- ✅ 민감정보 패턴 감지

#### 4. **암호화**
- ✅ 비밀번호 bcrypt 해싱
- ✅ 민감정보 AES-256-GCM 암호화
- ✅ 안전한 토큰 생성 (crypto.randomBytes)

#### 5. **HTTP 보안 헤더**
```typescript
// middleware.ts - 모든 요청에 적용
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

#### 6. **Supabase 보안**
- ✅ Service Role Key 환경변수 분리
- ✅ API 라우트에서만 Admin Client 사용
- ✅ 클라이언트는 Anon Key만 사용

---

## ⚠️ 발견된 보안 이슈 (우선순위별)

### 🔴 HIGH - 즉시 조치 필요

#### 1. **Rate Limiting 미적용**
**문제:**
```typescript
// src/app/api/orders/route.ts
export async function POST(request: NextRequest) {
  // Rate limiting 없음!
  try {
    const body = await request.json()
    // ...주문 생성
```

**영향:**
- 주문 API 스팸 공격 가능
- DDoS 취약
- 가짜 주문 대량 생성 가능

**해결 방법:**
```typescript
// 추가 필요
import { createRateLimiter, RATE_LIMITS } from '@/lib/security/rate-limit'

const orderRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: '주문 요청이 너무 많습니다'
})

export async function POST(request: NextRequest) {
  // Rate limit 체크
  const rateLimitResult = await orderRateLimit(request)
  if (rateLimitResult.status === 429) {
    return rateLimitResult
  }
  
  // 기존 로직...
}
```

#### 2. **주문 데이터 검증 부재**
**문제:**
```typescript
// 클라이언트가 보낸 가격을 그대로 신뢰
const totalAmount = body.totalAmount || body.total_amount || 0
const productInfo = body.items?.[0] || {}

// ❌ 가격 조작 가능!
// 사용자가 totalAmount: 1 로 보내도 검증 없음
```

**영향:**
- 가격 조작 (100만원 → 1원)
- 재고 없는 상품 주문
- 잘못된 배송 날짜 입력

**해결 방법:**
```typescript
// 서버에서 상품 가격 재확인
const { data: product } = await supabaseAdmin
  .from('products')
  .select('customer_price, is_active')
  .eq('id', productInfo.productId)
  .single()

if (!product || !product.is_active) {
  return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 })
}

const expectedTotal = product.customer_price * productInfo.quantity

if (Math.abs(expectedTotal - totalAmount) > 1) {
  return NextResponse.json({ error: '가격 정보가 일치하지 않습니다' }, { status: 400 })
}
```

#### 3. **CSRF 보호 없음**
**문제:**
- POST 요청에 CSRF 토큰 검증 없음
- 악의적인 사이트에서 사용자 대신 주문 가능

**해결 방법:**
```typescript
// CSRFProtection 클래스는 이미 구현되어 있음
import { CSRFProtection } from '@/lib/security/validation'

// 주문 페이지에서 토큰 발급
const csrfToken = CSRFProtection.generateToken(sessionId)

// API에서 검증
if (!CSRFProtection.validateToken(sessionId, body.csrfToken)) {
  return NextResponse.json({ error: 'Invalid request' }, { status: 403 })
}
```

---

### 🟡 MEDIUM - 빠른 시일 내 조치

#### 4. **환경변수 노출 위험**
**발견:**
```bash
# .env.local이 Git에 포함될 가능성
JWT_SECRET=rainbow-f-super-secret-jwt-key-change-this-2024
ENCRYPTION_KEY=rainbow-f-32char-encryption-key!
```

**조치:**
- ✅ `.gitignore`에 `.env.local` 포함 확인
- ⚠️ 프로덕션 환경변수 별도 관리 (Vercel Secrets)
- ⚠️ JWT_SECRET, ENCRYPTION_KEY 복잡한 값으로 변경

#### 5. **Session Store 메모리 기반**
**문제:**
- 서버 재시작시 모든 세션 손실
- 다중 서버 환경에서 세션 공유 불가

**권장:**
- Redis 또는 Supabase 테이블로 전환

#### 6. **에러 메시지에 민감정보 노출 가능**
```typescript
// 현재 코드
catch (error: any) {
  return NextResponse.json({ 
    error: '주문 처리 실패',
    details: error.message  // ⚠️ DB 에러가 그대로 노출될 수 있음
  }, { status: 500 })
}
```

**개선:**
```typescript
catch (error: any) {
  console.error('[Order Error]', error)  // 서버 로그에만 기록
  return NextResponse.json({ 
    error: '주문 처리 중 오류가 발생했습니다'
  }, { status: 500 })
}
```

---

### 🟢 LOW - 점진적 개선

#### 7. **로깅 및 모니터링 부재**
- 보안 이벤트 로깅 기능 있지만 미사용
- 실제 로깅 서비스 연동 필요 (Sentry, LogRocket)

#### 8. **HTTPS 강제 리다이렉트 없음**
- 프로덕션에서 HTTP → HTTPS 자동 리다이렉트 설정 필요

#### 9. **파일 업로드 검증 미사용**
- `validateFileUpload` 함수 구현되어 있지만 실제 사용 안 함
- 추후 이미지 업로드 기능 추가시 반드시 적용

---

## 📊 DB 테이블 사용 현황 분석

### 실제 사용 중인 테이블

#### 1. **customer_orders** (메인 주문 테이블)
```sql
-- 사용처: /api/orders (GET, POST)
-- 기능: 주문 생성, 조회, 리뷰 연결
customer_orders
├── order_number (고유 주문번호)
├── customer_name, customer_phone
├── recipient_name, recipient_phone, recipient_address
├── product_id, product_name, product_image
├── original_price, quantity, total_amount
├── delivery_date, delivery_time
├── ribbon_text (JSONB), special_instructions
├── status (pending, confirmed, delivered, etc.)
├── referrer_phone (추천인)
├── points_earned, discount_amount
└── created_at, updated_at
```

**Status:** ✅ **활발히 사용 중 - 핵심 테이블**

#### 2. **coupons** (포인트/쿠폰 테이블)
```sql
-- 사용처: /api/orders, /api/coupons
-- 기능: 적립금 관리, 추천인 보상
coupons
├── code (쿠폰 코드)
├── customer_phone (소유자)
├── amount (포인트 금액)
├── type (purchase, referral)
├── used_at (사용 시각)
├── order_id (연결된 주문)
└── expires_at (만료일)
```

**Status:** ✅ **활발히 사용 중 - 마케팅 핵심**

#### 3. **order_reviews** (주문 리뷰 테이블)
```sql
-- 사용처: /api/reviews
-- 기능: 고객 리뷰 관리
order_reviews
├── order_id (주문 연결)
├── rating (별점)
├── comment (리뷰 내용)
├── images (리뷰 이미지들)
└── created_at
```

**Status:** ✅ **사용 중**

#### 4. **products** (상품 마스터 테이블)
```sql
-- 사용처: productService.ts
-- 기능: 상품 조회, 카테고리별 필터링
products
├── id, display_name
├── customer_price, price (화원가)
├── original_price
├── category_1, category_2
├── image_url, image_left45, image_right45
├── description
├── is_active
└── sort_order
```

**Status:** ✅ **활발히 사용 중 - 상품 데이터**

---

### 미사용/중복 테이블 (정리 후보)

#### 🗑️ **orders** + **order_items** (schema.sql 정의)
```sql
-- schema.sql에만 존재, 실제 코드에서 미사용
CREATE TABLE orders (...)
CREATE TABLE order_items (...)
```

**Status:** ❌ **미사용 - 삭제 가능**

**이유:**
- 코드는 `customer_orders` 단일 테이블 사용
- `orders` + `order_items` 정규화 구조는 구현 안 됨
- 혼란만 초래

**조치 방안:**
```sql
-- Option 1: 미사용 테이블 삭제 (추천)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Option 2: 마이그레이션 (나중에 필요시)
-- customer_orders → orders + order_items로 데이터 이전
```

#### 🔍 **wishlists** (찜하기)
```sql
-- schema.sql 정의됨
CREATE TABLE wishlists (...)
```

**Status:** ⚠️ **사용 여부 확인 필요**
- 코드에서 localStorage 사용 중: `localStorage.getItem('wishlist')`
- DB 테이블은 있지만 API 없음

**권장:**
- localStorage → DB로 마이그레이션 (로그인 사용자용)
- 또는 테이블 삭제

---

## 🎯 DB 정리 우선순위 플랜

### Phase 1: 안전성 확인 (이번 주)
```bash
# 1. 실제 프로덕션 DB 접속
# 2. 테이블별 데이터 건수 확인
SELECT 
  'customer_orders' as table_name, COUNT(*) as count FROM customer_orders
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'wishlists', COUNT(*) FROM wishlists
UNION ALL
SELECT 'coupons', COUNT(*) FROM coupons;

# 3. 만약 orders/order_items에 데이터 있으면:
#    → 마이그레이션 스크립트 작성
# 4. 데이터 없으면:
#    → DROP TABLE 진행
```

### Phase 2: 백업 후 삭제 (다음 주)
```sql
-- 1. 백업 (만약을 위해)
CREATE TABLE _backup_orders AS SELECT * FROM orders;
CREATE TABLE _backup_order_items AS SELECT * FROM order_items;

-- 2. 제약조건 확인
SELECT * FROM information_schema.table_constraints 
WHERE table_name IN ('orders', 'order_items');

-- 3. 삭제
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
```

### Phase 3: 인덱스 최적화 (2주차)
```sql
-- customer_orders 인덱스 확인
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'customer_orders';

-- 필요시 추가 인덱스
CREATE INDEX idx_customer_orders_phone ON customer_orders(customer_phone);
CREATE INDEX idx_customer_orders_status ON customer_orders(status);
CREATE INDEX idx_customer_orders_delivery_date ON customer_orders(delivery_date);
```

---

## 🚀 즉시 적용 가능한 보안 패치

### 1. orders API Rate Limit 추가
```typescript
// src/app/api/orders/route.ts 상단에 추가
import { createRateLimiter, RATE_LIMITS } from '@/lib/security/rate-limit'

const orderRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: '주문 요청이 너무 많습니다'
})

export async function POST(request: NextRequest) {
  const limitCheck = await orderRateLimit(request)
  if (limitCheck.status === 429) return limitCheck
  
  // 기존 로직...
}
```

### 2. 주문 가격 검증 추가
```typescript
// POST 함수 내부, DB 저장 전
const { data: dbProduct } = await supabaseAdmin
  .from('products')
  .select('customer_price, is_active')
  .eq('id', productInfo.productId)
  .single()

if (!dbProduct?.is_active) {
  return NextResponse.json({ error: '상품이 존재하지 않습니다' }, { status: 404 })
}

const expectedPrice = dbProduct.customer_price * (productInfo.quantity || 1)
if (Math.abs(expectedPrice - totalAmount) > discountAmount) {
  return NextResponse.json({ error: '가격 정보가 일치하지 않습니다' }, { status: 400 })
}
```

### 3. 민감한 에러 메시지 제거
```typescript
// 모든 catch 블록 수정
catch (error: any) {
  console.error('[API Error]', error) // 로그는 서버에만
  return NextResponse.json({ 
    error: '처리 중 오류가 발생했습니다' 
  }, { status: 500 })
}
```

---

## 📋 체크리스트 (적용 여부 확인용)

### 즉시 조치 (이번 주 완료)
- [ ] orders API Rate Limiting 적용
- [ ] 주문 가격 서버 검증 추가
- [ ] 에러 메시지 sanitization
- [ ] DB 테이블 사용 현황 실제 확인
- [ ] .env.local Git 제외 확인

### 단기 조치 (2주 내)
- [ ] CSRF 토큰 구현 (주문 API)
- [ ] JWT_SECRET, ENCRYPTION_KEY 변경
- [ ] orders/order_items 테이블 정리
- [ ] wishlists 사용 여부 결정
- [ ] Sentry 같은 에러 모니터링 도입

### 중장기 조치 (1개월 내)
- [ ] Session Store Redis 전환
- [ ] 파일 업로드 기능 보안 검증
- [ ] HTTPS 강제 리다이렉트 설정
- [ ] 보안 이벤트 로깅 시스템 구축

---

## 💡 종합 의견

### 보안 상태: **B+ (양호)**

**잘된 점:**
- ✅ 기본적인 보안 인프라 구축됨 (JWT, Rate Limit, Validation)
- ✅ 코드 품질 높음 (TypeScript, 체계적 구조)
- ✅ Supabase 보안 설정 올바름

**개선 필요:**
- ⚠️ 보안 기능이 구현되어 있지만 **실제로 적용 안 됨**
- ⚠️ Rate Limiting이 주문 API에 없음
- ⚠️ 가격 검증 없어서 조작 가능

### DB 정리 접근법: **매우 합리적** ✅

> "사용하면서 사용되는 table만 인덱싱해서 추후 사용되지 않는 db는 정리"

**동의합니다. 이유:**
1. **안전성**: 프로덕션 시스템에 영향 없음
2. **점진적 개선**: 데이터 확인 후 결정
3. **위험 최소화**: 백업 → 확인 → 삭제 단계

**추천 순서:**
1. 현재 DB 데이터 건수 확인 (이게 가장 중요)
2. orders/order_items 테이블에 데이터 있는지 체크
3. 없으면 삭제, 있으면 마이그레이션 계획
4. customer_orders에 인덱스 추가 (성능 개선)

---

## 📞 다음 액션 아이템

1. **즉시**: 주문 API Rate Limit + 가격 검증 패치 적용
2. **금주 내**: 실제 DB 접속해서 테이블별 데이터 건수 확인
3. **다음 주**: 미사용 테이블 정리 or 마이그레이션

**준비된 작업:**
- [ ] Rate Limit 패치 코드 작성 필요하면 요청
- [ ] DB 정리 스크립트 작성 필요하면 요청
- [ ] Admin 시스템 보안 검토 준비됨
