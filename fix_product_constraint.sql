-- 현재 제약조건 확인
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.table_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'products'
AND tc.constraint_type = 'UNIQUE';

-- unique_product_per_category 제약 제거
ALTER TABLE products DROP CONSTRAINT IF EXISTS unique_product_per_category;

-- 새로운 제약 추가: 1차 카테고리별 중복 허용
ALTER TABLE products ADD CONSTRAINT unique_product_per_category 
UNIQUE (display_name, category_1, category_2);

-- 또는 제약 없이 운영하려면:
-- ALTER TABLE products DROP CONSTRAINT IF EXISTS unique_product_per_category;