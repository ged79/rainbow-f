# Funeral-App 인증 시스템 구축 완료

## 작업 날짜
2025-10-27

## 구현 내용

### 1. 데이터베이스 (Supabase)
✅ `SECURITY_RLS_POLICIES.sql` 실행 완료
- funeral_homes 테이블에 password_hash 컬럼 추가
- RLS 정책 설정:
  - funerals: funeral_home_id 기반 격리
  - Admin 전체 조회 권한
  - condolence_messages 공개 접근
  - customer_orders Admin 전용

### 2. 로그인 API (`/app/api/auth/login/route.ts`)
✅ 생성 완료
- bcrypt 비밀번호 검증
- login_id 기반 인증
- HttpOnly 쿠키 설정 (7일 유효)
- 에러 핸들링 구현

### 3. 로그아웃 API (`/app/api/auth/logout/route.ts`)
✅ 생성 완료
- 모든 인증 쿠키 삭제
- 세션 초기화

### 4. 로그인 페이지 (`/app/login/page.tsx`)
✅ 업데이트 완료
- login_id/password 입력
- API 호출 연동
- SessionStorage + Cookie 저장
- 에러 메시지 표시

### 5. 미들웨어 (`middleware.ts`)
✅ 생성 완료
- 쿠키 기반 인증 검증
- /login과 /api/auth 제외
- 미인증 시 로그인 페이지 리다이렉트

### 6. 유틸리티
✅ `generate_hash.js` 생성
- bcrypt 해시 생성 스크립트
- 사용법: `node generate_hash.js <password>`

## 다음 단계

### 즉시 실행 필요
1. **bcrypt 해시 생성**
```bash
cd C:\work_station\flower
npm install bcryptjs  # 없으면 설치
node generate_hash.js yeongdong2024!
```

2. **DB 업데이트**
```sql
-- Supabase SQL Editor에서 실행
-- 1. login_id 컬럼 추가
ALTER TABLE funeral_homes 
ADD COLUMN IF NOT EXISTS login_id TEXT UNIQUE;

-- 2. 영동병원 login_id 설정
UPDATE funeral_homes 
SET login_id = 'yeongdong'
WHERE name LIKE '%영동%';

-- 3. 비밀번호 해시 업데이트 (위에서 생성한 해시 사용)
UPDATE funeral_homes 
SET password_hash = '<생성된_해시>'
WHERE login_id = 'yeongdong';

-- 4. 확인
SELECT id, name, login_id, 
  CASE WHEN password_hash IS NOT NULL THEN '설정됨' ELSE '미설정' END as pwd_status 
FROM funeral_homes;
```

### 테스트 시나리오
1. funeral-app 재빌드
2. /login 접속
3. login_id: yeongdong, password: yeongdong2024! 입력
4. 로그인 성공 → 홈 리다이렉트 확인
5. 쿠키 확인 (개발자도구)
6. 페이지 새로고침 → 세션 유지 확인
7. 로그아웃 → /login 리다이렉트 확인

## 보안 고려사항
✅ HttpOnly 쿠키 (XSS 방어)
✅ bcrypt 해싱 (비밀번호 보호)
✅ Service Role Key 사용 (RLS 우회 방지)
✅ Production에서 Secure 쿠키 활성화
⚠️ HTTPS 필수 (Production)
⚠️ CSRF 토큰 추가 고려

## 파일 목록
```
apps/funeral-app/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts     (NEW)
│   │       └── logout/route.ts    (NEW)
│   └── login/page.tsx              (UPDATED)
├── middleware.ts                   (NEW)

C:\work_station\flower/
├── SECURITY_RLS_POLICIES.sql       (EXECUTED)
├── setup_funeral_auth_complete.sql (NEW)
├── generate_hash.js                (NEW)
└── FUNERAL_AUTH_COMPLETE.md        (THIS FILE)
```

## 체크리스트
- [x] RLS 정책 실행
- [x] 로그인 API 구현
- [x] 로그아웃 API 구현
- [x] 로그인 페이지 업데이트
- [x] 미들웨어 인증 체크
- [x] 쿠키 세션 관리
- [ ] bcrypt 해시 생성
- [ ] DB login_id/password_hash 업데이트
- [ ] 테스트 완료

## 다음 작업 예정
- Admin에서 funeral_homes 계정 관리 UI
- 비밀번호 재설정 기능
- 다중 장례식장 계정 생성
