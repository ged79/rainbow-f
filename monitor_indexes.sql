-- 실행 전 현재 인덱스 백업
-- 실행일시: YYYY-MM-DD HH:MM

-- 현재 인덱스 목록 저장
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- 인덱스 생성 상태 모니터링
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE query LIKE 'CREATE INDEX%'
AND state != 'idle';

-- 실행 후 성능 확인
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM customer_orders 
WHERE customer_name = '테스트' 
AND customer_phone = '010-1234-5678';

-- 인덱스 사용량 확인
SELECT 
  schemaname,
  indexrelname as indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
