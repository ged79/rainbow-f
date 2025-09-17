-- 쿠폰 테이블 생성
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  amount INTEGER NOT NULL,
  type VARCHAR(20) DEFAULT 'purchase', -- 'purchase' or 'referral'
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  used_order_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 추천 관계 테이블 생성
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL,
  buyer_phone VARCHAR(20) NOT NULL,
  referrer_phone VARCHAR(20) NOT NULL,
  buyer_points INTEGER NOT NULL,
  referrer_points INTEGER NOT NULL,
  order_amount INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_coupons_phone ON coupons(customer_phone);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_phone);
CREATE INDEX IF NOT EXISTS idx_referrals_buyer ON referrals(buyer_phone);
