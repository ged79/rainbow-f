-- 중복 상품 확인
SELECT 
    display_name, 
    COUNT(*) as count,
    array_agg(id) as product_ids,
    array_agg(customer_price) as prices,
    array_agg(florist_price) as florist_prices
FROM products 
WHERE is_active = true 
  AND category_2 = '축하화환'
GROUP BY display_name 
HAVING COUNT(*) > 1
ORDER BY display_name;

-- 전체 축하화환 목록
SELECT id, display_name, customer_price, florist_price, created_at
FROM products
WHERE is_active = true 
  AND category_2 = '축하화환'
ORDER BY display_name, created_at;
