# 결제 시스템 Double Check 리포트

## 🔍 현재 상황 분석

### ✅ 확인된 사항
1. **토스페이먼츠 테스트 키 존재**
   - CLIENT_KEY: `test_ck_yL0qZ4G1VOdm2dzkPzqoroWb2MQY`
   - SECRET_KEY: `test_sk_LlDJaYngroGMjLY7xjEKrezGdRpX`

2. **실제 결제 플로우**
```
[주문 페이지] order/page.tsx
  → handleOrder() - 주문 정보 입력
    → setShowPaymentModal(true)
      → PaymentModal 열림
        → /api/payment/request POST ❌ (Mock 응답)
          → 결제창 못 열림 ⚠️
```

---

## 🚨 문제 발견: 결제가 안 되는 이유

### 1. API Request가 Mock 상태
**파일:** `/api/payment/request/route.ts`
```typescript
export async function POST(request: NextRequest) {
  try {
    // ❌ 실제 토스 API 호출 없음
    return NextResponse.json({ 
      success: false,
      message: '토스페이먼츠 심사 승인 대기 중입니다.'
    })
  }
}
```

**결과:** 
- 결제 모달 열림 → 결제 방법 선택
- "결제하기" 클릭 → API 호출
- `success: false` 응답 → 에러 메시지 표시
- **결제창이 아예 안 열림**

### 2. PaymentModal이 잘못된 응답 기대
**파일:** `PaymentModal.tsx`
```typescript
const result = await response.json()

if (response.ok && result.checkout?.url) {
  // ❌ checkout 객체가 없음
  window.location.href = result.checkout.url
} else {
  setError(result.message)  // "심사 승인 대기 중" 표시
}
```

### 3. toss.ts 파일 미사용
**파일:** `lib/payment/toss.ts`
- `requestTossPayment` 함수 구현되어 있음
- **어디에서도 import 안 함** ❌
- **전혀 사용되지 않는 코드**

---

## 💡 해결 방법 (테스트 환경)

### Option 1: 토스 위젯 SDK 직접 사용 (추천)

#### 1-1. PaymentModal 수정
```typescript
// PaymentModal.tsx
'use client'

import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk'

const handlePayment = async () => {
  try {
    // 1. 먼저 주문 생성
    const orderRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...orderData,
        totalAmount: totalAmount,
        discountAmount: discountAmount || 0,
        items: [{
          productId: orderData.product_id,
          productName: orderData.product_name,
          price: orderData.product_price,
          quantity: orderData.product_quantity
        }]
      })
    })
    
    const { orderNumber, orderId } = await orderRes.json()
    
    // 2. 토스 결제 위젯 로드
    const paymentWidget = await loadPaymentWidget(
      process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
      orderData.customer_phone
    )
    
    // 3. 결제 UI 렌더링
    await paymentWidget.renderPaymentMethods({
      selector: '#payment-widget',
      variantKey: 'DEFAULT'
    })
    
    // 4. 약관 UI 렌더링  
    await paymentWidget.renderAgreement({
      selector: '#agreement'
    })
    
    // 5. 결제 요청
    await paymentWidget.requestPayment({
      orderId: orderNumber,
      orderName: orderData.product_name,
      amount: totalAmount,
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
      customerName: orderData.customer_name,
      customerMobilePhone: orderData.customer_phone
    })
    
  } catch (error) {
    setError('결제 처리 중 오류가 발생했습니다')
  }
}
```

#### 1-2. PaymentModal JSX 수정
```tsx
return (
  <div className="fixed inset-0 bg-black/50 z-50">
    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
      <h3 className="text-xl font-bold mb-4">결제하기</h3>
      
      {/* 결제 금액 */}
      <div className="mb-4">
        <p className="text-2xl font-bold">
          {totalAmount.toLocaleString()}원
        </p>
      </div>
      
      {/* 토스 결제 위젯 */}
      <div id="payment-widget" className="mb-4"></div>
      <div id="agreement" className="mb-4"></div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600">
          {error}
        </div>
      )}
      
      <div className="flex space-x-3">
        <button onClick={onClose}>취소</button>
        <button onClick={handlePayment}>결제하기</button>
      </div>
    </div>
  </div>
)
```

---

### Option 2: API Request 실제 구현 (서버 사이드)

#### 2-1. /api/payment/request 수정
```typescript
// /api/payment/request/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (!(await checkRateLimit(`payment-request:${clientIp}`))) {
    return NextResponse.json({ error: '요청이 너무 많습니다' }, { status: 429 })
  }
  
  try {
    const { amount, orderId, orderName, customerName, customerMobilePhone } = 
      await request.json()
    
    // 토스 빌링키 발급 API (또는 다른 결제 요청 방식)
    const response = await fetch('https://api.tosspayments.com/v1/brandpay/authorizations/access-token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerKey: customerMobilePhone,
        amount,
        orderId,
        orderName,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        failUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail`
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: result.message || '결제 요청 실패' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true,
      checkout: {
        url: result.checkoutUrl || result.approvalUrl
      }
    })
    
  } catch (error: any) {
    console.error('[Payment Request Error]', error)
    return NextResponse.json({ 
      error: '결제 요청 중 오류가 발생했습니다' 
    }, { status: 500 })
  }
}
```

---

## 📋 현재 문제 요약

| 항목 | 상태 | 문제 |
|------|------|------|
| 토스 테스트 키 | ✅ 있음 | - |
| API Request | ❌ Mock | 실제 토스 API 호출 안 함 |
| PaymentModal | ⚠️ 에러 | checkout.url 못 받음 |
| toss.ts | ❌ 미사용 | 구현됐지만 import 안 함 |
| 결제 위젯 SDK | ⚠️ 미적용 | 설치는 됐지만 사용 안 함 |

---

## 🎯 즉시 조치 사항

### Phase 1: 최소한의 수정으로 테스트 (30분)

**추천: Option 1 (위젯 방식)**

1. `PaymentModal.tsx` 수정
   - `loadPaymentWidget` import
   - `renderPaymentMethods` 호출
   - `requestPayment` 호출

2. 주문 플로우 수정
   - 결제 전 주문 생성
   - 결제 성공 후 상태 업데이트

3. 테스트
   - 토스 테스트 카드: `4111-1111-1111-1111`
   - 유효기간: 아무거나
   - CVC: 123

---

### Phase 2: 심사 승인 후 (상용 전환)

1. 환경변수 교체
```env
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_실제키
TOSS_SECRET_KEY=live_sk_실제키
```

2. `/api/payment/request` 실제 구현
3. 프로덕션 배포

---

## 🧪 테스트 시나리오

### 로컬 테스트 (지금 가능)
```bash
1. 주문 페이지 접속
2. 주문 정보 입력
3. "주문 완료" 클릭
4. PaymentModal 표시 확인
5. 결제 방법 선택
6. "결제하기" 클릭
7. 토스 결제창 열리는지 확인 ← 현재 안 열림!
```

### 예상 에러
```
현재 상태:
"토스페이먼츠 심사 승인 대기 중입니다"

수정 후:
토스 결제창 정상 표시 → 테스트 카드 입력 → 결제 완료
```

---

## 💬 다음 단계

**1. 어떤 방식으로 진행할까요?**
- Option 1: 위젯 SDK 직접 사용 (클라이언트 사이드) ← 추천
- Option 2: API Request 실제 구현 (서버 사이드)

**2. 즉시 수정 파일**
- `src/components/PaymentModal.tsx` (필수)
- `src/app/order/page.tsx` (주문 플로우 조정)

**3. 예상 소요 시간**
- 코드 수정: 30분
- 테스트: 10분

어떻게 진행할까요?
