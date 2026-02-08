# SMS 발송 구현 계획

## 현재 상황
- ❌ SMS 발송 기능 없음
- ✅ 주문 생성 API: `/api/orders` (POST)
- ❓ 배송 완료 처리 API 미확인

## 필요 작업

### 1. SMS 발송 API 생성
**파일:** `apps/homepage/src/app/api/sms/send/route.ts`
```typescript
- 알리고 API 호출
- 발신번호, 수신번호, 메시지 전송
- Rate limiting 적용
```

### 2. 주문 완료 시 SMS 발송
**파일:** `apps/homepage/src/app/api/orders/route.ts`
**위치:** POST 함수 끝부분 (주문 생성 성공 후)
```typescript
// 쿠폰 생성 후 추가
await fetch('/api/sms/send', {
  method: 'POST',
  body: JSON.stringify({
    to: formattedCustomerPhone,
    message: `[무지개꽃] 주문이 완료되었습니다.\n주문번호: ${orderNumber}\n금액: ${totalAmount.toLocaleString()}원`
  })
})
```

### 3. 배송 완료 처리 찾기
**확인 필요:**
- `apps/admin/src` 에서 주문 상태 변경 API 찾기
- 또는 `apps/homepage/src/app/api/orders/[id]` 확인

### 4. 배송 완료 시 SMS 발송
**위치:** 상태가 'delivered'로 변경될 때
```typescript
if (newStatus === 'delivered') {
  await fetch('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify({
      to: order.customer_phone,
      message: `[무지개꽃] 배송이 완료되었습니다.\n주문번호: ${order.order_number}`
    })
  })
}
```

## 다음 단계
1. SMS API 생성 (알리고 연동)
2. 주문 완료 SMS 추가
3. 배송 완료 API 찾기
4. 배송 완료 SMS 추가

진행할까요?
