-- 1. 존재하는 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%funeral%'
ORDER BY table_name;

-- 2. funeral 관련 모든 테이블의 컬럼 구조
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name LIKE '%funeral%'
ORDER BY table_name, ordinal_position;
