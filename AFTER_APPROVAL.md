# 토스페이먼츠 심사 승인 후 작업

## 1. 환경변수 교체
```env
# .env.local
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_실제키
TOSS_SECRET_KEY=live_sk_실제키
```

## 2. PaymentModal.tsx 복원
```typescript
// 현재: 테스트 모드 (주문 직접 생성)
// 변경: 토스 위젯 SDK 사용

import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk'

const widget = await loadPaymentWidget(clientKey, customerPhone)
await widget.renderPaymentMethods('#payment-widget', { value: totalAmount })
await widget.renderAgreement('#agreement')
await widget.requestPayment({ orderId, orderName, amount, ... })
```

## 3. /api/payment/confirm 구현
```typescript
// apps/homepage/src/app/api/payment/confirm/route.ts
export async function POST(request: NextRequest) {
  const { paymentKey, orderId, amount } = await request.json()
  
  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ paymentKey, orderId, amount })
  })
  
  return NextResponse.json(await response.json())
}
```

## 4. 테스트
- 소액 실결제 (1,000원)
- 성공/실패 시나리오 확인
- 주문 생성 확인

---

**지금은 대기. 심사 완료되면 알려주세요.**
