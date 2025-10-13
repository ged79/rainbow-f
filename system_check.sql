-- 시스템 일관성 검증
-- 1. 장례식 카테고리 점검
SELECT 
  category_2,
  COUNT(*) as count,
  MIN(customer_price) as min_price,
  MAX(customer_price) as max_price
FROM products 
WHERE category_1 = '장례식' AND is_active = true
GROUP BY category_2;

-- 2. 이미지 경로 점검
SELECT display_name, image_url
FROM products
WHERE category_1 = '장례식' AND is_active = true
ORDER BY sort_order;

-- 3. 가격 체계 확인
SELECT 
  display_name,
  customer_price,
  florist_price,
  (customer_price - florist_price) as margin
FROM products
WHERE category_1 = '장례식' AND is_active = true
ORDER BY customer_price DESC;