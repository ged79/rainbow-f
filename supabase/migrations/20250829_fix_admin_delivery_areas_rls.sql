-- Fix Admin RLS for delivery areas and pricing tables
-- Admin needs to be able to view all store delivery areas and pricing

-- Step 1: Add admin policies for store_delivery_areas
CREATE POLICY "Admin can view all delivery areas" ON store_delivery_areas
    FOR SELECT
    USING (is_admin());

CREATE POLICY "Admin can manage all delivery areas" ON store_delivery_areas
    FOR ALL
    USING (is_admin());

-- Step 2: Add admin policies for store_area_product_pricing  
CREATE POLICY "Admin can view all area pricing" ON store_area_product_pricing
    FOR SELECT
    USING (is_admin());

CREATE POLICY "Admin can manage all area pricing" ON store_area_product_pricing
    FOR ALL
    USING (is_admin());

-- Step 3: Also add public read access for active stores (for customer ordering)
CREATE POLICY "Public can view active store delivery areas" ON store_delivery_areas
    FOR SELECT
    USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE status = 'active' AND is_open = true
        )
    );

CREATE POLICY "Public can view active store pricing" ON store_area_product_pricing
    FOR SELECT
    USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE status = 'active' AND is_open = true
        )
    );
