# 토스페이먼츠 Homepage 결제 연동 상세 조사
작성일: 2025-10-27
대상: apps/homepage

---

## 📊 현재 상태

### 1. 설치 상태 ✅
```json
"@tosspayments/payment-widget-sdk": "^0.12.0"
```

### 2. 환경변수 ✅
```env
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_yL0qZ4G1VOdm2dzkPzqoroWb2MQY
TOSS_SECRET_KEY=test_sk_LIDJaYngroGMjLY7xjEKrezGdRpX
```

### 3. 결제 플로우 구조

```
[order/page.tsx] 
  ↓ 주문완료 버튼
[PaymentModal.tsx]
  ↓ 결제하기
POST /api/payment/request (⚠️ MOCK)
  ↓ 
토스 결제창 (현재 안 열림)
  ↓
/payment/success
  ↓
POST /api/payment/confirm (✅ 구현완료)
  ↓
POST /api/orders (✅ 구현완료)
```

---

## 🔴 Critical Issues

### Issue #1: `/api/payment/request` MOCK 상태

**파일:** `src/app/api/payment/request/route.ts`

**현재 코드:**
```typescript
const response = await fetch('https://api.tosspayments.com/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount,
    orderId,
    orderName,
    // ... 
  }),
})
```

**문제:**
1. 토스페이먼츠 일반 결제 API `/v1/payments` 엔드포인트는 존재하지 않음
2. 올바른 토스 결제 SDK 사용하지 않음
3. 심사 미승인 상태

**토스페이먼츠 실제 플로우:**
```
프론트: loadPaymentWidget() → paymentWidget.requestPayment()
  ↓ (토스 결제창)
백엔드: POST /v1/payments/confirm (승인 API)
```

### Issue #2: `toss.ts` amount 파라미터 누락

**파일:** `src/lib/payment/toss.ts`

```typescript
export const requestTossPayment = async (paymentData: TossPaymentRequest) => {
  const paymentWidget = await loadPaymentWidget(clientKey, paymentData.customerMobilePhone || 'ANONYMOUS')
  
  await paymentWidget.requestPayment({
    orderId: paymentData.orderId,
    orderName: paymentData.orderName,
    // ❌ amount 누락!
    successUrl: paymentData.successUrl,
    failUrl: paymentData.failUrl,
    customerName: paymentData.customerName,
    customerMobilePhone: paymentData.customerMobilePhone,
  })
}
```

**수정 필요:**
```typescript
await paymentWidget.requestPayment({
  amount: paymentData.amount,  // ← 추가 필수
  orderId: paymentData.orderId,
  orderName: paymentData.orderName,
  successUrl: paymentData.successUrl,
  failUrl: paymentData.failUrl,
  customerName: paymentData.customerName,
  customerMobilePhone: paymentData.customerMobilePhone,
})
```

### Issue #3: `PaymentModal.tsx` 잘못된 API 사용

**파일:** `src/components/PaymentModal.tsx`

```typescript
// 2. 결제 요청 API 호출
const paymentResponse = await fetch('/api/payment/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: totalAmount,
    orderId: orderId,
    orderName: orderName,
    // ...
  }),
})

// 3. 결제 페이지로 리다이렉트
if (paymentResult.checkoutUrl) {
  window.location.href = paymentResult.checkoutUrl
}
```

**문제:**
1. `/api/payment/request`는 서버 API인데 브라우저 리다이렉트 시도
2. 토스 SDK를 클라이언트에서 직접 호출해야 함

**올바른 방식:**
```typescript
import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk'

const paymentWidget = await loadPaymentWidget(
  process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
  'ANONYMOUS'
)

await paymentWidget.renderPaymentMethods('#payment-widget', totalAmount)
await paymentWidget.requestPayment({
  orderId,
  orderName,
  successUrl: window.location.origin + '/payment/success',
  failUrl: window.location.origin + '/payment/fail',
})
```

### Issue #4: 주문-결제 원자성 없음

**문제 시나리오:**
```
1. 사용자: 결제 시작 → localStorage에 pendingOrder 저장
2. 토스 결제창: 결제 취소/닫기
3. 결과: pendingOrder 남아있음 (DB 기록 없음, 메모리만)
```

**리스크:**
- 사용자가 다시 결제 시도하면 중복 주문 가능
- 결제 실패 추적 불가

**해결 방안:**
```
결제 전: DB에 임시 주문 생성 (status: 'pending')
결제 성공: 주문 status 'paid'로 업데이트
결제 실패: 주문 status 'cancelled'로 업데이트 또는 삭제
```

### Issue #5: 금액 검증 취약점

**현재:** 클라이언트가 보낸 `amount` 그대로 신뢰

**공격 시나리오:**
```javascript
// 악의적 사용자가 브라우저 콘솔에서:
fetch('/api/payment/confirm', {
  method: 'POST',
  body: JSON.stringify({
    paymentKey: 'hack_key',
    orderId: 'real_order',
    amount: 100  // 실제는 50000원인데 100원으로 조작
  })
})
```

**수정 필요:** `payment/confirm/route.ts`에 금액 검증 추가
```typescript
// DB에서 실제 주문 금액 조회
const { data: order } = await supabaseAdmin
  .from('customer_orders')
  .select('total_amount')
  .eq('order_number', orderId)
  .single()

if (!order || order.total_amount !== amount) {
  return NextResponse.json({ 
    error: '주문 금액 불일치' 
  }, { status: 400 })
}
```

---

## ⚠️ 보안 이슈

### 1. Rate Limiting ✅ (구현됨)
```typescript
const rateLimitKey = `payment-request:${clientIp}`
if (!(await checkRateLimit(rateLimitKey))) {
  return NextResponse.json({ error: '요청이 너무 많습니다' }, { status: 429 })
}
```

### 2. API Key 관리 ✅
- `TOSS_SECRET_KEY`는 서버 전용
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`는 클라이언트 노출 OK

### 3. 금액 검증 ❌ (미구현)
- 위 Issue #5 참조

### 4. PII 노출 위험 ⚠️
**코드:** `order/page.tsx`
```typescript
localStorage.setItem('pendingOrder', JSON.stringify({
  customer_phone: '010-1234-5678',
  customer_name: '홍길동',
  // ... 민감정보
}))
```

**리스크:**
- localStorage는 평문 저장
- XSS 공격 시 민감정보 탈취 가능

**권장:**
```typescript
// sessionStorage 사용 (탭 닫으면 삭제)
sessionStorage.setItem('pendingOrder', JSON.stringify({
  orderId,  // ID만 저장
}))

// 실제 데이터는 서버 세션에 저장
```

---

## 🔧 수정 우선순위

### 즉시 (보안/버그)
1. **toss.ts amount 파라미터 추가** (5분)
2. **PaymentModal SDK 직접 호출로 변경** (30분)
3. **금액 검증 로직 추가** (15분)
4. **주문 상태 업데이트 로직 추가** (20분)

### 심사 승인 후
5. **`/api/payment/request` 제거** (불필요한 API)
6. **상용 키로 교체** (5분)
7. **프로덕션 테스트** (1시간)

---

## 💡 올바른 토스 결제 플로우

### Frontend (PaymentModal.tsx)
```typescript
import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk'

const handlePayment = async () => {
  try {
    const paymentWidget = await loadPaymentWidget(
      process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
      customerPhone
    )

    // 결제 위젯 렌더링
    await paymentWidget.renderPaymentMethods(
      '#payment-widget',
      totalAmount
    )

    // 결제 요청
    await paymentWidget.requestPayment({
      orderId: `ORD-${Date.now()}`,
      orderName: productName,
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    })
  } catch (error) {
    console.error('결제 오류:', error)
  }
}
```

### Backend (/api/payment/confirm/route.ts) ✅ 이미 구현됨
```typescript
// 토스에서 리다이렉트되어 온 결제 승인
const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ paymentKey, orderId, amount }),
})
```

---

## 📋 테스트 체크리스트

### 테스트 환경
- [ ] 테스트 카드번호: 4000-0000-0000-0008
- [ ] 유효기간: 12/28, CVC: 123

### 시나리오
- [ ] 정상 결제 (카드)
- [ ] 정상 결제 (계좌이체)
- [ ] 결제 취소 (중간에 닫기)
- [ ] 결제 실패 (잘못된 카드)
- [ ] 금액 조작 시도 (보안 테스트)
- [ ] 포인트 사용 결제
- [ ] 추천인 적립 결제

---

## 🚨 현재 상태 요약

| 항목 | 상태 | 심각도 |
|------|------|--------|
| 토스 SDK 설치 | ✅ 완료 | - |
| 환경변수 설정 | ✅ 완료 | - |
| toss.ts amount 누락 | ❌ 버그 | HIGH |
| PaymentModal 잘못된 구조 | ❌ 버그 | CRITICAL |
| /api/payment/request | ❌ MOCK | CRITICAL |
| 금액 검증 | ❌ 없음 | HIGH |
| 주문 상태 업데이트 | ❌ 없음 | HIGH |
| PII localStorage | ⚠️ 위험 | MEDIUM |
| Rate Limiting | ✅ 완료 | - |

---

## 다음 단계

1. **즉시 수정 (1-2시간)**
   - toss.ts amount 파라미터 추가
   - PaymentModal 토스 SDK 직접 호출
   - 금액 검증 로직 추가
   - 주문 상태 업데이트

2. **토스페이먼츠 심사 확인**
   - 현재 심사 상태 확인 필요
   - 승인까지 3-5일 소요

3. **심사 승인 후 (30분)**
   - 상용 키로 교체
   - `/api/payment/request` 제거
   - 프로덕션 배포

---

작성자: Claude  
토큰: 66K/190K (35%)
