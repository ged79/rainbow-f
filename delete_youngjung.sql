-- 영정바구니 삭제
DELETE FROM products 
WHERE display_name = '영정바구니';

-- 확인
SELECT display_name, customer_price, image_url
FROM products
WHERE category_1 = '장례식' 
  AND is_active = true
ORDER BY customer_price DESC;