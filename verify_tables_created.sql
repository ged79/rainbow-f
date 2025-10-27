-- 테이블 생성 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('funeral_homes', 'funeral_users', 'funerals')
ORDER BY table_name;
