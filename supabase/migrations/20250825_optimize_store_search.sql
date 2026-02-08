-- =============================================
-- Store 검색 성능 최적화
-- 2025-08-25
-- 
-- 목적: JSONB 검색을 일반 컬럼 검색으로 변경
-- 방법: 기존 데이터 유지하면서 검색용 컬럼 추가
-- =============================================

-- 1. 검색용 컬럼 추가 (기존 JSONB 유지)
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS sido VARCHAR(50),
ADD COLUMN IF NOT EXISTS sigungu VARCHAR(100),
ADD COLUMN IF NOT EXISTS dong VARCHAR(100);

-- 2. 기존 JSONB 데이터에서 컬럼 채우기
UPDATE stores 
SET 
  sido = TRIM(address->>'sido'),
  sigungu = TRIM(address->>'sigungu'),
  dong = TRIM(address->>'dong')
WHERE address IS NOT NULL 
  AND address != '{}'::jsonb;

-- 3. 복합 인덱스 생성 (가장 자주 검색하는 패턴)
CREATE INDEX IF NOT EXISTS idx_stores_location ON stores(sido, sigungu);
CREATE INDEX IF NOT EXISTS idx_stores_sido ON stores(sido);
CREATE INDEX IF NOT EXISTS idx_stores_sigungu ON stores(sigungu);

-- 4. service_areas 업데이트 (sido+sigungu 조합)
UPDATE stores 
SET service_areas = ARRAY[sido || ' ' || sigungu]
WHERE sido IS NOT NULL 
  AND sigungu IS NOT NULL
  AND (service_areas IS NULL OR service_areas = '{}');

-- 5. 트리거 생성: address JSONB 업데이트 시 컬럼 자동 동기화
CREATE OR REPLACE FUNCTION sync_store_address_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- JSONB address가 변경되면 검색 컬럼도 업데이트
  IF NEW.address IS NOT NULL AND NEW.address != '{}'::jsonb THEN
    NEW.sido := TRIM(NEW.address->>'sido');
    NEW.sigungu := TRIM(NEW.address->>'sigungu');
    NEW.dong := TRIM(NEW.address->>'dong');
    
    -- service_areas도 업데이트
    IF NEW.sido IS NOT NULL AND NEW.sigungu IS NOT NULL THEN
      NEW.service_areas := array_append(
        COALESCE(NEW.service_areas, '{}'), 
        NEW.sido || ' ' || NEW.sigungu
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 트리거 연결
DROP TRIGGER IF EXISTS trigger_sync_store_address ON stores;
CREATE TRIGGER trigger_sync_store_address
  BEFORE INSERT OR UPDATE OF address ON stores
  FOR EACH ROW
  EXECUTE FUNCTION sync_store_address_columns();

-- 7. 통계 업데이트 (쿼리 플래너 최적화)
ANALYZE stores;

-- 8. 검색 성능 테스트 쿼리
-- 이전 (느림):
-- SELECT * FROM stores WHERE address->>'sido' ILIKE '%서울%';

-- 이후 (빠름):
-- SELECT * FROM stores WHERE sido = '서울특별시';
-- SELECT * FROM stores WHERE sido = '서울특별시' AND sigungu = '강남구';

-- 9. 검색 함수 생성 (일관된 검색 로직)
CREATE OR REPLACE FUNCTION search_stores_by_location(
  p_sido VARCHAR DEFAULT NULL,
  p_sigungu VARCHAR DEFAULT NULL,
  p_dong VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  business_name VARCHAR,
  owner_name VARCHAR,
  phone VARCHAR,
  sido VARCHAR,
  sigungu VARCHAR,
  dong VARCHAR,
  is_open BOOLEAN,
  rating DECIMAL,
  address JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.business_name,
    s.owner_name,
    s.phone,
    s.sido,
    s.sigungu,
    s.dong,
    s.is_open,
    s.rating,
    s.address
  FROM stores s
  WHERE s.status = 'active'
    AND (p_sido IS NULL OR s.sido = p_sido)
    AND (p_sigungu IS NULL OR s.sigungu = p_sigungu)
    AND (p_dong IS NULL OR s.dong = p_dong)
  ORDER BY 
    s.is_open DESC,  -- 영업중인 가맹점 우선
    s.rating DESC,   -- 평점 높은 순
    s.total_orders_received DESC  -- 주문 많은 순
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 권한 부여
GRANT EXECUTE ON FUNCTION search_stores_by_location TO authenticated;

-- 10. 데이터 검증
SELECT 
  COUNT(*) as total_stores,
  COUNT(CASE WHEN sido IS NOT NULL THEN 1 END) as stores_with_sido,
  COUNT(CASE WHEN sigungu IS NOT NULL THEN 1 END) as stores_with_sigungu,
  COUNT(DISTINCT sido) as unique_sido,
  COUNT(DISTINCT sigungu) as unique_sigungu
FROM stores;

-- 주요 지역별 가맹점 수
SELECT 
  sido,
  sigungu,
  COUNT(*) as store_count
FROM stores
WHERE sido IS NOT NULL
GROUP BY sido, sigungu
ORDER BY store_count DESC
LIMIT 20;
