-- =============================================
-- 테스트용 샘플 상품 데이터 생성
-- =============================================

-- 기존 데이터 백업 (안전을 위해)
CREATE TABLE IF NOT EXISTS products_backup_before_sample AS 
SELECT * FROM products;

-- 샘플 데이터 삽입
INSERT INTO products (
  base_name,
  display_name,
  category_1,
  category_2,
  price,
  image_url,
  description,
  sort_order,
  is_active
) VALUES 
-- 개업·행사 카테고리
('축하화환', '100송이 축하화환', '개업·행사', '축하화환', 60000, '/placeholder.jpg', '화려한 100송이 축하화환', 1, true),
('축하화환', '150송이 특대 축하화환', '개업·행사', '축하화환', 80000, '/placeholder.jpg', '특별한 날을 위한 특대 화환', 2, true),
('개업화분', '금전수 개업화분', '개업·행사', '개업화분', 50000, '/placeholder.jpg', '번창을 기원하는 금전수', 3, true),
('개업화분', '행운목 개업화분', '개업·행사', '개업화분', 45000, '/placeholder.jpg', '행운을 부르는 행운목', 4, true),
('공기정화식물', '스투키 화분', '개업·행사', '공기정화식물', 35000, '/placeholder.jpg', '공기정화 효과가 좋은 스투키', 5, true),

-- 결혼식 카테고리
('축하화환', '웨딩 축하화환', '결혼식', '축하화환', 70000, '/placeholder.jpg', '순백의 웨딩 화환', 1, true),
('꽃다발', '신부 부케', '결혼식', '꽃다발', 100000, '/placeholder.jpg', '아름다운 신부 부케', 2, true),
('꽃다발', '축하 꽃다발', '결혼식', '꽃다발', 50000, '/placeholder.jpg', '축하 꽃다발', 3, true),
('꽃바구니', '웨딩 꽃바구니', '결혼식', '꽃바구니', 60000, '/placeholder.jpg', '화사한 꽃바구니', 4, true),

-- 장례식 카테고리
('근조화환', '근조화환 3단', '장례식', '근조화환', 50000, '/placeholder.jpg', '정중한 근조화환', 1, true),
('근조화환', '근조화환 특대', '장례식', '근조화환', 70000, '/placeholder.jpg', '특대 근조화환', 2, true),
('근조장구', '근조 꽃바구니', '장례식', '근조장구', 40000, '/placeholder.jpg', '조의를 표하는 꽃바구니', 3, true),
('근조꽃바구니', '흰국화 바구니', '장례식', '근조꽃바구니', 45000, '/placeholder.jpg', '흰국화 근조바구니', 4, true),

-- 승진·기념일 카테고리
('호접란', '호접란 3대', '승진·기념일', '호접란', 80000, '/placeholder.jpg', '고급 호접란', 1, true),
('호접란', '호접란 5대', '승진·기념일', '호접란', 120000, '/placeholder.jpg', '프리미엄 호접란', 2, true),
('탁상용화분', '선인장 세트', '승진·기념일', '탁상용화분', 25000, '/placeholder.jpg', '귀여운 선인장 세트', 3, true),
('특별한선물', '프리저브드 플라워', '승진·기념일', '특별한선물', 90000, '/placeholder.jpg', '오래가는 프리저브드 플라워', 4, true)
ON CONFLICT DO NOTHING;

-- 삽입된 데이터 확인
SELECT 
  category_1,
  category_2,
  COUNT(*) as count
FROM products
WHERE is_active = true
GROUP BY category_1, category_2
ORDER BY category_1, category_2;
