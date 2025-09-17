-- 간단 버전 - 인덱스 확인용

-- 1. 현재 인덱스 목록
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. 인덱스 생성 후 확인
SELECT COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public';

-- 3. 성능 테스트 (실행 계획)
EXPLAIN SELECT * FROM customer_orders 
WHERE customer_phone = '010-1234-5678';