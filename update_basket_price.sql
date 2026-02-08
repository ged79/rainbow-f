-- 근조꽃바구니 가격 8만원으로 수정
UPDATE products
SET 
  customer_price = 80000,
  florist_price = 55000,
  price = 80000
WHERE display_name = '근조꽃바구니/용수바구니'
  AND category_1 = '장례식';

-- 확인
SELECT display_name, customer_price
FROM products
WHERE category_1 = '장례식' 
  AND is_active = true
ORDER BY customer_price DESC;