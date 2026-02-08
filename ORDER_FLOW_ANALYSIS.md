# 주문 처리 흐름 분석 완료

## 📋 Homepage (고객 주문)
**파일:** `apps/homepage/src/app/api/orders/route.ts`

1. 고객이 주문 생성 (POST)
2. `customer_orders` 테이블에 INSERT
3. 상태: `pending`
4. ❌ SMS 발송 없음

## 📋 Admin (관리자 배정)
**파일:** `apps/admin/src/app/(dashboard)/customer-orders/page.tsx`

1. 관리자가 `pending` 주문 확인
2. "배정" 버튼 클릭 → `assignOrder()`
3. `orders` 테이블에 새 레코드 생성
4. `customer_orders` 상태 업데이트: `assigned`
5. ❌ SMS 발송 없음

## 🚚 배송 완료 처리
**현재 상태:** 코드에 없음
**추정:** 
- 꽃집이 별도 시스템에서 처리하거나
- 관리자가 Supabase에서 직접 업데이트

## 🎯 SMS 발송이 필요한 시점

### 1. 주문 완료 (homepage)
**위치:** `apps/homepage/src/app/api/orders/route.ts`
**시점:** 주문 INSERT 성공 후
```typescript
// Line ~280 (쿠폰 생성 후)
// 여기에 SMS 발송 추가
```

### 2. 배송 완료
**문제:** 배송 완료 처리 코드가 없음
**해결:** API 새로 생성 필요
- `apps/homepage/src/app/api/orders/[id]/status/route.ts` (PATCH)
- 상태를 'delivered'로 변경
- SMS 발송

## ✅ 다음 작업 순서

1. **SMS API 생성**
   - `apps/homepage/src/app/api/sms/send/route.ts`
   
2. **주문 완료 SMS 추가**
   - `apps/homepage/src/app/api/orders/route.ts` 수정
   
3. **배송 완료 API 생성**
   - `apps/homepage/src/app/api/orders/[id]/status/route.ts`
   - SMS 발송 포함

4. **관리자 UI 추가**
   - 배송 완료 버튼 (선택사항)

진행할까요?
