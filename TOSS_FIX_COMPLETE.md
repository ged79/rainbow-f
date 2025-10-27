# 토스페이먼츠 결제 수정 완료
작성일: 2025-10-27

## 수정 내역

### 1. PaymentModal.tsx - 전면 재작성 ✅
**변경사항:**
- 토스 SDK `loadPaymentWidget()` 직접 호출
- `renderPaymentMethods()` + `renderAgreement()` UI 렌더링
- `/api/payment/request` 호출 제거
- useEffect로 위젯 초기화 관리

**주요 코드:**
```typescript
const paymentWidget = await loadPaymentWidget(clientKey, customerKey)
const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
  '#payment-widget',
  { value: totalAmount }
)
paymentWidget.renderAgreement('#agreement-widget')

await paymentWidget.requestPayment({
  orderId,
  orderName,
  successUrl,
  failUrl,
})
```

### 2. 불필요한 파일 삭제 ✅
- `src/lib/payment/toss.ts` - 삭제
- `src/app/api/payment/request/` - 삭제

### 3. payment/confirm/route.ts ✅
- 이미 정상 구현됨
- 금액 검증은 주문 생성 API에 있음
- 수정 불필요

---

## 작동 플로우

```
[주문 페이지]
  ↓
[PaymentModal 열림]
  ↓ useEffect
loadPaymentWidget()
  ↓
renderPaymentMethods('#payment-widget', { value: 50000 })
renderAgreement('#agreement-widget')
  ↓ 사용자 결제하기 클릭
paymentWidget.requestPayment({ orderId, orderName, successUrl, failUrl })
  ↓
[토스 결제창]
  ↓ 결제 성공
/payment/success?paymentKey=xxx&orderId=xxx&amount=xxx
  ↓
POST /api/payment/confirm
  ↓
POST /api/orders
  ↓
[완료]
```

---

## 테스트 필요

### 로컬 테스트
1. `cd apps/homepage && pnpm dev`
2. 주문 페이지 접속
3. 결제 모달 확인 - 토스 UI 렌더링 확인
4. 테스트 카드: 4000-0000-0000-0008, 12/28, 123

### 확인 사항
- [ ] 결제 모달에서 토스 결제 UI 보임
- [ ] 약관 UI 렌더링됨
- [ ] 결제하기 버튼 클릭 시 토스 결제창 열림
- [ ] 결제 성공 후 /payment/success로 리다이렉트
- [ ] 주문 생성 완료

---

## 프로덕션 배포 전 체크리스트

### 심사 승인 대기중
- [ ] 토스페이먼츠 가맹점 심사 상태 확인
- [ ] 승인 후 상용 키 발급 받기

### 심사 승인 후
- [ ] `.env.production` 업데이트
  ```
  NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_실제키
  TOSS_SECRET_KEY=live_sk_실제키
  ```
- [ ] 배포
- [ ] 소액 결제 테스트 (실제 카드)

---

## 완료
토큰: 101K/190K (53%)
