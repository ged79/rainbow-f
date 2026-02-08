-- Admin 인증 시스템 설정

-- 1. admin_users 테이블 생성 (없을 경우)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Admin 사용자 추가
INSERT INTO admin_users (email, name, role)
VALUES ('gttimeedu@gmail.com', 'Admin', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- 3. RLS 정책 업데이트
-- Orders 정책
DROP POLICY IF EXISTS "Admin full access to orders" ON orders;
CREATE POLICY "Admin full access to orders" ON orders
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = auth.email()
  )
);

-- Settlements 정책  
DROP POLICY IF EXISTS "Admin full access to settlements" ON settlements;
CREATE POLICY "Admin full access to settlements" ON settlements
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = auth.email()
  )
);

-- 4. 확인
SELECT * FROM admin_users;
SELECT tablename, policyname, roles 
FROM pg_policies 
WHERE tablename IN ('orders', 'settlements');