-- 1. 60송이 근조화환 가격 수정 (67000 → 95000)
UPDATE products
SET 
  customer_price = 95000,
  florist_price = 65000,
  price = 95000
WHERE display_name = '60송이 근조화환'
  AND category_1 = '장례식';

-- 2. 실속 근조화환 완전 삭제
DELETE FROM products 
WHERE display_name = '실속 근조화환';

-- 3. 확인
SELECT display_name, customer_price, is_active
FROM products 
WHERE category_1 = '장례식'
  AND category_2 = '근조화환'
ORDER BY customer_price DESC;