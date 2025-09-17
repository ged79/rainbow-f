-- 전체 초기화 (주의: 모든 데이터 삭제)
-- 1. 백업
CREATE TABLE IF NOT EXISTS full_backup_20250829 AS 
SELECT * FROM store_delivery_areas;

CREATE TABLE IF NOT EXISTS pricing_backup_20250829 AS 
SELECT * FROM store_area_product_pricing;

-- 2. 전체 삭제
DELETE FROM store_area_product_pricing;
DELETE FROM store_delivery_areas;

-- 3. 확인
SELECT COUNT(*) as remaining FROM store_delivery_areas;
SELECT COUNT(*) as remaining FROM store_area_product_pricing;