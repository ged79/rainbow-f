-- 축하화환 중복 상품 가격 확인
SELECT 
    display_name,
    customer_price,
    florist_price,
    created_at
FROM products 
WHERE is_active = true 
  AND category_2 = '축하화환'
ORDER BY display_name, created_at;
