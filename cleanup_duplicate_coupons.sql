-- =============================================
-- 쿠폰 데이터 정리 및 중복 제거
-- =============================================

-- 1단계: 백업 테이블 생성
CREATE TABLE IF NOT EXISTS coupons_backup AS 
SELECT * FROM coupons;

-- 2단계: 전화번호 형식 통일 (하이픈 포함으로)
UPDATE coupons
SET customer_phone = 
  CASE 
    WHEN LENGTH(REPLACE(customer_phone, '-', '')) = 11 AND customer_phone NOT LIKE '%-%' THEN
      SUBSTRING(REPLACE(customer_phone, '-', ''), 1, 3) || '-' || 
      SUBSTRING(REPLACE(customer_phone, '-', ''), 4, 4) || '-' || 
      SUBSTRING(REPLACE(customer_phone, '-', ''), 8, 4)
    WHEN LENGTH(REPLACE(customer_phone, '-', '')) = 10 AND customer_phone NOT LIKE '%-%' THEN
      SUBSTRING(REPLACE(customer_phone, '-', ''), 1, 3) || '-' || 
      SUBSTRING(REPLACE(customer_phone, '-', ''), 4, 3) || '-' || 
      SUBSTRING(REPLACE(customer_phone, '-', ''), 7, 4)
    ELSE customer_phone
  END
WHERE customer_phone IS NOT NULL;

-- 3단계: 중복 쿠폰 확인 (같은 사람, 같은 타입, 같은 금액)
WITH duplicates AS (
  SELECT 
    customer_phone,
    type,
    amount,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY created_at) as duplicate_ids
  FROM coupons
  WHERE used_at IS NULL
  GROUP BY customer_phone, type, amount
  HAVING COUNT(*) > 1
)
SELECT * FROM duplicates;

-- 4단계: 중복 제거 (최초 쿠폰만 유지)
-- 주의: 실행 전 반드시 확인!
/*
WITH duplicates_to_delete AS (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY customer_phone, type, amount, DATE(created_at)
        ORDER BY created_at ASC
      ) as rn
    FROM coupons
    WHERE used_at IS NULL
  ) t
  WHERE rn > 1
)
DELETE FROM coupons
WHERE id IN (SELECT id FROM duplicates_to_delete);
*/

-- 5단계: 회원가입 쿠폰 중복 제거 (한 사람당 1개만)
-- 가장 최근 것만 유지
/*
WITH welcome_duplicates AS (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY customer_phone
        ORDER BY created_at DESC
      ) as rn
    FROM coupons
    WHERE type = 'welcome' AND used_at IS NULL
  ) t
  WHERE rn > 1
)
DELETE FROM coupons
WHERE id IN (SELECT id FROM welcome_duplicates);
*/

-- 6단계: 테스트 데이터 제거 (필요시)
-- 테스트 전화번호 패턴 확인
SELECT 
  customer_phone,
  COUNT(*) as coupon_count,
  SUM(amount) as total_amount
FROM coupons
WHERE used_at IS NULL
  AND expires_at >= NOW()
  AND (
    customer_phone LIKE '010-1234-%' OR
    customer_phone LIKE '010-0000-%' OR
    customer_phone LIKE '010-1111-%' OR
    customer_phone LIKE '010-9999-%'
  )
GROUP BY customer_phone;

-- 7단계: 정리 후 통계
SELECT 
  'After Cleanup' as status,
  COUNT(DISTINCT customer_phone) as unique_customers,
  COUNT(*) as total_coupons,
  SUM(amount) as total_points,
  AVG(amount) as avg_points
FROM coupons
WHERE used_at IS NULL AND expires_at >= NOW();

-- 8단계: 각 사용자별 최종 포인트 확인
SELECT 
  customer_phone,
  COUNT(*) as coupon_count,
  SUM(amount) as total_points,
  STRING_AGG(type || '(' || amount || '원)', ', ' ORDER BY created_at DESC) as coupon_details
FROM coupons
WHERE used_at IS NULL AND expires_at >= NOW()
GROUP BY customer_phone
ORDER BY total_points DESC
LIMIT 20;
