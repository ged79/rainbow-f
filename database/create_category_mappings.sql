-- 카테고리 매핑 테이블 생성
CREATE TABLE IF NOT EXISTS category_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_category_2 VARCHAR(100) NOT NULL UNIQUE,
  client_category VARCHAR(50) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 초기 매핑 데이터
INSERT INTO category_mappings (admin_category_2, client_category, display_order) VALUES
-- 화환류
('축하화환', '축하화환', 1),
('근조화환', '근조화환', 2),
('근조장구', '근조화환', 3),
('근조꽃바구니', '근조화환', 4),
-- 화분·난류
('개업화분', '화분·난', 10),
('공기정화식물', '화분·난', 11),
('호접란', '화분·난', 12),
('탁상용화분', '화분·난', 13),
('특별한선물', '화분·난', 14),
-- 꽃상품
('꽃다발', '꽃상품', 20),
('꽃바구니', '꽃상품', 21)
ON CONFLICT (admin_category_2) DO UPDATE
SET client_category = EXCLUDED.client_category,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- 인덱스
CREATE INDEX idx_category_mappings_admin ON category_mappings(admin_category_2);
CREATE INDEX idx_category_mappings_client ON category_mappings(client_category);
