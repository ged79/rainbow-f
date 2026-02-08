# HOMEPAGE 결제 시스템 분석 리포트
작성일: 2025-10-20

---

## 📊 현재 결제 구조

### 통합 방식
- **PG사:** 토스페이먼츠 (Toss Payments)
- **SDK:** `@tosspayments/payment-widget-sdk`
- **결제 방식:** 위젯 방식 (리다이렉트)
- **상태:** ⚠️ **심사 승인 대기 중** (테스트 모드)

### 결제 플로우
```
[주문 페이지] 
    ↓ 
[결제하기 버튼]
    ↓
[PaymentModal - 결제 방법 선택]
    ↓
POST /api/payment/request (현재 Mock)
    ↓
[토스 결제창 리다이렉트]
    ↓
[결제 완료/실패]
    ↓
/payment/success or /payment/fail
    ↓
POST /api/payment/confirm (토스 API 호출)
    ↓
[주문 완료]
```

---

## 🔍 파일별 상세 분석

### 1. API Routes

#### `/api/payment/request/route.ts` ⚠️
**현재 상태:** Mock (실제 동작 안 함)
```typescript
return NextResponse.json({ 
  success: false,
  message: '토스페이먼츠 심사 승인 대기 중'
})
```

**문제점:**
- 실제 결제 요청 처리 안 함
- 토스 결제창 생성 안 됨
- 심사 승인 후에도 코드 수정 필요

**필요 작업:**
```typescript
// 심사 승인 후 구현 필요
const response = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    method,
    amount,
    orderId,
    orderName,
    customerName,
    customerMobilePhone,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    failUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail`,
  })
})
```

#### `/api/payment/confirm/route.ts` ✅
**상태:** 정상 구현됨
- Rate Limiting 적용 (10회/분)
- 토스 API 연동 완료
- 에러 처리 완료

**코드 품질:** 우수

---

### 2. Frontend Components

#### `PaymentModal.tsx` ⚠️
**기능:**
- 결제 방법 선택 UI (카드/계좌이체/가상계좌)
- 결제 금액 표시
- 할인 금액 표시

**문제점:**
1. **API 응답 처리 미완성**
```typescript
if (response.ok && result.checkout?.url) {
  window.location.href = result.checkout.url  // ❌ checkout 객체 없음
}
```

2. **에러 처리 불완전**
```typescript
setError(result.message || '결제 요청 실패')
// Mock 상태에서는 항상 에러 표시됨
```

3. **결제 취소/환불 처리 없음**

#### `payment/success/page.tsx` ✅
**기능:**
- 결제 완료 후 confirm API 호출
- 성공/실패 UI 표시
- 3초 후 홈으로 리다이렉트

**코드 품질:** 양호

#### `payment/fail/page.tsx` ✅
**기능:**
- 실패 메시지 표시
- 5초 후 홈으로 리다이렉트

**코드 품질:** 양호

---

### 3. 유틸리티

#### `lib/payment/toss.ts` ⚠️
**문제점:**
1. **Widget SDK 사용법 불완전**
```typescript
await paymentWidget.requestPayment({
  orderId: paymentData.orderId,
  orderName: paymentData.orderName,
  // ❌ amount 누락! (필수 파라미터)
  successUrl: paymentData.successUrl,
  failUrl: paymentData.failUrl,
})
```

2. **에러 처리 없음**
```typescript
// try-catch 없음
// 네트워크 에러, 토큰 만료 등 처리 불가
```

---

## 🚨 주요 이슈

### 1. 심사 승인 전 상태 (CRITICAL)
**현황:**
- 토스페이먼츠 가맹점 심사 대기 중
- 실제 결제 불가능
- Mock 응답만 반환

**필요 조치:**
1. 토스페이먼츠 가맹점 심사 신청 확인
2. 심사 승인 대기 (일반적으로 3-5일)
3. 승인 후 상용 키로 교체
4. `/api/payment/request` 실제 구현

**환경변수 체크:**
```env
# 현재 (테스트 키)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...

# 심사 승인 후 (상용 키로 교체 필요)
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_...
TOSS_SECRET_KEY=live_sk_...
```

### 2. 금액 누락 (HIGH)
**문제:**
```typescript
// toss.ts - amount 파라미터 없음!
await paymentWidget.requestPayment({
  orderId: ...,
  orderName: ...,
  // amount: ??? ← 이거 없음
})
```

**수정 필요:**
```typescript
await paymentWidget.requestPayment({
  orderId: paymentData.orderId,
  orderName: paymentData.orderName,
  amount: paymentData.amount,  // ← 추가
  successUrl: paymentData.successUrl,
  failUrl: paymentData.failUrl,
})
```

### 3. 주문-결제 연동 불완전 (HIGH)
**문제:**
- 주문 생성 후 결제 실패시 주문 롤백 로직 없음
- 결제 완료 후 주문 상태 업데이트 없음

**현재 플로우:**
```
POST /api/orders (주문 생성)
  → 성공 (DB에 pending 주문 생성됨)
    → 결제 시작
      → 결제 실패 ❌
        → 주문이 pending 상태로 남음 (문제!)
```

**올바른 플로우:**
```
POST /api/orders (주문 생성)
  → 결제 시작
    → 결제 성공 ✅
      → POST /api/payment/confirm
        → 주문 상태 'paid'로 업데이트
    → 결제 실패 ❌
      → 주문 상태 'cancelled'로 업데이트
```

### 4. 보안 이슈 (MEDIUM)

**API 키 노출 위험:**
```typescript
// ✅ 안전 (서버 사이드)
const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY  // Public 키 OK
const secretKey = process.env.TOSS_SECRET_KEY  // 환경변수 OK

// ⚠️ 주의
// TOSS_SECRET_KEY는 절대 클라이언트에 노출 금지
// API Route에서만 사용
```

**금액 변조 방지 부재:**
- 클라이언트에서 보낸 amount 그대로 신뢰
- 서버에서 재검증 필요

---

## 🔧 수정 필요 사항

### Phase 1: 즉시 수정 (보안/버그)

#### 1. `toss.ts` amount 파라미터 추가
```typescript
export const requestTossPayment = async (paymentData: TossPaymentRequest) => {
  const paymentWidget = await loadPaymentWidget(
    clientKey, 
    paymentData.customerMobilePhone || 'ANONYMOUS'
  )
  
  await paymentWidget.requestPayment({
    orderId: paymentData.orderId,
    orderName: paymentData.orderName,
    amount: paymentData.amount,  // ← 추가
    successUrl: paymentData.successUrl,
    failUrl: paymentData.failUrl,
    customerName: paymentData.customerName,
    customerMobilePhone: paymentData.customerMobilePhone,
  })
}
```

#### 2. `payment/confirm` 주문 상태 업데이트 추가
```typescript
// confirm/route.ts
if (!response.ok) {
  // 결제 실패시 주문 취소
  await supabaseAdmin
    .from('customer_orders')
    .update({ 
      status: 'payment_failed',
      payment_error: result.message 
    })
    .eq('order_number', orderId)
    
  return NextResponse.json({ error: result.message }, { status: response.status })
}

// 결제 성공시 주문 완료 처리
await supabaseAdmin
  .from('customer_orders')
  .update({ 
    status: 'paid',
    payment_key: paymentKey,
    paid_at: new Date().toISOString()
  })
  .eq('order_number', orderId)

return NextResponse.json({ success: true, payment: result })
```

#### 3. 금액 검증 추가
```typescript
// payment/confirm/route.ts
// 결제 금액 = 주문 금액 검증
const { data: order } = await supabaseAdmin
  .from('customer_orders')
  .select('total_amount')
  .eq('order_number', orderId)
  .single()

if (!order || order.total_amount !== amount) {
  return NextResponse.json({ 
    error: '주문 금액이 일치하지 않습니다' 
  }, { status: 400 })
}
```

---

### Phase 2: 심사 승인 후 작업

#### 1. `/api/payment/request` 실제 구현
```typescript
export async function POST(request: NextRequest) {
  try {
    const { method, amount, orderId, orderName, customerName, customerMobilePhone } = 
      await request.json()

    // 토스 빌링키 발급 (또는 위젯 방식에 따라 다름)
    const response = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerKey: customerMobilePhone,
        method,
        amount,
        orderId,
        orderName,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        failUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail`,
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      checkoutUrl: result.checkoutUrl 
    })
  } catch (error: any) {
    console.error('[Payment Request Error]', error)
    return NextResponse.json({ 
      error: '결제 요청 중 오류가 발생했습니다' 
    }, { status: 500 })
  }
}
```

#### 2. 환경변수 업데이트
```env
# .env.production
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_실제키
TOSS_SECRET_KEY=live_sk_실제키
NEXT_PUBLIC_APP_URL=https://rainbow-f.co.kr
```

---

### Phase 3: 추가 기능 (선택)

#### 1. 결제 취소/환불 API
```typescript
// /api/payment/cancel/route.ts
export async function POST(request: NextRequest) {
  const { paymentKey, cancelReason } = await request.json()
  
  const response = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancelReason })
  })
  
  // ...
}
```

#### 2. 부분 취소 지원
```typescript
// 포인트 사용분만 환불
body: JSON.stringify({ 
  cancelReason,
  cancelAmount: partialAmount  // 부분 환불 금액
})
```

#### 3. 결제 내역 조회
```typescript
// /api/payment/history/route.ts
export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId')
  
  const { data } = await supabaseAdmin
    .from('customer_orders')
    .select('payment_key, status, paid_at, total_amount')
    .eq('order_number', orderId)
    .single()
  
  return NextResponse.json({ payment: data })
}
```

---

## 📋 체크리스트

### 즉시 조치 (심사 전에도 가능)
- [ ] `toss.ts`에 amount 파라미터 추가
- [ ] `payment/confirm`에 주문 상태 업데이트 로직 추가
- [ ] 금액 검증 로직 추가
- [ ] 에러 처리 강화

### 심사 승인 후
- [ ] 토스페이먼츠 심사 상태 확인
- [ ] 상용 API 키 발급 받기
- [ ] 환경변수 업데이트 (.env.production)
- [ ] `/api/payment/request` 실제 구현
- [ ] PaymentModal 에러 처리 수정
- [ ] 프로덕션 테스트 (소액 결제)

### 운영 안정화
- [ ] 결제 실패 알림 (관리자)
- [ ] 결제 로그 대시보드
- [ ] 환불 프로세스 정립
- [ ] 고객 결제 문의 대응 매뉴얼

---

## 💰 비용 및 수수료

### 토스페이먼츠 수수료
- **신용카드:** 3.3% (일반)
- **계좌이체:** 1.0%
- **가상계좌:** 건당 300원

### 월 예상 비용 (주문 100건 기준)
```
신용카드 80건 × 평균 50,000원 × 3.3% = 132,000원
계좌이체 15건 × 평균 50,000원 × 1.0% = 7,500원
가상계좌 5건 × 300원 = 1,500원
----------------------------------------
합계: 141,000원/월
```

---

## 🚀 다음 단계

1. **즉시 수정 사항 적용** (30분)
   - amount 파라미터 추가
   - 주문 상태 업데이트 로직
   - 금액 검증

2. **토스페이먼츠 심사 확인** (외부 대기)
   - 심사 신청 여부 확인
   - 승인 예상 시기 확인

3. **심사 승인 후 통합 테스트** (1-2시간)
   - 상용 키로 교체
   - request API 실제 구현
   - 소액 결제 테스트

4. **프로덕션 배포** (30분)
   - 환경변수 설정
   - 배포 후 모니터링

**예상 총 소요 시간:** 2-3시간 (심사 대기 제외)

---

## ⚠️ 주의사항

1. **테스트 환경 필수**
   - 상용 전환 전 반드시 토스 테스트 환경에서 검증
   - 최소 10건 이상 테스트 결제 필요

2. **PG사 약관 준수**
   - 허위 거래 금지
   - 정확한 상품명 표시
   - 환불 정책 명시

3. **보안**
   - SECRET_KEY 절대 노출 금지
   - HTTPS 필수
   - 금액 변조 방지

4. **고객 CS 대비**
   - 결제 실패 문의 대응
   - 환불 프로세스
   - 영수증 발행

---

**작성자:** Claude  
**검토 필요:** 토스페이먼츠 심사 상태 확인 후 실제 구현
