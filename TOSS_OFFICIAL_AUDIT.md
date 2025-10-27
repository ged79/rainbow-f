# 토스페이먼츠 공식 문서 기반 Homepage 결제 감사
작성일: 2025-10-27
출처: 토스페이먼츠 공식 개발자센터

---

## 공식 문서 확인 결과

### 1. 결제위젯 SDK 올바른 사용법

**공식 플로우:**
```typescript
// 1. SDK 로드
import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk'

// 2. 위젯 초기화
const paymentWidget = await loadPaymentWidget(clientKey, customerKey)

// 3. 결제 금액 설정 (필수!)
await paymentWidget.setAmount({
  currency: "KRW",
  value: 50000
})

// 4. 결제 UI 렌더링
await paymentWidget.renderPaymentMethods('#payment-widget', { value: 50000 })

// 5. 약관 UI 렌더링
await paymentWidget.renderAgreement('#agreement')

// 6. 결제 요청
await paymentWidget.requestPayment({
  orderId: "ORDER123",
  orderName: "꽃다발",
  successUrl: "https://example.com/success",
  failUrl: "https://example.com/fail"
})
```

**주의사항 (공식 문서):**
- `amount`는 `renderPaymentMethods()`에서 설정
- `requestPayment()`에는 amount 없음!

---

## 현재 코드 검증

### ❌ Issue #1: toss.ts 구조 완전 오류

**현재 코드:**
```typescript
export const requestTossPayment = async (paymentData: TossPaymentRequest) => {
  const paymentWidget = await loadPaymentWidget(clientKey, customerKey)
  
  await paymentWidget.requestPayment({
    orderId: paymentData.orderId,
    orderName: paymentData.orderName,
    // ❌ amount 없음
    successUrl: paymentData.successUrl,
    failUrl: paymentData.failUrl,
  })
}
```

**문제:**
1. `renderPaymentMethods()` 호출 없음 (필수!)
2. `renderAgreement()` 호출 없음
3. `setAmount()` 호출 없음
4. UI 렌더링 없이 바로 `requestPayment()` 호출 → 실패

**올바른 코드:**
```typescript
export const initPaymentWidget = async (
  clientKey: string,
  customerKey: string,
  amount: number
) => {
  const paymentWidget = await loadPaymentWidget(clientKey, customerKey)
  
  // 필수: 결제 UI 렌더링
  await paymentWidget.renderPaymentMethods('#payment-widget', { value: amount })
  
  // 선택: 약관 UI
  await paymentWidget.renderAgreement('#agreement')
  
  return paymentWidget
}

export const requestTossPayment = async (
  paymentWidget: any,
  paymentData: TossPaymentRequest
) => {
  await paymentWidget.requestPayment({
    orderId: paymentData.orderId,
    orderName: paymentData.orderName,
    successUrl: paymentData.successUrl,
    failUrl: paymentData.failUrl,
  })
}
```

---

### ❌ Issue #2: PaymentModal 구조 오류

**현재 코드:**
```typescript
const paymentResponse = await fetch('/api/payment/request', {
  method: 'POST',
  body: JSON.stringify({ amount, orderId, ... })
})

if (paymentResult.checkoutUrl) {
  window.location.href = paymentResult.checkoutUrl
}
```

**문제:**
1. `/api/payment/request` 엔드포인트 불필요
2. 토스 결제위젯은 클라이언트에서 직접 렌더링
3. `checkoutUrl` 리다이렉트 방식 아님

**올바른 구조:**
```typescript
'use client'
import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk'
import { useEffect, useState, useRef } from 'react'

export default function PaymentModal({ amount, orderId, orderName }) {
  const [paymentWidget, setPaymentWidget] = useState(null)
  const paymentMethodRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      const widget = await loadPaymentWidget(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
        'GUEST_CUSTOMER'
      )
      
      // UI 렌더링
      await widget.renderPaymentMethods('#payment-widget', { value: amount })
      await widget.renderAgreement('#agreement')
      
      setPaymentWidget(widget)
    }
    init()
  }, [amount])

  const handlePayment = async () => {
    if (!paymentWidget) return
    
    try {
      await paymentWidget.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (error) {
      console.error('Payment error:', error)
    }
  }

  return (
    <div>
      <div id="payment-widget"></div>
      <div id="agreement"></div>
      <button onClick={handlePayment}>결제하기</button>
    </div>
  )
}
```

---

### ❌ Issue #3: /api/payment/request 존재 자체가 오류

**현재 코드:**
```typescript
// route.ts
const response = await fetch('https://api.tosspayments.com/v1/payments', {
  ...
})
```

**문제:**
1. `/v1/payments` 엔드포인트 존재 안 함
2. 결제위젯은 클라이언트 SDK만 사용
3. 서버는 `/v1/payments/confirm`만 호출

**해결:**
- `/api/payment/request` 파일 완전 삭제
- 클라이언트에서 SDK 직접 사용

---

### ✅ Issue #4: /api/payment/confirm은 정상

**현재 코드:**
```typescript
const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(SECRET_KEY + ':').toString('base64')}`,
  },
  body: JSON.stringify({ paymentKey, orderId, amount }),
})
```

**검증:** ✅ 공식 문서와 일치

---

## 수정 우선순위

### CRITICAL (즉시)

1. **PaymentModal 전면 재작성** (1시간)
   - 토스 SDK 클라이언트에서 직접 호출
   - `renderPaymentMethods()` + `renderAgreement()` 추가
   - `/api/payment/request` 호출 제거

2. **toss.ts 삭제** (5분)
   - 현재 구조는 사용 불가
   - PaymentModal에서 직접 SDK 사용

3. **/api/payment/request 삭제** (5분)
   - 존재 불필요

### HIGH (심사 승인 후)

4. **상용 키 교체** (5분)
5. **프로덕션 테스트** (30분)

---

## 올바른 전체 플로우

```
[주문 페이지]
  ↓ 주문 완료
[PaymentModal 열림]
  ↓ useEffect
loadPaymentWidget() → renderPaymentMethods() → renderAgreement()
  ↓ 사용자 결제하기 클릭
paymentWidget.requestPayment()
  ↓ 토스 결제창
[사용자 카드 입력]
  ↓ 성공
/payment/success?paymentKey=xxx&orderId=xxx&amount=xxx
  ↓
POST /api/payment/confirm (서버)
  ↓
POST /api/orders (주문 생성)
  ↓
[완료]
```

---

## 결론

**이전 조사의 오류:**
- `toss.ts`에 amount 파라미터만 추가하면 된다고 판단 ❌
- `/api/payment/request` 실제 구현 필요하다고 판단 ❌

**실제 문제:**
- 결제위젯 SDK 사용법 근본적으로 잘못됨
- 클라이언트-서버 역할 혼동
- 불필요한 API 엔드포인트 존재

**수정 범위:**
- PaymentModal.tsx 전면 재작성 필요
- toss.ts 삭제
- /api/payment/request 삭제
- 약 1-2시간 소요

---

토큰: 83K/190K (44%)
