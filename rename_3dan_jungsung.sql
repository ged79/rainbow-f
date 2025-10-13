-- 3단 화환2를 3단 화환 정성으로 이름 변경
UPDATE products
SET display_name = CASE
  WHEN display_name = '3단 축하화환2' THEN '3단 축하화환 정성'
  WHEN display_name = '3단 개업화환2' THEN '3단 개업화환 정성'
  WHEN display_name = '3단 승진화환2' THEN '3단 승진화환 정성'
  ELSE display_name
END
WHERE display_name LIKE '%화환2';

-- 확인
SELECT display_name, customer_price 
FROM products 
WHERE display_name LIKE '%정성%';