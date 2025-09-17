-- 1. Add is_active column to store_delivery_areas
ALTER TABLE store_delivery_areas 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Drop old store_area_product_pricing and recreate with new structure
DROP TABLE IF EXISTS store_area_product_pricing CASCADE;

CREATE TABLE store_area_product_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    area_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    is_available BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(store_id, area_name, product_id)
);

-- Create indexes
CREATE INDEX idx_store_area_product_pricing_store_id ON store_area_product_pricing(store_id);
CREATE INDEX idx_store_area_product_pricing_area_name ON store_area_product_pricing(area_name);
CREATE INDEX idx_store_area_product_pricing_product_id ON store_area_product_pricing(product_id);
CREATE INDEX idx_store_area_product_pricing_is_available ON store_area_product_pricing(is_available);

-- Enable RLS
ALTER TABLE store_area_product_pricing ENABLE ROW LEVEL SECURITY;

-- Store policies
CREATE POLICY "Stores can view own area pricing" ON store_area_product_pricing
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Stores can insert own area pricing" ON store_area_product_pricing
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Stores can update own area pricing" ON store_area_product_pricing
    FOR UPDATE USING (
        store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Stores can delete own area pricing" ON store_area_product_pricing
    FOR DELETE USING (
        store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    );

-- Admin policies
CREATE POLICY "Admin can view all area pricing" ON store_area_product_pricing
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE auth.uid() = user_id
        )
    );

-- Update timestamp trigger
CREATE TRIGGER update_store_area_product_pricing_updated_at 
    BEFORE UPDATE ON store_area_product_pricing 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();