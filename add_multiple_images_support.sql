-- =============================================
-- Products 테이블에 다중 이미지 지원 추가
-- =============================================

-- 1. products 테이블에 이미지 배열 컬럼 추가
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- 2. 기존 image_url을 images 배열로 마이그레이션
UPDATE products 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL 
  AND (images IS NULL OR images = '{}');

-- 3. 이미지 메타데이터 테이블 생성 (선택사항)
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type VARCHAR(50), -- 'main', 'detail', 'size', 'package', 'delivered'
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort ON product_images(sort_order);

-- 5. 샘플 데이터 (예시)
-- UPDATE products 
-- SET images = ARRAY[
--   '/100송이 축하화환_main.jpg',
--   '/100송이 축하화환_detail.jpg', 
--   '/100송이 축하화환_size.jpg',
--   '/100송이 축하화환_package.jpg',
--   '/100송이 축하화환_delivered.jpg',
--   '/100송이 축하화환_ribbon.jpg'
-- ]
-- WHERE display_name = '100송이 축하화환';
