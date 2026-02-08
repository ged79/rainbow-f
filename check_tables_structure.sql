-- 테이블 구조만 간단히 확인
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('funeral_homes', 'funeral_users')
ORDER BY table_name, ordinal_position;
