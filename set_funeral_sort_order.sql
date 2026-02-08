-- 근조화환 sort_order 가격순으로 설정
UPDATE products
SET sort_order = CASE 
    WHEN display_name = '120송이 근조화환' THEN 1  -- 155,000원
    WHEN display_name = '100송이 근조화환' THEN 2  -- 135,000원
    WHEN display_name = '80송이 근조화환' THEN 3   -- 115,000원
    WHEN display_name = '60송이 근조화환' THEN 4   -- 95,000원
    ELSE sort_order
  END
WHERE category_1 = '장례식' 
  AND category_2 = '근조화환';

-- 확인
SELECT display_name, customer_price, sort_order
FROM products
WHERE category_1 = '장례식' 
  AND category_2 = '근조화환'
  AND is_active = true
ORDER BY sort_order, customer_price DESC;