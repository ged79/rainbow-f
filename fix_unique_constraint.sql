-- 제약조건 확인
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'unique_product_per_category';

-- 제약조건 삭제
ALTER TABLE products DROP CONSTRAINT IF EXISTS unique_product_per_category;

-- 중복 상품 확인
SELECT display_name, category_1, category_2, COUNT(*) 
FROM products 
WHERE is_active = true 
GROUP BY display_name, category_1, category_2 
HAVING COUNT(*) > 1;