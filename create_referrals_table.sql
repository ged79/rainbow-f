-- referrals 테이블이 없다면 생성
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