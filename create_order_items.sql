-- order_items 테이블 생성
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL,
  product_id VARCHAR(50),
  product_name VARCHAR(100),
  product_image VARCHAR(500),
  price INTEGER,
  quantity INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS 비활성화
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;