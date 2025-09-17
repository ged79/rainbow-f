-- =============================================
-- COMPLETE PRODUCT UPLOAD SCRIPT FOR SUPABASE
-- Date: 2025-01-23
-- Purpose: Upload all products from homepage category pages to database
-- 
-- HOW TO USE:
-- 1. Go to Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Select your project (qvgxqluwumbgslbxaeaq)
-- 3. Go to SQL Editor (left sidebar)
-- 4. Create New Query
-- 5. Copy and paste this entire script
-- 6. Click "Run" button
-- =============================================

-- First, create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  grade VARCHAR(50),
  flower_count INTEGER,
  price INTEGER NOT NULL,
  category_1 VARCHAR(100) NOT NULL,
  category_2 VARCHAR(100) NOT NULL,
  image_url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_1 ON products(category_1);
CREATE INDEX IF NOT EXISTS idx_products_category_2 ON products(category_2);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (if they don't exist)
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
  DROP POLICY IF EXISTS "Products can be inserted by authenticated users" ON products;
  DROP POLICY IF EXISTS "Products can be updated by authenticated users" ON products;
  DROP POLICY IF EXISTS "Products can be deleted by authenticated users" ON products;
  
  -- Create new policies
  CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (true);
    
  CREATE POLICY "Products can be inserted by authenticated users" ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
  CREATE POLICY "Products can be updated by authenticated users" ON products
    FOR UPDATE USING (auth.role() = 'authenticated');
    
  CREATE POLICY "Products can be deleted by authenticated users" ON products
    FOR DELETE USING (auth.role() = 'authenticated');
END $$;

-- Clear existing products (optional - uncomment if you want to start fresh)
-- DELETE FROM products WHERE is_active = true;

-- =============================================
-- UPLOAD ALL PRODUCTS
-- =============================================

-- Use INSERT ... ON CONFLICT to avoid duplicates
-- This will update existing products with same display_name and category

-- ===== 1. 개업·행사 카테고리 =====

-- 축하화환 (4 products)
INSERT INTO products (base_name, display_name, grade, flower_count, price, category_1, category_2, image_url, description, sort_order, is_active) 
VALUES
  ('축하화환', '100송이 축하화환', '특대', 100, 95000, '개업·행사', '축하화환', '/100송이 축하화환.jpg', '거베라 100송이', 1, true),
  ('축하화환', '80송이 축하화환', '대', 80, 81000, '개업·행사', '축하화환', '/80송이 축하화환.jpg', '거베라 80송이', 2, true),
  ('축하화환', '60송이 축하화환', '기본', 60, 67000, '개업·행사', '축하화환', '/60송이 축하화환.jpg', '거베라 60송이', 3, true),
  ('축하화환', '실속 축하화환', '실속', 40, 55000, '개업·행사', '축하화환', '/실속 축하화환.jpg', '거베라 40-50송이', 4, true)
ON CONFLICT (display_name, category_1, category_2) 
DO UPDATE SET 
  price = EXCLUDED.price,
  grade = EXCLUDED.grade,
  flower_count = EXCLUDED.flower_count,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 개업화분 (4 products)
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) 
VALUES
  ('금전수', '백만장자의 금전수', 97000, '개업·행사', '개업화분', '/백만장자 금전수.jpg', '행운을 부르는 나무', 1, true),
  ('해피트리', '대형 해피트리', 109000, '개업·행사', '개업화분', '/대형 해피트리.jpg', '행복을 부르는 나무', 2, true),
  ('뱅갈고무나무', '1.5m 초대형 뱅갈 고무나무', 148000, '개업·행사', '개업화분', '/뱅갈 고무나무.jpg', '초대형 사이즈', 3, true),
  ('금전수', '탁상용 금전수', 58000, '개업·행사', '개업화분', '/탁상용 금전수.jpg', '탁상용 미니 사이즈', 4, true)
ON CONFLICT (display_name, category_1, category_2) 
DO UPDATE SET 
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 공기정화식물 (1 product)
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) 
VALUES
  ('아레카야자', '아레카야자', 97000, '개업·행사', '공기정화식물', '/아레카야자.jpg', '공기정화 식물', 1, true)
ON CONFLICT (display_name, category_1, category_2) 
DO UPDATE SET 
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ===== 2. 결혼식 카테고리 =====

-- 축하화환 (4 products - same as 개업 but different category)
INSERT INTO products (base_name, display_name, grade, flower_count, price, category_1, category_2, image_url, description, sort_order, is_active) 
VALUES
  ('축하화환', '100송이 축하화환', '특대', 100, 95000, '결혼식', '축하화환', '/100송이 축하화환.jpg', '거베라 100송이', 1, true),
  ('축하화환', '80송이 축하화환', '대', 80, 81000, '결혼식', '축하화환', '/80송이 축하화환.jpg', '거베라 80송이', 2, true),
  ('축하화환', '60송이 축하화환', '기본', 60, 67000, '결혼식', '축하화환', '/60송이 축하화환.jpg', '거베라 60송이', 3, true),
  ('축하화환', '실속 축하화환', '실속', 40, 55000, '결혼식', '축하화환', '/실속 축하화환.jpg', '거베라 40-50송이', 4, true)
ON CONFLICT (display_name, category_1, category_2) 
DO UPDATE SET 
  price = EXCLUDED.price,
  grade = EXCLUDED.grade,
  flower_count = EXCLUDED.flower_count,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 꽃다발 (2 products)
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) 
VALUES
  ('꽃다발', '꽃다발', 60000, '결혼식', '꽃다발', '/꽃다발.jpg', '계절 꽃다발', 1, true),
  ('꽃다발', '대형꽃다발', 150000, '결혼식', '꽃다발', '/프리미엄 꽃다발.jpg', '프리미엄 대형 꽃다발', 2, true)
ON CONFLICT (display_name, category_1, category_2) 
DO UPDATE SET 
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 꽃바구니 (1 product)
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) 
VALUES
  ('꽃바구니', '꽃바구니', 80000, '결혼식', '꽃바구니', '/꽃바구니.jpg', '다양한 꽃 바구니', 1, true)
ON CONFLICT (display_name, category_1, category_2) 
DO UPDATE SET 
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ===== 3. 장례식 카테고리 =====

-- 근조화환 (4 products)
INSERT INTO products (base_name, display_name, grade, flower_count, price, category_1, category_2, image_url, description, sort_order, is_active) 
VALUES
  ('근조화환', '100송이 근조화환', '특대', 100, 95000, '장례식', '근조화환', '/100송이 근조화환.jpg', '흰 국화 100송이', 1, true),
  ('근조화환', '80송이 근조화환', '대', 80, 81000, '장례식', '근조화환', '/80송이 근조화환.jpg', '흰 국화 80송이', 2, true),
  ('근조화환', '60송이 근조화환', '기본', 60, 67000, '장례식', '근조화환', '/60송이 근조화환.jpg', '흰 국화 60송이', 3, true),
  ('근조화환', '실속 근조화환', '실속', 40, 55000, '장례식', '근조화환', '/실속 근조화환.jpg', '흰 국화 40송이', 4, true)
ON CONFLICT (display_name, category_1, category_2) 
DO UPDATE SET 
  price = EXCLUDED.price,
  grade = EXCLUDED.grade,
  flower_count = EXCLUDED.flower_count,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 근조장구 (2 products)
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) 
VALUES
  ('근조장구', '근조장구 2단', 120000, '장례식', '근조장구', '/근조장구 2단.jpg', '2단 스탠드', 1, true),
  ('근조장구', '근조장구 1단', 100000, '장례식', '근조장구', '/근조장구 1단.jpg', '1단 스탠드', 2, true)
ON CONFLICT (display_name, category_1, category_2) 
DO UPDATE SET 
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 근조꽃바구니 (1 product)
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) 
VALUES
  ('근조꽃바구니', '근조꽃바구니', 55000, '장례식', '근조꽃바구니', '/근조꽃바구니.jpg', '흰색 꽃 바구니', 1, true)
ON CONFLICT (display_name, category_1, category_2) 
DO UPDATE SET 
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ===== 4. 승진·기념일 카테고리 =====

-- 호접란 (2 products)
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) 
VALUES
  ('호접란', '황금 호접란 (금공주)', 86000, '승진·기념일', '호접란', '/주황 호접란.jpg', '행운과 부귀영화', 1, true),
  ('호접란', '그라데이션 호접란', 86000, '승진·기념일', '호접란', '/호접란.jpg', '우아한 그라데이션', 2, true)
ON CONFLICT (display_name, category_1, category_2) 
DO UPDATE SET 
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 탁상용화분 (1 product)
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) 
VALUES
  ('금전수', '탁상용 금전수', 58000, '승진·기념일', '탁상용화분', '/탁상용 금전수.jpg', '미니 금전수', 1, true)
ON CONFLICT (display_name, category_1, category_2) 
DO UPDATE SET 
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 특별한선물 (1 product)
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) 
VALUES
  ('만천홍', '만천홍', 86000, '승진·기념일', '특별한선물', '/만천홍.jpg', '번영과 성공', 1, true)
ON CONFLICT (display_name, category_1, category_2) 
DO UPDATE SET 
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check total products uploaded
SELECT 
  'Total Products Uploaded' as metric,
  COUNT(*) as count
FROM products 
WHERE is_active = true;

-- Check products by category
SELECT 
  category_1,
  category_2,
  COUNT(*) as product_count,
  STRING_AGG(display_name, ', ' ORDER BY sort_order) as products
FROM products
WHERE is_active = true
GROUP BY category_1, category_2
ORDER BY category_1, category_2;

-- Check if all categories have products
SELECT 
  category_1,
  COUNT(DISTINCT category_2) as subcategory_count,
  COUNT(*) as total_products,
  MIN(price) as min_price,
  MAX(price) as max_price,
  ROUND(AVG(price)) as avg_price
FROM products
WHERE is_active = true
GROUP BY category_1
ORDER BY category_1;

-- List all products with details
SELECT 
  category_1,
  category_2,
  display_name,
  price,
  CASE 
    WHEN flower_count IS NOT NULL THEN flower_count || '송이'
    ELSE ''
  END as flowers,
  grade,
  description,
  sort_order
FROM products
WHERE is_active = true
ORDER BY category_1, category_2, sort_order;

-- Success message
SELECT 
  '✅ Products uploaded successfully!' as status,
  'You can now manage these products from the Admin panel' as message;
