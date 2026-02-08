-- =============================================
-- Products 테이블 완전 재구성
-- =============================================

-- 1. 기존 테이블 백업 (안전을 위해)
CREATE TABLE IF NOT EXISTS products_backup AS 
SELECT * FROM products;

-- 2. products 테이블 구조 확인 및 수정
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- 3. 메인 이미지가 없는 경우 image_url을 images 배열 첫 번째로 설정
UPDATE products 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL 
  AND (images IS NULL OR images = '{}');

-- 4. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_1, category_2);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order);

-- 5. 상품 데이터 정리
UPDATE products SET is_active = true WHERE is_active IS NULL;
UPDATE products SET sort_order = 999 WHERE sort_order IS NULL;

-- 6. 테스트 데이터 확인
SELECT 
  id,
  display_name,
  category_1,
  category_2,
  price,
  image_url,
  images,
  is_active
FROM products 
WHERE is_active = true
ORDER BY category_1, category_2, sort_order
LIMIT 10;
