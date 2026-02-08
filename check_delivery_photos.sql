-- 1. 완료된 주문 확인
SELECT 
  id,
  order_number,
  product_name,
  status,
  completion,
  delivery_address
FROM customer_orders
WHERE status = 'completed'
  AND completion IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 2. completion 필드 구조 확인
SELECT 
  order_number,
  product_name,
  completion->>'photos' as photos,
  completion->>'recipient_name' as recipient,
  jsonb_array_length(completion->'photos') as photo_count
FROM customer_orders
WHERE status = 'completed'
  AND completion->'photos' IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 3. 사진 URL 직접 확인
SELECT 
  order_number,
  product_name,
  jsonb_array_elements_text(completion->'photos') as photo_url
FROM customer_orders
WHERE status = 'completed'
  AND completion->'photos' IS NOT NULL
  AND jsonb_array_length(completion->'photos') > 0
ORDER BY created_at DESC
LIMIT 10;