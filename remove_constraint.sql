-- 제약조건 완전 제거
ALTER TABLE products DROP CONSTRAINT IF EXISTS unique_product_per_category;

-- 확인
SELECT conname FROM pg_constraint WHERE conrelid = 'products'::regclass;