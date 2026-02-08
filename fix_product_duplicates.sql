-- =============================================
-- FIX: Add Unique Constraint for Products Table
-- Run this BEFORE uploading products
-- =============================================

-- First, check if constraint already exists
DO $$ 
BEGIN
  -- Drop the constraint if it exists
  ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS unique_product_per_category;
  
  -- Add unique constraint to prevent duplicate products
  ALTER TABLE products 
  ADD CONSTRAINT unique_product_per_category 
  UNIQUE (display_name, category_1, category_2);
  
  RAISE NOTICE 'Unique constraint added successfully';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint already exists';
END $$;

-- Optional: Remove any existing duplicates before adding constraint
-- This keeps the most recent version of each product
DELETE FROM products a
USING products b
WHERE a.id < b.id
  AND a.display_name = b.display_name
  AND a.category_1 = b.category_1
  AND a.category_2 = b.category_2;

-- Verify no duplicates exist
SELECT 
  display_name,
  category_1,
  category_2,
  COUNT(*) as duplicate_count
FROM products
GROUP BY display_name, category_1, category_2
HAVING COUNT(*) > 1;
