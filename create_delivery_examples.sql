-- 배송 사례 테이블 생성
CREATE TABLE IF NOT EXISTS delivery_examples (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_name VARCHAR(255),
  category VARCHAR(100),
  image_url TEXT,
  delivery_region VARCHAR(100), -- 예: 서울 강남구
  delivery_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 샘플 데이터
INSERT INTO delivery_examples (product_name, category, image_url, delivery_region, delivery_date) VALUES
('120송이 근조화환', '장례식', '/실제배송_근조120.jpg', '서울 강남구', '2024-01-08'),
('100송이 근조화환', '장례식', '/실제배송_근조100.jpg', '경기 성남시', '2024-01-07'),
('5단 개업화환', '개업·행사', '/실제배송_개업5단.jpg', '서울 서초구', '2024-01-09'),
('4단 축하화환', '결혼식', '/실제배송_결혼4단.jpg', '인천 남동구', '2024-01-06');