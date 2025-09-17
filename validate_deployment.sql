-- DEPLOYMENT VALIDATION QUERIES
-- Run these to confirm system is ready

-- 1. Verify commission rate is 25%
SELECT 
    'Commission Rate Check' as test,
    CASE 
        WHEN COUNT(DISTINCT commission_rate) = 1 AND MAX(commission_rate) = 25.00 
        THEN '✅ PASS - All settlements at 25%'
        ELSE '❌ FAIL - Mixed rates found: ' || string_agg(DISTINCT commission_rate::text, ', ')
    END as result
FROM settlements
WHERE created_at > NOW() - INTERVAL '30 days';

-- 2. Check for recent completed orders without settlements
SELECT 
    'Settlement Coverage' as test,
    CASE 
        WHEN COUNT(*) = 0 
        THEN '✅ PASS - All completed orders have settlements'
        ELSE '❌ FAIL - ' || COUNT(*) || ' orders missing settlements'
    END as result
FROM orders o
WHERE o.status = 'completed'
AND o.receiver_store_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM settlements s 
    WHERE o.id = ANY(s.order_ids)
);

-- 3. Verify points balance integrity
SELECT 
    'Points Balance Check' as test,
    CASE 
        WHEN COUNT(*) = 0 
        THEN '✅ PASS - No negative balances'
        ELSE '❌ FAIL - ' || COUNT(*) || ' stores with negative balance'
    END as result
FROM stores
WHERE points_balance < 0;

-- 4. Check settlement calculation accuracy
WITH settlement_check AS (
    SELECT 
        s.id,
        s.total_amount,
        s.commission_amount,
        s.net_amount,
        FLOOR(s.total_amount * 0.25) as expected_commission,
        s.total_amount - FLOOR(s.total_amount * 0.25) as expected_net
    FROM settlements s
    WHERE s.created_at > NOW() - INTERVAL '7 days'
)
SELECT 
    'Settlement Math Check' as test,
    CASE 
        WHEN COUNT(*) = 0 
        THEN '✅ PASS - All calculations correct'
        ELSE '❌ FAIL - ' || COUNT(*) || ' settlements with wrong calculations'
    END as result
FROM settlement_check
WHERE commission_amount != expected_commission
OR net_amount != expected_net;

-- 5. Summary dashboard
SELECT 
    'SYSTEM READY' as status,
    (SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours') as orders_today,
    (SELECT COUNT(*) FROM settlements WHERE status = 'pending') as pending_settlements,
    (SELECT SUM(net_amount) FROM settlements WHERE status = 'pending') as pending_amount,
    (SELECT COUNT(*) FROM stores WHERE status = 'active') as active_stores,
    (SELECT SUM(points_balance) FROM stores) as total_points_in_system;
