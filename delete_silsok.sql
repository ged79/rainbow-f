-- 실속 근조화환 완전 삭제
DELETE FROM products 
WHERE display_name = '실속 근조화환';

-- 확인
SELECT display_name, customer_price, is_active
FROM products 
WHERE category_1 = '장례식'
  AND is_active = true
ORDER BY customer_price DESC;