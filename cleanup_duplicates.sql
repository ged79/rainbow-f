-- 중복 상품 중 최신 것만 남기고 나머지 비활성화
WITH duplicates AS (
  SELECT 
    display_name,
    id,
    ROW_NUMBER() OVER (PARTITION BY display_name ORDER BY created_at DESC) as rn
  FROM products
  WHERE is_active = true
)
UPDATE products 
SET is_active = false
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- 결과 확인
SELECT display_name, COUNT(*) as count
FROM products
WHERE is_active = true
GROUP BY display_name
HAVING COUNT(*) > 1;