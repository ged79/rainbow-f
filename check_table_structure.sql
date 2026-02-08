-- 1. customer_orders 테이블 구조 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customer_orders'
ORDER BY ordinal_position;

-- 2. 완료된 주문 샘플 확인 (전체 데이터)
SELECT *
FROM customer_orders
WHERE status = 'completed'
  AND completion IS NOT NULL
ORDER BY created_at DESC
LIMIT 2;

-- 3. completion 필드만 확인
SELECT 
  order_number,
  product_name,
  status,
  completion
FROM customer_orders
WHERE status = 'completed'
  AND completion IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;