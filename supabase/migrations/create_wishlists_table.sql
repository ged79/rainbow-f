-- wishlists 테이블 생성
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255),
  product_image TEXT,
  product_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 중복 방지: 같은 사용자가 같은 상품을 여러 번 찜하지 못하도록
  UNIQUE(customer_phone, product_id)
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX idx_wishlists_customer ON wishlists(customer_phone, customer_name);
CREATE INDEX idx_wishlists_created ON wishlists(created_at DESC);

-- RLS 정책 (필요한 경우)
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 자신의 찜 목록만 조회/수정할 수 있도록 (선택사항)
-- CREATE POLICY "Users can view own wishlists" ON wishlists
--   FOR SELECT USING (true);
-- 
-- CREATE POLICY "Users can insert own wishlists" ON wishlists
--   FOR INSERT WITH CHECK (true);
-- 
-- CREATE POLICY "Users can delete own wishlists" ON wishlists
--   FOR DELETE USING (true);
