-- ===================================
-- FUNERAL 시스템 테이블 생성
-- ===================================

-- 1. funeral_homes 테이블 생성
CREATE TABLE IF NOT EXISTS funeral_homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  room_count INTEGER NOT NULL DEFAULT 6,
  contact_person VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive'))
);

-- 2. funeral_users 테이블 생성
CREATE TABLE IF NOT EXISTS funeral_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(100) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  temp_password VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_role CHECK (role IN ('admin', 'staff'))
);

-- 3. funerals 테이블 생성 (빈소 정보)
CREATE TABLE IF NOT EXISTS funerals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
  
  -- 빈소 정보
  room_number INTEGER NOT NULL,
  room_name VARCHAR(50),
  
  -- 고인 기본 정보
  deceased_name VARCHAR(100) NOT NULL,
  deceased_hanja VARCHAR(100),
  age INTEGER,
  gender VARCHAR(10),
  
  -- 종교 정보
  religion VARCHAR(50),
  religion_title VARCHAR(50),
  baptismal_name VARCHAR(100),
  other_title VARCHAR(100),
  
  -- 시간 정보
  placement_time TIMESTAMP,
  placement_date TIMESTAMP,
  death_time TIMESTAMP,
  casket_time TIMESTAMP,
  shroud_time TIMESTAMP,
  funeral_time TIMESTAMP,
  checkout_time TIMESTAMP,
  
  -- 장지 정보
  burial_type VARCHAR(20),
  burial_location VARCHAR(200),
  burial_location_2 VARCHAR(200),
  
  -- 위생처리 정보
  death_cause VARCHAR(100),
  death_place VARCHAR(100),
  chemical_treatment VARCHAR(20),
  resident_number VARCHAR(20),
  deceased_address TEXT,
  deceased_note TEXT,
  
  -- 업무 정보
  business_note TEXT,
  funeral_director VARCHAR(100),
  funeral_company VARCHAR(100),
  
  -- JSONB 필드
  family_members JSONB DEFAULT '[]'::jsonb,
  bank_accounts JSONB DEFAULT '[]'::jsonb,
  
  -- 모바일 부고장
  use_photo_in_obituary BOOLEAN DEFAULT true,
  chief_message TEXT,
  photo_url TEXT,
  
  -- 시스템
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_burial_type CHECK (burial_type IN ('burial', 'cremation', NULL)),
  CONSTRAINT valid_status_funeral CHECK (status IN ('active', 'completed'))
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_funeral_homes_status ON funeral_homes(status);
CREATE INDEX IF NOT EXISTS idx_funeral_users_funeral_home_id ON funeral_users(funeral_home_id);
CREATE INDEX IF NOT EXISTS idx_funeral_users_email ON funeral_users(email);
CREATE INDEX IF NOT EXISTS idx_funerals_funeral_home_id ON funerals(funeral_home_id);
CREATE INDEX IF NOT EXISTS idx_funerals_status ON funerals(status);
CREATE INDEX IF NOT EXISTS idx_funerals_room_number ON funerals(room_number);
CREATE INDEX IF NOT EXISTS idx_funerals_created_at ON funerals(created_at DESC);

-- 5. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_funeral_homes_updated_at 
  BEFORE UPDATE ON funeral_homes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funeral_users_updated_at 
  BEFORE UPDATE ON funeral_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funerals_updated_at 
  BEFORE UPDATE ON funerals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS (Row Level Security) 활성화
ALTER TABLE funeral_homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE funeral_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE funerals ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 - funeral_homes
CREATE POLICY "Admin can view all funeral homes"
  ON funeral_homes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE user_id = auth.uid() 
      AND store_code = 'admin'
    )
  );

CREATE POLICY "Admin can insert funeral homes"
  ON funeral_homes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE user_id = auth.uid() 
      AND store_code = 'admin'
    )
  );

CREATE POLICY "Admin can update funeral homes"
  ON funeral_homes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE user_id = auth.uid() 
      AND store_code = 'admin'
    )
  );

-- 8. RLS 정책 - funeral_users
CREATE POLICY "Users can view their own record"
  ON funeral_users FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin can view all funeral users"
  ON funeral_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE user_id = auth.uid() 
      AND store_code = 'admin'
    )
  );

CREATE POLICY "Admin can insert funeral users"
  ON funeral_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE user_id = auth.uid() 
      AND store_code = 'admin'
    )
  );

-- 9. RLS 정책 - funerals
CREATE POLICY "Users can view their funeral home's data"
  ON funerals FOR SELECT
  USING (
    funeral_home_id IN (
      SELECT funeral_home_id 
      FROM funeral_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their funeral home's data"
  ON funerals FOR INSERT
  WITH CHECK (
    funeral_home_id IN (
      SELECT funeral_home_id 
      FROM funeral_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their funeral home's data"
  ON funerals FOR UPDATE
  USING (
    funeral_home_id IN (
      SELECT funeral_home_id 
      FROM funeral_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their funeral home's data"
  ON funerals FOR DELETE
  USING (
    funeral_home_id IN (
      SELECT funeral_home_id 
      FROM funeral_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all funeral data"
  ON funerals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE user_id = auth.uid() 
      AND store_code = 'admin'
    )
  );

-- 10. customer_orders에 funeral_home_id 추가 (있으면 스킵)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_orders' 
    AND column_name = 'funeral_home_id'
  ) THEN
    ALTER TABLE customer_orders 
    ADD COLUMN funeral_home_id UUID REFERENCES funeral_homes(id);
    
    CREATE INDEX idx_customer_orders_funeral_home_id 
    ON customer_orders(funeral_home_id);
  END IF;
END $$;
