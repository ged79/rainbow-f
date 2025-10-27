# 🏥 Funeral 빈소정보 데이터 구조 분석

**분석일시:** 2025-10-27

---

## 📋 완전한 데이터 구조

```typescript
interface FuneralData {
  // === 고인 기본 정보 ===
  deceased_name: string           // 고인이름 * (필수)
  deceased_hanja: string          // 한자명
  age: number | null              // 나이
  gender: string                  // 성별 (남/여)
  
  // === 종교 정보 ===
  religion: string                // 종교 (불교/기독교/천주교/원불교/유교/무교)
  religion_title: string          // 종교별 호칭 (법명/세례명 등)
  baptismal_name: string          // 세례명 외
  other_title: string             // 기타대우
  
  // === 시간 정보 ===
  placement_time: string          // 입실시간
  placement_date: string          // 안치일시 (입실시간과 동일)
  death_time: string              // 사망일시
  casket_time: string             // 입관시간
  shroud_time: string             // 염습시간
  funeral_time: string            // 발인시간
  checkout_time: string           // 퇴실시간
  
  // === 장지 정보 ===
  burial_type: 'burial' | 'cremation' | ''  // 매장/화장
  burial_location: string         // 1차장지
  burial_location_2: string       // 2차장지
  
  // === 위생처리 정보 ===
  death_cause: string             // 사망원인
  death_place: string             // 사망장소
  chemical_treatment: string      // 약품처리 (yes/no)
  resident_number: string         // 주민번호
  deceased_address: string        // 고인주소
  deceased_note: string           // 고인비고
  
  // === 업무 정보 ===
  business_note: string           // 업무비고
  funeral_director: string        // 장례지도사
  funeral_company: string         // 장례주관
  
  // === 유가족 정보 (JSONB) ===
  family_members: Array<{
    id: number
    relation: string              // 관계 (상주/배우자/아들/딸/며느리/사위/손/손자/손녀/형제/자매)
    name: string                  // 이름
    phone: string                 // 연락처
  }>
  
  // === 부의금 계좌 (JSONB) ===
  bank_accounts: Array<{
    id: number
    bankName: string              // 은행명
    accountNumber: string         // 계좌번호
    accountHolder: string         // 예금주
  }>
  
  // === 모바일 부고장 ===
  use_photo_in_obituary: boolean  // 사진사용 여부
  chief_message: string           // 상주말씀
  photo_url: string | null        // 영정사진 URL
  
  // === 시스템 정보 ===
  room_id: string                 // 빈소 ID (예: 'room-1')
  status: 'active' | 'completed'  // 상태
  created_at: string              // 생성일시
  updated_at?: string             // 수정일시
}
```

---

## 🗄️ Supabase 테이블 스키마

```sql
-- funerals 테이블
CREATE TABLE funerals (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign Key
  funeral_home_id UUID REFERENCES funeral_homes(id) ON DELETE CASCADE,
  
  -- 빈소 정보
  room_number INTEGER NOT NULL,
  room_name VARCHAR(50),
  
  -- === 고인 기본 정보 ===
  deceased_name VARCHAR(100) NOT NULL,
  deceased_hanja VARCHAR(100),
  age INTEGER,
  gender VARCHAR(10),
  
  -- === 종교 정보 ===
  religion VARCHAR(50),
  religion_title VARCHAR(50),
  baptismal_name VARCHAR(100),
  other_title VARCHAR(100),
  
  -- === 시간 정보 ===
  placement_time TIMESTAMPTZ,
  placement_date TIMESTAMPTZ,
  death_time TIMESTAMPTZ,
  casket_time TIMESTAMPTZ,
  shroud_time TIMESTAMPTZ,
  funeral_time TIMESTAMPTZ,
  checkout_time TIMESTAMPTZ,
  
  -- === 장지 정보 ===
  burial_type VARCHAR(20),
  burial_location VARCHAR(200),
  burial_location_2 VARCHAR(200),
  
  -- === 위생처리 정보 ===
  death_cause VARCHAR(100),
  death_place VARCHAR(100),
  chemical_treatment VARCHAR(20),
  resident_number VARCHAR(20),
  deceased_address TEXT,
  deceased_note TEXT,
  
  -- === 업무 정보 ===
  business_note TEXT,
  funeral_director VARCHAR(100),
  funeral_company VARCHAR(100),
  
  -- === JSONB 필드 ===
  family_members JSONB DEFAULT '[]'::jsonb,
  bank_accounts JSONB DEFAULT '[]'::jsonb,
  
  -- === 모바일 부고장 ===
  use_photo_in_obituary BOOLEAN DEFAULT true,
  chief_message TEXT,
  photo_url TEXT,
  
  -- === 시스템 ===
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_burial_type CHECK (burial_type IN ('burial', 'cremation', NULL)),
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed'))
);

-- 인덱스
CREATE INDEX idx_funerals_funeral_home_id ON funerals(funeral_home_id);
CREATE INDEX idx_funerals_status ON funerals(status);
CREATE INDEX idx_funerals_room_number ON funerals(room_number);
CREATE INDEX idx_funerals_created_at ON funerals(created_at DESC);

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_funerals_updated_at 
  BEFORE UPDATE ON funerals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔐 RLS (Row Level Security) 정책

```sql
-- RLS 활성화
ALTER TABLE funerals ENABLE ROW LEVEL SECURITY;

-- 정책 1: 자신의 장례식장 데이터만 조회
CREATE POLICY "Users can view their funeral home's data"
  ON funerals FOR SELECT
  USING (
    funeral_home_id IN (
      SELECT funeral_home_id 
      FROM funeral_users 
      WHERE user_id = auth.uid()
    )
  );

-- 정책 2: 자신의 장례식장 데이터만 삽입
CREATE POLICY "Users can insert their funeral home's data"
  ON funerals FOR INSERT
  WITH CHECK (
    funeral_home_id IN (
      SELECT funeral_home_id 
      FROM funeral_users 
      WHERE user_id = auth.uid()
    )
  );

-- 정책 3: 자신의 장례식장 데이터만 수정
CREATE POLICY "Users can update their funeral home's data"
  ON funerals FOR UPDATE
  USING (
    funeral_home_id IN (
      SELECT funeral_home_id 
      FROM funeral_users 
      WHERE user_id = auth.uid()
    )
  );

-- 정책 4: 자신의 장례식장 데이터만 삭제
CREATE POLICY "Users can delete their funeral home's data"
  ON funerals FOR DELETE
  USING (
    funeral_home_id IN (
      SELECT funeral_home_id 
      FROM funeral_users 
      WHERE user_id = auth.uid()
    )
  );

-- Admin은 모든 데이터 조회 가능
CREATE POLICY "Admin can view all funeral data"
  ON funerals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE user_id = auth.uid() 
      AND store_code = 'admin'
    )
  );
```

---

## 📊 빈소 정보 통계

### 입력 필드 통계
- **필수 입력**: 1개 (deceased_name)
- **고인 정보**: 8개
- **시간 정보**: 7개
- **장지 정보**: 3개
- **위생처리**: 6개
- **업무 정보**: 3개
- **유가족**: 배열 (무제한)
- **부의금 계좌**: 배열 (무제한)
- **부고장**: 3개
- **총 필드**: 30+ 개

### 관계형 데이터
1. **family_members** (JSONB)
   - 동적 추가/삭제
   - 관계별 정렬 (상주 우선)

2. **bank_accounts** (JSONB)
   - 다수 계좌 지원
   - 계좌별 정보 관리

---

## 🎯 다음 단계

### Step 1: 테이블 생성 ✅
위의 SQL을 Supabase에서 실행

### Step 2: Funeral-app API 연동
- LocalStorage 제거
- Supabase CRUD 함수 작성

### Step 3: Admin 연동
- 장례식장별 빈소 현황 조회
- 통계 집계

---

**모든 필드가 정확히 매핑되었습니다. 테이블을 생성하시겠습니까?**
