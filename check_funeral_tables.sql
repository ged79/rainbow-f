-- ===================================
-- 테이블 존재 여부 및 구조 확인
-- ===================================

-- 1. funeral_homes 테이블 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'funeral_homes'
ORDER BY ordinal_position;

-- 2. funeral_users 테이블 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'funeral_users'
ORDER BY ordinal_position;

-- 3. customer_orders 테이블에 funeral_home_id 컬럼 있는지 확인
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'customer_orders' 
  AND column_name = 'funeral_home_id';

-- 4. 기존에 funerals 테이블이 있는지 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'funerals'
) as funerals_table_exists;

-- 5. Foreign Key 제약조건 확인
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('funeral_homes', 'funeral_users', 'customer_orders');
