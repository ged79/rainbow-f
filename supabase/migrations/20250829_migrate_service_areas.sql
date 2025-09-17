-- =============================================
-- Migration: Standardize delivery area data
-- Date: 2025-08-29
-- Purpose: 
--   1. Migrate old service_areas to store_delivery_areas
--   2. Normalize existing area names
-- =============================================

-- Function to normalize area names
CREATE OR REPLACE FUNCTION normalize_area_name(area_text TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := area_text;
  
  -- Normalize common sido abbreviations
  normalized := REPLACE(normalized, '서울시', '서울특별시');
  normalized := REPLACE(normalized, '서울', '서울특별시');
  normalized := REPLACE(normalized, '부산시', '부산광역시');
  normalized := REPLACE(normalized, '부산', '부산광역시');
  normalized := REPLACE(normalized, '대구시', '대구광역시');
  normalized := REPLACE(normalized, '대구', '대구광역시');
  normalized := REPLACE(normalized, '인천시', '인천광역시');
  normalized := REPLACE(normalized, '인천', '인천광역시');
  normalized := REPLACE(normalized, '광주시', '광주광역시');
  normalized := REPLACE(normalized, '광주', '광주광역시');
  normalized := REPLACE(normalized, '대전시', '대전광역시');
  normalized := REPLACE(normalized, '대전', '대전광역시');
  normalized := REPLACE(normalized, '울산시', '울산광역시');
  normalized := REPLACE(normalized, '울산', '울산광역시');
  normalized := REPLACE(normalized, '세종시', '세종특별자치시');
  normalized := REPLACE(normalized, '세종', '세종특별자치시');
  normalized := REPLACE(normalized, '경기', '경기도');
  normalized := REPLACE(normalized, '강원', '강원도');
  normalized := REPLACE(normalized, '충북', '충청북도');
  normalized := REPLACE(normalized, '충남', '충청남도');
  normalized := REPLACE(normalized, '전북', '전라북도');
  normalized := REPLACE(normalized, '전남', '전라남도');
  normalized := REPLACE(normalized, '경북', '경상북도');
  normalized := REPLACE(normalized, '경남', '경상남도');
  normalized := REPLACE(normalized, '제주', '제주특별자치도');
  
  RETURN TRIM(normalized);
END;
$$ LANGUAGE plpgsql;

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS store_delivery_areas_backup AS 
SELECT * FROM store_delivery_areas;

-- Step 2: Migrate service_areas to store_delivery_areas if not exists
DO $$
DECLARE
  store_record RECORD;
  area TEXT;
  normalized_area TEXT;
BEGIN
  -- Loop through stores that have service_areas but no delivery areas
  FOR store_record IN 
    SELECT s.* 
    FROM stores s
    WHERE s.service_areas IS NOT NULL 
      AND array_length(s.service_areas, 1) > 0
      AND NOT EXISTS (
        SELECT 1 FROM store_delivery_areas da 
        WHERE da.store_id = s.id
      )
  LOOP
    -- For each service area in the old format
    FOREACH area IN ARRAY store_record.service_areas
    LOOP
      normalized_area := normalize_area_name(area);
      
      -- Insert if not exists
      INSERT INTO store_delivery_areas (store_id, area_name, min_amount)
      VALUES (store_record.id, normalized_area, 50000)
      ON CONFLICT (store_id, area_name) DO NOTHING;
      
      RAISE NOTICE 'Migrated area % -> % for store %', 
        area, normalized_area, store_record.business_name;
    END LOOP;
  END LOOP;
END $$;

-- Step 3: Normalize existing delivery area names
UPDATE store_delivery_areas
SET area_name = normalize_area_name(area_name),
    updated_at = NOW()
WHERE area_name != normalize_area_name(area_name);

-- Step 4: Update product pricing area names to match
UPDATE store_area_product_pricing
SET area_name = normalize_area_name(area_name)
WHERE area_name != normalize_area_name(area_name);

-- Step 5: Add index for performance
CREATE INDEX IF NOT EXISTS idx_delivery_areas_normalized 
ON store_delivery_areas(area_name);

-- Step 6: Report migration results
SELECT 
  'Migration Complete' as status,
  COUNT(DISTINCT store_id) as stores_with_delivery_areas,
  COUNT(*) as total_delivery_areas
FROM store_delivery_areas;

-- Optional: Clean up function after migration
-- DROP FUNCTION normalize_area_name(TEXT);
