-- 실속 근조화환 삭제 (display_name이 '실속 근조화환'인 모든 레코드)
DELETE FROM products 
WHERE display_name LIKE '%실속%근조화환%'
   OR (display_name = '실속 근조화환' AND customer_price = 50000);

-- 확인
SELECT display_name, customer_price 
FROM products 
WHERE category_1 = '장례식' AND is_active = true
ORDER BY customer_price DESC;