-- Supabase SQL Editor에서 실행
-- products 테이블의 RLS 정책 확인 및 수정

-- 1. 현재 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'products';

-- 2. RLS 비활성화 (임시)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- 또는 Admin 사용자에게 권한 부여
-- 3. 기존 정책 삭제
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;

-- 4. 새 정책 생성
CREATE POLICY "Enable full access for authenticated users" 
ON products 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 5. RLS 재활성화
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
