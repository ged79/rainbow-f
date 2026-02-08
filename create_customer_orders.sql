-- B2C 주문 테이블 생성
CREATE TABLE IF NOT EXISTS customer_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- 고객 정보
  customer_name VARCHAR(50) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(100),
  
  -- 수령인 정보
  recipient_name VARCHAR(50),
  recipient_phone VARCHAR(20),
  recipient_address JSONB,
  
  -- Homepage 상품 정보 (원본 보존)
  product_id VARCHAR(50),
  product_name VARCHAR(100),
  product_image VARCHAR(500),
  product_description TEXT,
  original_price INTEGER,
  quantity INTEGER DEFAULT 1,
  
  -- Client 카테고리 매핑
  mapped_category VARCHAR(50), -- ProductType
  mapped_price INTEGER,
  
  -- 배송 정보
  delivery_date DATE,
  delivery_time VARCHAR(10),
  ribbon_text TEXT[],
  special_instructions TEXT,
  
  -- 추천/포인트
  referrer_phone VARCHAR(20),
  points_earned INTEGER,
  coupon_used VARCHAR(20),
  discount_amount INTEGER DEFAULT 0,
  
  -- 결제
  total_amount INTEGER,
  payment_status VARCHAR(20) DEFAULT 'pending',
  
  -- 배정 관련
  status VARCHAR(20) DEFAULT 'pending', -- pending/assigned/completed
  assigned_store_id UUID REFERENCES stores(id),
  assigned_at TIMESTAMP,
  linked_order_id UUID, -- orders 테이블 연결
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_customer_orders_status ON customer_orders(status);
CREATE INDEX idx_customer_orders_phone ON customer_orders(customer_phone);
CREATE INDEX idx_customer_orders_created ON customer_orders(created_at DESC);

-- RLS 정책
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;

-- Admin만 접근 가능
CREATE POLICY "Admin can view all customer orders" ON customer_orders
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_users WHERE role IN ('super_admin', 'admin')
    )
  );