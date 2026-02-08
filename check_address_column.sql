-- 1. customer_orders 컬럼 목록 확인
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'customer_orders'
AND column_name LIKE '%address%';

-- 2. completion JSON 확인
SELECT 
  order_number,
  product_name,
  jsonb_pretty(completion) as completion_data
FROM customer_orders
WHERE order_number = 'ORD-20251010-2278';

-- 3. 사진 URL 추출
SELECT 
  order_number,
  product_name,
  completion->'photos'->0 as first_photo
FROM customer_orders
WHERE status = 'completed'
AND completion IS NOT NULL
AND jsonb_typeof(completion) = 'object'
LIMIT 5;