-- 근조꽃바구니류 카테고리 통합
UPDATE products
SET category_2 = '근조꽃바구니'
WHERE category_1 = '장례식'
  AND display_name IN ('근조꽃바구니/용수바구니', '영정바구니', '근조장구 1단', '근조장구 2단');

-- sort_order 재정렬
UPDATE products
SET sort_order = CASE 
    -- 근조화환 (1-4)
    WHEN display_name = '120송이 근조화환' THEN 1
    WHEN display_name = '100송이 근조화환' THEN 2
    WHEN display_name = '80송이 근조화환' THEN 3
    WHEN display_name = '60송이 근조화환' THEN 4
    -- 근조꽃바구니 (5-8)
    WHEN display_name = '근조장구 2단' THEN 5
    WHEN display_name = '근조장구 1단' THEN 6
    WHEN display_name = '근조꽃바구니/용수바구니' THEN 7
    WHEN display_name = '영정바구니' THEN 8
    ELSE sort_order
  END
WHERE category_1 = '장례식';

-- 확인
SELECT display_name, category_2, customer_price, sort_order
FROM products
WHERE category_1 = '장례식' AND is_active = true
ORDER BY category_2, sort_order;