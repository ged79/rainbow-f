-- =============================================
-- Upload All Products from Category Pages to Database
-- Date: 2025-01-23
-- Description: Populate products table with all static products
-- =============================================

-- Clear existing products (optional - comment out if you want to keep existing)
-- DELETE FROM products WHERE is_active = true;

-- =============================================
-- 1. 개업·행사 카테고리
-- =============================================

-- 축하화환
INSERT INTO products (base_name, display_name, grade, flower_count, price, category_1, category_2, image_url, description, sort_order, is_active) VALUES
('축하화환', '100송이 축하화환', '특대', 100, 95000, '개업·행사', '축하화환', '/100송이 축하화환.jpg', '거베라 100송이', 1, true),
('축하화환', '80송이 축하화환', '대', 80, 81000, '개업·행사', '축하화환', '/80송이 축하화환.jpg', '거베라 80송이', 2, true),
('축하화환', '60송이 축하화환', '기본', 60, 67000, '개업·행사', '축하화환', '/60송이 축하화환.jpg', '거베라 60송이', 3, true),
('축하화환', '실속 축하화환', '실속', 40, 55000, '개업·행사', '축하화환', '/실속 축하화환.jpg', '거베라 40-50송이', 4, true);

-- 개업화분
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) VALUES
('금전수', '백만장자의 금전수', 97000, '개업·행사', '개업화분', '/백만장자 금전수.jpg', '행운을 부르는 나무', 1, true),
('해피트리', '대형 해피트리', 109000, '개업·행사', '개업화분', '/대형 해피트리.jpg', '행복을 부르는 나무', 2, true),
('뱅갈고무나무', '1.5m 초대형 뱅갈 고무나무', 148000, '개업·행사', '개업화분', '/뱅갈 고무나무.jpg', '초대형 사이즈', 3, true),
('금전수', '탁상용 금전수', 58000, '개업·행사', '개업화분', '/탁상용 금전수.jpg', '탁상용 미니 사이즈', 4, true);

-- 공기정화식물
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) VALUES
('아레카야자', '아레카야자', 97000, '개업·행사', '공기정화식물', '/아레카야자.jpg', '공기정화 식물', 1, true);

-- =============================================
-- 2. 결혼식 카테고리
-- =============================================

-- 축하화환 (결혼식용)
INSERT INTO products (base_name, display_name, grade, flower_count, price, category_1, category_2, image_url, description, sort_order, is_active) VALUES
('축하화환', '100송이 축하화환', '특대', 100, 95000, '결혼식', '축하화환', '/100송이 축하화환.jpg', '거베라 100송이', 1, true),
('축하화환', '80송이 축하화환', '대', 80, 81000, '결혼식', '축하화환', '/80송이 축하화환.jpg', '거베라 80송이', 2, true),
('축하화환', '60송이 축하화환', '기본', 60, 67000, '결혼식', '축하화환', '/60송이 축하화환.jpg', '거베라 60송이', 3, true),
('축하화환', '실속 축하화환', '실속', 40, 55000, '결혼식', '축하화환', '/실속 축하화환.jpg', '거베라 40-50송이', 4, true);

-- 꽃다발
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) VALUES
('꽃다발', '꽃다발', 60000, '결혼식', '꽃다발', '/꽃다발.jpg', '계절 꽃다발', 1, true),
('꽃다발', '대형꽃다발', 150000, '결혼식', '꽃다발', '/프리미엄 꽃다발.jpg', '프리미엄 대형 꽃다발', 2, true);

-- 꽃바구니
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) VALUES
('꽃바구니', '꽃바구니', 80000, '결혼식', '꽃바구니', '/꽃바구니.jpg', '다양한 꽃 바구니', 1, true);

-- =============================================
-- 3. 장례식 카테고리
-- =============================================

-- 근조화환
INSERT INTO products (base_name, display_name, grade, flower_count, price, category_1, category_2, image_url, description, sort_order, is_active) VALUES
('근조화환', '100송이 근조화환', '특대', 100, 95000, '장례식', '근조화환', '/100송이 근조화환.jpg', '흰 국화 100송이', 1, true),
('근조화환', '80송이 근조화환', '대', 80, 81000, '장례식', '근조화환', '/80송이 근조화환.jpg', '흰 국화 80송이', 2, true),
('근조화환', '60송이 근조화환', '기본', 60, 67000, '장례식', '근조화환', '/60송이 근조화환.jpg', '흰 국화 60송이', 3, true),
('근조화환', '실속 근조화환', '실속', 40, 55000, '장례식', '근조화환', '/실속 근조화환.jpg', '흰 국화 40송이', 4, true);

-- 근조장구
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) VALUES
('근조장구', '근조장구 2단', 120000, '장례식', '근조장구', '/근조장구 2단.jpg', '2단 스탠드', 1, true),
('근조장구', '근조장구 1단', 100000, '장례식', '근조장구', '/근조장구 1단.jpg', '1단 스탠드', 2, true);

-- 근조꽃바구니
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) VALUES
('근조꽃바구니', '근조꽃바구니', 55000, '장례식', '근조꽃바구니', '/근조꽃바구니.jpg', '흰색 꽃 바구니', 1, true);

-- =============================================
-- 4. 승진·기념일 카테고리
-- =============================================

-- 호접란
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) VALUES
('호접란', '황금 호접란 (금공주)', 86000, '승진·기념일', '호접란', '/주황 호접란.jpg', '행운과 부귀영화', 1, true),
('호접란', '그라데이션 호접란', 86000, '승진·기념일', '호접란', '/호접란.jpg', '우아한 그라데이션', 2, true);

-- 탁상용화분
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) VALUES
('금전수', '탁상용 금전수', 58000, '승진·기념일', '탁상용화분', '/탁상용 금전수.jpg', '미니 금전수', 1, true);

-- 특별한선물
INSERT INTO products (base_name, display_name, price, category_1, category_2, image_url, description, sort_order, is_active) VALUES
('만천홍', '만천홍', 86000, '승진·기념일', '특별한선물', '/만천홍.jpg', '번영과 성공', 1, true);

-- =============================================
-- Verify upload
-- =============================================
SELECT 
  category_1,
  category_2,
  COUNT(*) as product_count
FROM products
WHERE is_active = true
GROUP BY category_1, category_2
ORDER BY category_1, category_2;

-- Total products
SELECT COUNT(*) as total_products FROM products WHERE is_active = true;
