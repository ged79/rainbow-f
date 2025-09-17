-- Fix RLS policies for stores table
DROP POLICY IF EXISTS "stores_select_policy" ON stores;
CREATE POLICY "stores_select_policy" ON stores
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    id IN (
      SELECT store_id FROM stores WHERE user_id = auth.uid()
    )
    OR
    true -- Allow public read for store search
  );

-- Fix RLS for orders table  
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
CREATE POLICY "orders_select_policy" ON orders
  FOR SELECT
  USING (
    sender_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    receiver_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "orders_update_policy" ON orders;
CREATE POLICY "orders_update_policy" ON orders
  FOR UPDATE
  USING (
    sender_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    receiver_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );
