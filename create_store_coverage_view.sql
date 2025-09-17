-- Store Service Coverage Materialized View
-- Optimizes N+1 query problem in store assignment

-- Create the materialized view for fast lookups
CREATE MATERIALIZED VIEW IF NOT EXISTS store_service_coverage AS
SELECT 
  s.id as store_id,
  s.business_name,
  s.owner_name,
  s.phone as store_phone,
  s.is_open,
  s.status as store_status,
  sapp.area_name,
  sapp.product_type,
  sapp.price_basic,
  sapp.price_premium,
  sapp.price_special,
  -- Computed field for quick filtering
  s.status = 'active' AND s.is_open = true as is_available
FROM stores s
LEFT JOIN store_area_product_pricing sapp ON s.id = sapp.store_id
WHERE s.status = 'active';

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_coverage_lookup 
ON store_service_coverage(area_name, product_type, is_available);

CREATE INDEX IF NOT EXISTS idx_coverage_store
ON store_service_coverage(store_id);

CREATE INDEX IF NOT EXISTS idx_coverage_price
ON store_service_coverage(product_type, price_basic);

-- Function to refresh the view (can be called by cron)
CREATE OR REPLACE FUNCTION refresh_store_coverage()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY store_service_coverage;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON store_service_coverage TO authenticated;
GRANT SELECT ON store_service_coverage TO anon;

-- Initial refresh
REFRESH MATERIALIZED VIEW store_service_coverage;
