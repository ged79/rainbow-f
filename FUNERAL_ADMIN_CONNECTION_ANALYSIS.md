# 🏥 Funeral-App ↔ Admin 연결 현황 분석

**분석일시:** 2025-10-27  
**분석 범위:** Funeral-app과 Admin의 장례식장 관리 시스템 연동 구조

---

## 📊 현재 상태 요약

### ✅ 발견 사항
1. **Admin에 장례식장 관리 페이지가 이미 구현되어 있음**
2. **Funeral-app은 독립 실행형으로 현재 Admin과 직접 연결되어 있지 않음**
3. **데이터베이스 테이블 구조는 존재하지만 실제 연동은 미구현**

---

## 🏗️ Admin 장례식장 관리 구조

### 페이지 구성
```
apps/admin/src/app/(dashboard)/funeral-homes/
├── page.tsx              # 장례식장 목록 페이지
├── create/
│   └── page.tsx          # 신규 장례식장 등록
└── [id]/
    └── page.tsx          # 장례식장 상세 페이지
```

### 주요 기능

#### 1. 장례식장 목록 페이지 (`/funeral-homes`)
- **통계 카드 표시**
  - 전체 장례식장 수
  - 활성 장례식장 수 (활성률 %)
  - 이번 달 주문 수
  - 이번 달 매출

- **장례식장 목록 테이블**
  ```typescript
  - 장례식장명 + 이메일
  - 위치 (주소)
  - 빈소 수
  - 연락처
  - 이번 달 주문
  - 매출
  - 상태 (활성/비활성)
  - 관리 (상세보기/수정)
  ```

- **검색 기능**
  - 장례식장 이름으로 검색
  - 지역으로 검색

#### 2. 장례식장 등록 페이지 (`/funeral-homes/create`)
- **기본 정보**
  - 장례식장명 *
  - 주소 *
  - 전화번호 *
  - 빈소 개수 * (기본값: 6)

- **담당자 정보**
  - 담당자 이름 *
  - 이메일 (로그인 ID) *
  - 상태 (활성/비활성)

- **자동 생성 기능**
  ```typescript
  // 장례식장 등록 시 자동으로 관리자 계정 생성
  const { error: userError } = await supabase
    .from('funeral_users')
    .insert([{
      funeral_home_id: home.id,
      email: formData.email,
      full_name: formData.contact_person,
      role: 'admin',
      temp_password: defaultPassword  // 임시 비밀번호 자동 생성
    }])
  ```

#### 3. 장례식장 상세 페이지 (`/funeral-homes/[id]`)
- **기본 정보 표시**
  - 장례식장명
  - 주소
  - 전화번호
  - 빈소 수
  - 상태 (활성/비활성)

- **통계 정보**
  - 오늘 주문 / 매출
  - 이번 주 주문 / 매출
  - 이번 달 주문 / 매출
  - 전체 주문 / 매출

- **최근 주문 목록**
  - 주문번호
  - 상품명
  - 금액
  - 상태
  - 주문일시

- **액션 버튼**
  - 활성화/비활성화
  - 정보 수정

---

## 🎯 Funeral-App 구조

### 현재 상태
- **독립 실행형 애플리케이션**
- **LocalStorage 기반 데이터 저장**
- **Supabase 연동 준비는 되어 있으나 미구현**

### 주요 컴포넌트
```typescript
// AdminDashboard.tsx - 메인 컴포넌트
- 빈소 관리 (6개 빈소)
- 고인 정보 입력
- 유가족 정보 관리
- 부의금 계좌 관리
- 부고장 생성
```

### 데이터 저장 방식 (현재)
```typescript
// LocalStorage에 JSON 저장
const funeralData = {
  deceased_name: '...',
  room_id: 'room-1',
  family_members: [...],
  bank_accounts: [...],
  // ...
}
localStorage.setItem('funerals', JSON.stringify(funerals))
```

---

## 🔌 데이터베이스 스키마

### Admin에서 사용하는 테이블

#### `funeral_homes` 테이블
```typescript
interface FuneralHome {
  id: string
  name: string                    // 장례식장명
  address: string                 // 주소
  phone: string                   // 전화번호
  email: string                   // 이메일
  room_count: number              // 빈소 수
  contact_person: string          // 담당자명
  status: 'active' | 'inactive'   // 상태
  created_at: string
}
```

#### `funeral_users` 테이블
```typescript
interface FuneralUser {
  id: string
  funeral_home_id: string         // 장례식장 ID (FK)
  email: string                   // 로그인 이메일
  full_name: string               // 담당자명
  role: 'admin' | 'staff'         // 권한
  temp_password: string           // 임시 비밀번호
  created_at: string
}
```

#### `customer_orders` 테이블 연결
```typescript
// Admin에서 장례식장별 주문 조회
await supabase
  .from('customer_orders')
  .select('*')
  .eq('funeral_home_id', params.id)
```

---

## ❌ 현재 미연결 상태

### 문제점
1. **Funeral-app은 LocalStorage 사용**
   - Supabase 연동 코드는 주석 처리됨
   - 장례식장 ID 개념 없음

2. **인증 시스템 없음**
   - Funeral-app에 로그인 기능 없음
   - 장례식장 구분 불가

3. **데이터 동기화 불가**
   - Admin에서 장례식장 등록해도
   - Funeral-app에서 접근 불가

---

## 🎯 연결을 위해 필요한 작업

### Phase 1: 인증 시스템 구축
```typescript
// Funeral-app에 로그인 페이지 추가
1. Email/Password 로그인
2. funeral_users 테이블 조회
3. JWT 토큰 발급
4. funeral_home_id 세션 저장
```

### Phase 2: 데이터 구조 정의
```typescript
// funerals 테이블 생성
interface Funeral {
  id: string
  funeral_home_id: string         // FK to funeral_homes
  room_number: number             // 빈소 번호
  deceased_name: string           // 고인 이름
  deceased_hanja?: string         // 한자명
  age?: number
  gender?: string
  religion?: string
  religion_title?: string
  
  // 시간 정보
  placement_time?: string         // 입실시간
  death_time?: string             // 사망일시
  casket_time?: string            // 입관시간
  shroud_time?: string            // 염습시간
  funeral_time?: string           // 발인시간
  checkout_time?: string          // 퇴실시간
  
  // 장지 정보
  burial_type?: 'burial' | 'cremation'
  burial_location?: string
  burial_location_2?: string
  
  // 추가 정보
  family_members: FamilyMember[]  // JSON
  bank_accounts: BankAccount[]    // JSON
  chief_message?: string
  photo_url?: string
  
  status: 'active' | 'completed'
  created_at: string
  updated_at: string
}
```

### Phase 3: API 엔드포인트 구축
```typescript
// Funeral-app API
POST   /api/funerals              // 장례 정보 저장
GET    /api/funerals              // 목록 조회
GET    /api/funerals/:id          // 상세 조회
PUT    /api/funerals/:id          // 수정
DELETE /api/funerals/:id          // 삭제

// Admin 연동 API
GET    /api/admin/funeral-homes/:id/funerals  // Admin에서 조회
```

### Phase 4: Funeral-app 리팩토링
```typescript
// LocalStorage → Supabase로 전환
// 1. 기존 데이터 마이그레이션 도구
// 2. 모든 CRUD를 Supabase로 변경
// 3. Real-time 업데이트 적용
```

---

## 🔐 보안 고려사항

### Row Level Security (RLS) 정책
```sql
-- funeral_homes 테이블
CREATE POLICY "Users can view their own funeral home"
  ON funeral_homes FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM funeral_users 
    WHERE funeral_home_id = funeral_homes.id
  ));

-- funerals 테이블
CREATE POLICY "Users can manage funerals of their funeral home"
  ON funerals FOR ALL
  USING (funeral_home_id IN (
    SELECT funeral_home_id FROM funeral_users 
    WHERE user_id = auth.uid()
  ));
```

---

## 📝 연결 작업 순서 (권장)

### Step 1: 데이터베이스 준비
```sql
-- funerals 테이블 생성
-- RLS 정책 적용
-- 인덱스 생성
```

### Step 2: 인증 시스템
```typescript
// Funeral-app 로그인 페이지
// funeral_users 테이블 연동
// 세션 관리
```

### Step 3: API 구축
```typescript
// CRUD API 엔드포인트
// 권한 검증 미들웨어
```

### Step 4: Funeral-app 리팩토링
```typescript
// LocalStorage 제거
// Supabase 연동
// Real-time 적용
```

### Step 5: Admin 연동
```typescript
// Admin에서 Funeral 데이터 조회
// 통계 업데이트
```

---

## 🚨 중요 사항

### 1. 데이터 마이그레이션
- 현재 LocalStorage에 저장된 데이터가 있을 수 있음
- 마이그레이션 도구 필요

### 2. 기존 기능 유지
- Funeral-app의 모든 기능 (부고장, 현황판 등)은 그대로 유지
- 데이터 저장 방식만 변경

### 3. 실시간 동기화
- 여러 사용자가 동시에 접근 가능
- Supabase Realtime 활용

---

## 🎯 다음 단계

**작업을 진행하시겠습니까?**

1. **데이터베이스 스키마 확정**
   - funerals 테이블 상세 설계
   - RLS 정책 작성

2. **인증 시스템 구축**
   - Funeral-app 로그인 페이지
   - JWT 토큰 관리

3. **API 엔드포인트 개발**
   - CRUD 작업
   - 권한 검증

4. **Funeral-app 리팩토링**
   - LocalStorage → Supabase
   - Real-time 적용

---

**준비 완료. 다음 지시를 기다립니다.** 🔧
