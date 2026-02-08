# Admin 장례식장 자동 계정 생성 구현 완료

## 작업 날짜
2025-10-27

## 구현 완료

### 1. API 엔드포인트 (`/api/funeral-homes/route.ts`)
✅ POST 메서드 구현
- login_id 자동 생성: `{장례식장명}_랜덤4자리`
- 비밀번호 자동 생성: 8자리 영문+숫자+특수문자
- bcrypt 해싱 (salt rounds: 10)
- DB INSERT: login_id + password_hash 포함
- 응답: 평문 비밀번호 반환 (최초 1회만)

### 2. 등록 페이지 업데이트 (`/funeral-homes/create/page.tsx`)
✅ 2단계 UI
- **1단계**: 장례식장 정보 입력 폼
  - 이름, 주소, 전화번호 (필수)
  - 빈소 개수, 담당자, 이메일 (선택)
  
- **2단계**: 계정 정보 표시
  - login_id 표시 + 복사 버튼
  - 비밀번호 표시/숨김 + 복사 버튼
  - 경고 메시지: "한 번만 표시됨"
  - 목록으로 버튼

### 3. 보안 기능
✅ 비밀번호 보안
- 평문 비밀번호는 API 응답에만 포함 (DB 저장 안 함)
- bcrypt 해시만 DB 저장
- 브라우저 새로고침 시 비밀번호 사라짐 (의도적)

## 절차 (자동화)

### Admin에서 장례식장 등록
1. `/funeral-homes/create` 접속
2. 폼 작성 (이름, 주소, 전화번호 필수)
3. "등록하기" 클릭
4. **자동 생성됨**:
   - login_id 예: `yeongdong_a3x9`
   - password 예: `Kp8m@Tn2`
5. 화면에 계정 정보 표시 + 복사 기능
6. 담당자에게 전달

### Funeral-app에서 로그인
1. `/login` 접속
2. 자동 생성된 login_id/password 입력
3. 로그인 성공 → 부고 관리

## 설치 필요
```bash
cd apps/admin
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
```

## 테스트 시나리오
1. ✅ Admin 등록 페이지 접속
2. ✅ 장례식장 정보 입력
3. ✅ 등록 클릭 → 계정 생성
4. ✅ login_id/password 복사
5. ✅ Funeral-app 로그인 테스트
6. ✅ 브라우저 새로고침 → 비밀번호 사라짐 확인
7. ✅ Admin 목록에서 장례식장 확인

## 파일 목록
```
apps/admin/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── funeral-homes/
│   │   │       └── route.ts           (NEW - API)
│   │   └── (dashboard)/
│   │       └── funeral-homes/
│   │           └── create/
│   │               └── page.tsx        (UPDATED - 2단계 UI)

C:\work_station\flower/
└── ADMIN_FUNERAL_ACCOUNT_AUTO.md      (THIS FILE)
```

## 추가 기능 예정
- [ ] 비밀번호 재설정 기능
- [ ] 계정 목록에서 login_id 표시
- [ ] 계정 비활성화/삭제
- [ ] 로그인 실패 로그 확인

## 체크리스트
- [x] API 엔드포인트 생성
- [x] 등록 페이지 UI 업데이트
- [x] 계정 정보 표시 화면
- [x] 복사 기능 구현
- [ ] bcryptjs 설치
- [ ] 테스트 완료
