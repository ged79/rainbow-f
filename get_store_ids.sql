-- Get actual store IDs for testing
SELECT id, business_name, points_balance 
FROM stores 
WHERE status = 'active'
ORDER BY points_balance DESC
LIMIT 5;
