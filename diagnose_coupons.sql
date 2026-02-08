-- =============================================
-- 쿠폰 데이터 진단 쿼리
-- =============================================

-- 1. 전체 쿠폰 현황 확인
SELECT 
  COUNT(*) as total_coupons,
  COUNT(DISTINCT customer_phone) as unique_customers,
  COUNT(CASE WHEN used_at IS NULL THEN 1 END) as unused_coupons,
  COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) as used_coupons,
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_coupons
FROM coupons;

-- 2. 타입별 쿠폰 분포
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM coupons
WHERE used_at IS NULL AND expires_at >= NOW()
GROUP BY type
ORDER BY count DESC;

-- 3. 전화번호 형식 문제 확인
SELECT 
  customer_phone,
  COUNT(*) as coupon_count,
  SUM(amount) as total_points,
  STRING_AGG(type, ', ') as coupon_types,
  STRING_AGG(code, ', ') as coupon_codes
FROM coupons
WHERE used_at IS NULL AND expires_at >= NOW()
GROUP BY customer_phone
HAVING COUNT(*) > 1
ORDER BY coupon_count DESC
LIMIT 10;

-- 4. 중복 가능성 확인 (같은 사람, 다른 전화번호 형식)
WITH phone_pairs AS (
  SELECT 
    c1.customer_phone as phone1,
    c2.customer_phone as phone2,
    c1.amount,
    c1.type,
    c1.created_at
  FROM coupons c1
  JOIN coupons c2 ON 
    REPLACE(c1.customer_phone, '-', '') = REPLACE(c2.customer_phone, '-', '')
    AND c1.customer_phone != c2.customer_phone
    AND c1.used_at IS NULL
    AND c2.used_at IS NULL
)
SELECT * FROM phone_pairs
ORDER BY created_at DESC;

-- 5. 최근 생성된 쿠폰 확인
SELECT 
  id,
  code,
  customer_phone,
  amount,
  type,
  created_at,
  expires_at,
  used_at
FROM coupons
ORDER BY created_at DESC
LIMIT 20;

-- 6. 특정 전화번호의 모든 쿠폰 (예시)
-- 실제 전화번호로 교체해서 사용
SELECT * FROM coupons 
WHERE customer_phone IN ('010-1234-5678', '01012345678')
  OR REPLACE(customer_phone, '-', '') = '01012345678'
ORDER BY created_at DESC;

-- 7. 회원가입 쿠폰 중복 확인
SELECT 
  customer_phone,
  COUNT(*) as welcome_coupon_count
FROM coupons
WHERE type = 'welcome'
  AND used_at IS NULL
GROUP BY customer_phone
HAVING COUNT(*) > 1;

-- 8. 같은 주문에 대한 중복 포인트 확인
SELECT 
  order_id,
  COUNT(*) as coupon_count,
  SUM(amount) as total_amount,
  STRING_AGG(type, ', ') as types
FROM coupons
WHERE order_id IS NOT NULL
GROUP BY order_id
HAVING COUNT(*) > 1;
