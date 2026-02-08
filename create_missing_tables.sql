-- 필요한 테이블들 확인 및 생성

-- 1. coupons 테이블
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  customer_phone VARCHAR(20),
  amount INTEGER,
  type VARCHAR(20),
  expires_at TIMESTAMP,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. order_items 테이블  
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

-- 3. referrals 테이블
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL,
  buyer_phone VARCHAR(20),
  referrer_phone VARCHAR(20),
  buyer_points INTEGER,
  referrer_points INTEGER,
  order_amount INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);