# SMS → LMS 전환 작업 완료 보고서

## 📅 작업 일시
**2025-10-29**

---

## ✅ 작업 완료 내역

### 변경된 파일 (3개)

1. **`src/app/api/send-sms/route.ts`**
   - URL: `/sender/sms` → `/sender/mms` ✅
   - 추가: `title: "무지개꽃 알림"` ✅
   - 글자 제한: 45자 → 1,000자 ✅

2. **`src/app/api/send-delivery-sms/route.ts`**
   - URL: `/sender/sms` → `/sender/mms` ✅
   - 추가: `title: "배송 완료 안내"` ✅
   - 글자 제한: 45자 → 1,000자 ✅

3. **`src/app/api/sms/send/route.ts`**
   - URL: `/sender/sms` → `/sender/mms` ✅
   - 추가: `title: "무지개꽃 알림"` ✅
   - 알리고 API 백업 로직 제거 ✅
   - 글자 제한: 45자 → 1,000자 ✅

---

## 📊 변경 전/후 비교

### 변경 전 (SMS - 단문)
```typescript
POST https://api-sms.cloud.toast.com/sms/v3.0/appKeys/{appKey}/sender/sms

{
  "body": "메시지 내용 (최대 한글 45자)",
  "sendNo": "발신번호",
  "recipientList": [...]
}
```

### 변경 후 (LMS - 장문)
```typescript
POST https://api-sms.cloud.toast.com/sms/v3.0/appKeys/{appKey}/sender/mms

{
  "title": "무지개꽃 알림",              // ✨ 추가
  "body": "메시지 내용 (최대 한글 1,000자)", // ✨ 제한 완화
  "sendNo": "발신번호",
  "recipientList": [...]
}
```

---

## 🎯 해결된 문제

### 1. 메시지 잘림 현상 해결
- **문제**: SMS 단문 사용으로 45자(한글 기준) 초과 시 메시지 잘림
- **해결**: LMS 장문으로 전환하여 1,000자(한글 기준)까지 발송 가능

### 2. 알리고 의존성 제거
- **문제**: 알리고 API 백업 로직으로 코드 복잡도 증가
- **해결**: NHN Cloud만 사용하도록 단순화

### 3. API 일관성 확보
- **문제**: 3개 파일에서 각각 다른 방식으로 SMS 발송
- **해결**: 모두 NHN Cloud LMS로 통일

---

## 📈 예상 효과

| 항목 | 개선 전 | 개선 후 | 효과 |
|-----|---------|---------|------|
| **글자 수 제한** | 한글 45자 | 한글 1,000자 | **22배 증가** ✅ |
| **메시지 잘림** | 발생 중 | 해결 | **고객 불편 해소** ✅ |
| **API 의존성** | 알리고 + NHN | NHN만 사용 | **코드 단순화** ✅ |
| **유지보수성** | 복잡 | 단순 | **관리 용이** ✅ |

---

## 🔧 테스트 방법

### 1. 환경 변수 확인
```bash
# .env.local 파일 확인
NHN_SMS_APP_KEY=your_app_key
NHN_SMS_SECRET_KEY=your_secret_key
NHN_SMS_SENDER=your_sender_number
```

### 2. 테스트 시나리오

#### 시나리오 1: 주문 확인 SMS (send-sms)
```bash
POST /api/send-sms
{
  "to": "01012345678",
  "body": "[무지개꽃배달] 주문이 접수되었습니다.\n주문번호: ORD-2025-001\n상품: 장미꽃다발 50송이\n배송지: 서울시 강남구...\n감사합니다."
}
```

#### 시나리오 2: 배송 완료 SMS (send-delivery-sms)
```bash
POST /api/send-delivery-sms
{
  "orderId": "order_id_here"
}
```

#### 시나리오 3: 일반 SMS (sms/send)
```bash
POST /api/sms/send
{
  "to": "01012345678",
  "message": "긴 메시지 내용 테스트..."
}
```

### 3. 성공 응답 확인
```json
{
  "header": {
    "isSuccessful": true,
    "resultCode": 0,
    "resultMessage": "SUCCESS"
  },
  "body": {
    "data": {
      "requestId": "20180810100630ReZQ6KZzAH0",
      "statusCode": "2"
    }
  }
}
```

---

## ⚠️ 주의사항

### 1. 요금 변경
- SMS 단문보다 LMS 장문이 약간 비쌈
- 정확한 요금은 NHN Cloud 콘솔에서 확인 필요

### 2. 제목(title) 필수
- LMS는 제목 필드가 필수
- 제목 최대 길이: 한글 20자 (40바이트)

### 3. 이미지 첨부 불가
- 현재 텍스트만 발송 (MMS 아님)
- 이미지 필요 시 `attachFileIdList` 추가 구현 필요

---

## 🔄 롤백 방법 (문제 발생 시)

### 긴급 롤백 (3분 소요)

각 파일에서 2곳만 수정:

```typescript
// 1. URL 변경
- '/sender/mms' 
+ '/sender/sms'

// 2. title 필드 제거
- title: '무지개꽃 알림',
+ // title 제거
```

### 상세 롤백 절차

1. **파일 1**: `send-sms/route.ts`
   - Line 14: `mms` → `sms`
   - Line 22: `title: '무지개꽃 알림',` 삭제

2. **파일 2**: `send-delivery-sms/route.ts`
   - Line 30: `mms` → `sms`
   - Line 38: `title: '배송 완료 안내',` 삭제

3. **파일 3**: `sms/send/route.ts`
   - Line 29: `mms` → `sms`
   - Line 37: `title: '무지개꽃 알림',` 삭제

---

## 📞 문의 및 지원

### NHN Cloud 공식 문서
- API 가이드: https://docs.nhncloud.com/ko/Notification/SMS/ko/api-guide/
- 콘솔: https://console.nhncloud.com

### 발견된 이슈 보고
- 문자 발송 실패 시 NHN Cloud 콘솔에서 상세 로그 확인
- 에러 코드 참조: [NHN Cloud SMS 에러 코드표]

---

## ✅ 작업 결과

**상태**: ✅ 완료  
**영향도**: 🟢 낮음  
**테스트 필요**: ⚠️ 필수  
**배포 준비**: ✅ 완료
