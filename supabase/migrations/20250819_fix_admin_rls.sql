-- Fix Admin RLS Policies
-- This migration adds proper admin detection and policies

-- Step 1: Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user exists in admin_users table
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing restrictive policies on orders
DROP POLICY IF EXISTS "Stores can view own orders" ON orders;
DROP POLICY IF EXISTS "Stores can create sent orders" ON orders;
DROP POLICY IF EXISTS "Stores can update received orders" ON orders;

-- Step 3: Create new policies with admin access
-- Admin can see ALL orders
CREATE POLICY "Admin can view all orders" ON orders
    FOR SELECT
    USING (is_admin());

-- Regular stores can only see their orders
CREATE POLICY "Stores can view own orders" ON orders
    FOR SELECT
    USING (
        NOT is_admin() AND (
            sender_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
            OR 
            receiver_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
        )
    );

-- Admin can update any order
CREATE POLICY "Admin can update all orders" ON orders
    FOR UPDATE
    USING (is_admin());

-- Regular stores can update their orders
CREATE POLICY "Stores can update own orders" ON orders
    FOR UPDATE
    USING (
        NOT is_admin() AND (
            receiver_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
            OR 
            sender_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
        )
    );

-- Admin can insert any order (for manual assignment)
CREATE POLICY "Admin can create orders" ON orders
    FOR INSERT
    WITH CHECK (is_admin());

-- Stores can create orders they send
CREATE POLICY "Stores can create sent orders" ON orders
    FOR INSERT
    WITH CHECK (
        NOT is_admin() AND
        sender_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

-- Step 4: Apply same pattern to other tables
-- Drop old store policies
DROP POLICY IF EXISTS "Stores can view own data" ON stores;
DROP POLICY IF EXISTS "Public can view active stores" ON stores;

-- Admin can see all stores
CREATE POLICY "Admin can view all stores" ON stores
    FOR SELECT
    USING (is_admin());

-- Stores can view their own data
CREATE POLICY "Stores can view own data" ON stores
    FOR SELECT
    USING (
        NOT is_admin() AND auth.uid() = user_id
    );

-- Public can view active stores
CREATE POLICY "Public can view active stores" ON stores
    FOR SELECT
    USING (status = 'active' AND is_open = true);

-- Admin can update any store
CREATE POLICY "Admin can update all stores" ON stores
    FOR UPDATE
    USING (is_admin());

-- Stores can update their own data
CREATE POLICY "Stores can update own data" ON stores
    FOR UPDATE
    USING (
        NOT is_admin() AND auth.uid() = user_id
    )
    WITH CHECK (auth.uid() = user_id);

-- Step 5: Grant function permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
