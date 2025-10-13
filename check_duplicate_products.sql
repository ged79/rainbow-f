-- 중복 상품 확인
SELECT 
  display_name,
  category_1,
  category_2,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as ids
FROM products
WHERE is_active = true
GROUP BY display_name, category_1, category_2
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 예: '100송이 축하화환'이 여러 카테고리에 중복
SELECT * FROM products 
WHERE display_name LIKE '%100송이 축하화환%'
AND is_active = true;