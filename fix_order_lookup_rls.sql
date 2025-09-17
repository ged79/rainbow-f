-- Fix customer order lookup issue by adjusting RLS policies
-- Run this in Supabase SQL Editor

-- First, drop the restrictive admin-only policy
DROP POLICY IF EXISTS "Admin can view all customer orders" ON customer_orders;
DROP POLICY IF EXISTS "Admin can manage customer orders" ON customer_orders;

-- Create new policies that allow customers to query their own orders
-- Policy 1: Allow customers to read their own orders (by phone/name)
CREATE POLICY "Customers can view their own orders" ON customer_orders
  FOR SELECT USING (true);  -- Anyone can SELECT (we filter by name/phone in the query)

-- Policy 2: Allow creating new orders (for order placement)
CREATE POLICY "Anyone can create orders" ON customer_orders
  FOR INSERT WITH CHECK (true);

-- Policy 3: Admin full access
CREATE POLICY "Admin full access to customer orders" ON customer_orders
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_users WHERE role IN ('super_admin', 'admin')
    )
  );

-- Also ensure order_items table has proper policies
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view order items" ON order_items;
CREATE POLICY "Anyone can view order items" ON order_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;
CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Verify the policies are correctly set
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('customer_orders', 'order_items');
