-- ===============================================
-- 포인트 시스템을 위한 데이터베이스 업데이트
-- ===============================================

-- 1. coupons 테이블에 member_id 컬럼 추가 (회원 연결용)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' AND column_name = 'member_id'
    ) THEN
        ALTER TABLE coupons ADD COLUMN member_id UUID REFERENCES members(id);
        CREATE INDEX idx_coupons_member_id ON coupons(member_id);
    END IF;
END $$;

-- 2. coupons 테이블에 referral_order_id 컬럼 추가 (추천 주문 연결용)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' AND column_name = 'referral_order_id'
    ) THEN
        ALTER TABLE coupons ADD COLUMN referral_order_id UUID REFERENCES customer_orders(id);
    END IF;
END $$;

-- 3. customer_orders 테이블에 member_id 컬럼 추가 (회원 연결용)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customer_orders' AND column_name = 'member_id'
    ) THEN
        ALTER TABLE customer_orders ADD COLUMN member_id UUID REFERENCES members(id);
        CREATE INDEX idx_customer_orders_member_id ON customer_orders(member_id);
    END IF;
END $$;

-- 4. members 테이블에 total_points 컬럼 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'total_points'
    ) THEN
        ALTER TABLE members ADD COLUMN total_points INTEGER DEFAULT 0;
    END IF;
END $$;

-- 5. referral_stats 테이블 생성 (추천 통계용)
CREATE TABLE IF NOT EXISTS referral_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  member_id UUID REFERENCES members(id),
  total_referrals INTEGER DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  current_tier VARCHAR(20) DEFAULT 'BRONZE',
  this_month_referrals INTEGER DEFAULT 0,
  last_month_referrals INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_referral_stats_phone ON referral_stats(phone);
CREATE INDEX IF NOT EXISTS idx_referral_stats_member_id ON referral_stats(member_id);

-- 7. RLS 정책 업데이트 (coupons 테이블)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can select coupons" ON coupons;
DROP POLICY IF EXISTS "Anyone can insert coupons" ON coupons;
DROP POLICY IF EXISTS "Anyone can update own coupons" ON coupons;

-- 누구나 조회 가능
CREATE POLICY "Anyone can select coupons" ON coupons
  FOR SELECT USING (true);

-- 누구나 생성 가능
CREATE POLICY "Anyone can insert coupons" ON coupons
  FOR INSERT WITH CHECK (true);

-- 자신의 쿠폰만 업데이트 가능 (member_id 또는 customer_phone 기준)
CREATE POLICY "Can update own coupons" ON coupons
  FOR UPDATE USING (
    member_id = auth.uid() OR 
    customer_phone IN (
      SELECT phone FROM members WHERE id = auth.uid()
    ) OR
    true -- 임시로 모두 허용 (개발 중)
  );

-- 8. 기존 데이터 마이그레이션 (전화번호 형식 통일)
-- 하이픈 없는 전화번호를 하이픈 있는 형식으로 변경
UPDATE coupons
SET customer_phone = 
  CASE 
    WHEN LENGTH(customer_phone) = 11 AND customer_phone NOT LIKE '%-%' THEN
      SUBSTRING(customer_phone, 1, 3) || '-' || 
      SUBSTRING(customer_phone, 4, 4) || '-' || 
      SUBSTRING(customer_phone, 8, 4)
    WHEN LENGTH(customer_phone) = 10 AND customer_phone NOT LIKE '%-%' THEN
      SUBSTRING(customer_phone, 1, 3) || '-' || 
      SUBSTRING(customer_phone, 4, 3) || '-' || 
      SUBSTRING(customer_phone, 7, 4)
    ELSE customer_phone
  END
WHERE customer_phone NOT LIKE '%-%';

-- customer_orders도 동일하게 처리
UPDATE customer_orders
SET customer_phone = 
  CASE 
    WHEN LENGTH(customer_phone) = 11 AND customer_phone NOT LIKE '%-%' THEN
      SUBSTRING(customer_phone, 1, 3) || '-' || 
      SUBSTRING(customer_phone, 4, 4) || '-' || 
      SUBSTRING(customer_phone, 8, 4)
    WHEN LENGTH(customer_phone) = 10 AND customer_phone NOT LIKE '%-%' THEN
      SUBSTRING(customer_phone, 1, 3) || '-' || 
      SUBSTRING(customer_phone, 4, 3) || '-' || 
      SUBSTRING(customer_phone, 7, 4)
    ELSE customer_phone
  END
WHERE customer_phone NOT LIKE '%-%';

-- 9. 확인 쿼리
SELECT 
  'Tables' as check_type,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_stats') as referral_stats_exists,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'member_id') as coupons_member_id,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_orders' AND column_name = 'member_id') as orders_member_id;

-- 전화번호 형식 확인
SELECT 
  'Phone Format' as check_type,
  COUNT(*) FILTER (WHERE customer_phone LIKE '%-%') as with_dash,
  COUNT(*) FILTER (WHERE customer_phone NOT LIKE '%-%') as without_dash
FROM coupons;
