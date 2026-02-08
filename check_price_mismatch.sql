-- Check florist minimum price settings and homepage order conflicts

-- 1. Check if store_area_product_pricing table exists and has data
SELECT 
    store_id,
    area_name,
    product_type,
    base_price,
    additional_fee,
    COUNT(*) as config_count
FROM store_area_product_pricing
GROUP BY store_id, area_name, product_type, base_price, additional_fee
LIMIT 10;

-- 2. Alternative: Check if pricing is stored differently (maybe in JSONB)
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'stores'
AND column_name LIKE '%price%' OR column_name LIKE '%pricing%';

-- 3. Check store_delivery_areas for minimum amounts
SELECT 
    sda.store_id,
    s.business_name,
    sda.area_name,
    sda.min_amount,
    COUNT(*) OVER (PARTITION BY sda.store_id) as areas_count
FROM store_delivery_areas sda
JOIN stores s ON s.id = sda.store_id
WHERE s.status = 'active'
ORDER BY s.business_name, sda.area_name
LIMIT 20;

-- 4. Check customer_orders against florist minimums
WITH order_analysis AS (
    SELECT 
        co.order_number,
        co.product_name,
        co.mapped_category,
        co.mapped_price,
        co.original_price,
        co.total_amount,
        co.recipient_address->>'sigungu' as delivery_area,
        co.status,
        co.assigned_store_id
    FROM customer_orders co
    WHERE co.created_at > NOW() - INTERVAL '30 days'
)
SELECT 
    status,
    COUNT(*) as order_count,
    AVG(mapped_price) as avg_mapped_price,
    MIN(mapped_price) as min_mapped_price,
    MAX(mapped_price) as max_mapped_price,
    COUNT(CASE WHEN mapped_price < 50000 THEN 1 END) as below_50k,
    COUNT(CASE WHEN mapped_price < 60000 THEN 1 END) as below_60k,
    COUNT(CASE WHEN assigned_store_id IS NULL THEN 1 END) as unassigned
FROM order_analysis
GROUP BY status;

-- 5. Find unassignable orders (pending too long)
SELECT 
    order_number,
    product_name,
    mapped_category,
    mapped_price,
    recipient_address->>'sigungu' as delivery_area,
    status,
    created_at,
    NOW() - created_at as pending_duration
FROM customer_orders
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at;

-- 6. Check if there's a mismatch between homepage prices and florist minimums
SELECT 
    mapped_category,
    COUNT(*) as order_count,
    AVG(mapped_price) as avg_price,
    MIN(mapped_price) as min_price,
    MAX(mapped_price) as max_price,
    CASE 
        WHEN MIN(mapped_price) < 50000 THEN 'Below florist minimum'
        WHEN MIN(mapped_price) < 60000 THEN 'May be below some florists'
        ELSE 'OK'
    END as price_status
FROM customer_orders
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY mapped_category
ORDER BY mapped_category;

-- 7. Check the actual assignment logic - which stores can accept which orders
WITH florist_capabilities AS (
    SELECT 
        s.id,
        s.business_name,
        array_agg(DISTINCT sda.area_name) as service_areas,
        MIN(sda.min_amount) as min_order_amount
    FROM stores s
    LEFT JOIN store_delivery_areas sda ON s.id = sda.store_id
    WHERE s.status = 'active' AND s.is_open = true
    GROUP BY s.id, s.business_name
)
SELECT 
    business_name,
    array_length(service_areas, 1) as area_count,
    min_order_amount,
    service_areas[1:3] as sample_areas -- First 3 areas
FROM florist_capabilities
ORDER BY business_name;

-- 8. Critical check: Find orders that CANNOT be assigned
WITH pending_orders AS (
    SELECT 
        co.id,
        co.order_number,
        co.mapped_category,
        co.mapped_price,
        co.recipient_address->>'sigungu' as delivery_area,
        co.created_at
    FROM customer_orders co
    WHERE co.status = 'pending'
),
eligible_stores AS (
    SELECT 
        po.id as order_id,
        po.order_number,
        po.mapped_price,
        po.delivery_area,
        COUNT(s.id) as eligible_store_count
    FROM pending_orders po
    LEFT JOIN store_delivery_areas sda ON sda.area_name LIKE '%' || po.delivery_area || '%'
    LEFT JOIN stores s ON s.id = sda.store_id AND s.is_open = true AND s.status = 'active'
    WHERE sda.min_amount <= po.mapped_price OR sda.min_amount IS NULL
    GROUP BY po.id, po.order_number, po.mapped_price, po.delivery_area
)
SELECT 
    order_number,
    mapped_price,
    delivery_area,
    eligible_store_count,
    CASE 
        WHEN eligible_store_count = 0 THEN '❌ NO STORES CAN ACCEPT'
        WHEN eligible_store_count < 3 THEN '⚠️ Limited options'
        ELSE '✅ Multiple options'
    END as status
FROM eligible_stores
ORDER BY eligible_store_count, mapped_price;
