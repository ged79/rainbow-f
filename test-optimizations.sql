-- Test Script for Bottleneck Fixes
-- Run these queries to verify optimizations are working

-- 1. Check message queue is working
SELECT 'Message Queue Status' as test;
SELECT status, COUNT(*) 
FROM message_queue 
GROUP BY status;

-- 2. Check store coverage view
SELECT 'Store Coverage View' as test;
SELECT COUNT(*) as total_coverage_records 
FROM store_service_coverage;

-- Sample fast lookup (should be <10ms)
EXPLAIN ANALYZE
SELECT * FROM store_service_coverage
WHERE area_name = '서울특별시 강남구'
AND product_type = '축하화환'
AND is_available = true;

-- 3. Compare query performance
SELECT 'Performance Comparison' as test;

-- Old way (N+1 queries)
EXPLAIN ANALYZE
SELECT s.*, 
  (SELECT price_basic FROM store_area_product_pricing 
   WHERE store_id = s.id 
   AND area_name = '서울특별시 강남구' 
   AND product_type = '축하화환')
FROM stores s
WHERE s.is_open = true
AND s.status = 'active';

-- New way (single query)
EXPLAIN ANALYZE  
SELECT * FROM store_service_coverage
WHERE area_name = '서울특별시 강남구'
AND product_type = '축하화환'
AND is_available = true;

-- 4. Check for blocking operations
SELECT 'Active Queries' as test;
SELECT pid, now() - query_start AS duration, query 
FROM pg_stat_activity 
WHERE state != 'idle' 
AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY duration DESC;
