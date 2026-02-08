-- Check if funeral_id column exists in customer_orders table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customer_orders'
  AND column_name = 'funeral_id';

-- If above returns empty, we need to add the column
-- ALTER TABLE customer_orders ADD COLUMN funeral_id uuid REFERENCES funerals(id);
