-- 60송이 근조화환 가격 수정 및 활성화
UPDATE products
SET 
  customer_price = 95000,
  florist_price = 65000,
  price = 95000,
  is_active = true
WHERE display_name = '60송이 근조화환'
  AND category_1 = '장례식';

-- 대형 근조화환 비활성화 또는 삭제
UPDATE products
SET is_active = false
WHERE display_name = '대형 근조화환';

-- 기본 근조화환 중복 제거 (67000원짜리들)
DELETE FROM products 
WHERE display_name = '기본 근조화환' 
  AND customer_price = 67000
  AND is_active = false;

-- 실속 근조화환 50000원 비활성화
UPDATE products
SET is_active = false
WHERE display_name = '실속 근조화환'
  AND customer_price = 50000;

-- 최종 확인
SELECT display_name, customer_price, is_active
FROM products 
WHERE category_1 = '장례식'
  AND category_2 = '근조화환'
  AND is_active = true
ORDER BY customer_price DESC;