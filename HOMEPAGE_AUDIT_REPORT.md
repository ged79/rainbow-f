# Homepage 일관성 및 안정성 점검 보고서
생성일: 2025-10-29

## 🔴 긴급 수정 필요

### 1. 중복/백업 파일 정리
**위치**: `/api/orders/`
- route.ts (운영)
- route.old.ts (삭제 필요)
- route.fixed.ts (삭제 필요)
- route.production.ts (삭제 필요)
- route.test.ts (삭제 필요)

**위치**: `/api/payment/confirm/`
- route.ts (운영)
- route.old.ts (삭제 필요)
- route.fixed.ts (삭제 필요)
- route.simple.ts (삭제 필요)

**위치**: `/api/auth/login/`
- route.ts (운영)
- route.backup.ts (삭제 필요)
- route.secure.ts (삭제 필요)

### 2. SMS 인증 시스템
✅ **완료**: 서버 측 검증 구현됨
- send-verification: 코드 생성 및 발송
- verify-code: 서버 검증
- signup: 인증 필수 체크

### 3. Rate Limiting 점검
✅ 적용된 엔드포인트:
- /api/auth/login
- /api/auth/signup
- /api/sms/send-verification
- /api/sms/verify-code
- /api/orders (GET)

⚠️ 점검 필요:
- /api/payment/confirm
- /api/orders (POST)
- /api/coupons/available

## 🟡 개선 권장

### 1. 에러 처리 표준화
현재: 각 API마다 다른 에러 형식
권장: 통일된 에러 응답 포맷

### 2. 환경변수 검증
필수 변수:
- NHN_SMS_APP_KEY
- NHN_SMS_SECRET_KEY
- NHN_SMS_SENDER
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- TOSS_CLIENT_KEY
- TOSS_SECRET_KEY

### 3. 로깅 개선
- 민감정보 마스킹 필요
- 구조화된 로그 형식

## 🟢 양호

### 1. 보안
✅ JWT 인증 구현
✅ bcrypt 비밀번호 해싱
✅ Input validation
✅ Rate limiting

### 2. 데이터베이스
✅ Supabase RLS 활성화 필요
✅ FK 제약조건 설정됨

## 📋 다음 작업 순서

1. 백업 파일 정리 (5분)
2. Rate Limiting 추가 (10분)
3. 에러 처리 표준화 (15분)
4. 환경변수 검증 추가 (10분)
5. 로깅 개선 (10분)

**예상 소요 시간: 50분**
