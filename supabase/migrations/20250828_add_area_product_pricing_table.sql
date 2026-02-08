-- Create store_area_product_pricing table for area-specific product pricing
CREATE TABLE IF NOT EXISTS store_area_product_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    area_name TEXT NOT NULL,
    product_type TEXT NOT NULL,
    price_basic INTEGER NOT NULL CHECK (price_basic > 0),
    price_premium INTEGER NOT NULL CHECK (price_premium > 0),
    price_deluxe INTEGER NOT NULL CHECK (price_deluxe > 0),
    
    -- Ensure premium > basic and deluxe > premium
    CHECK (price_premium >= price_basic),
    CHECK (price_deluxe >= price_premium),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate product types per store/area
    UNIQUE(store_id, area_name, product_type)
);

-- Create indexes
CREATE INDEX idx_store_area_product_pricing_store_id ON store_area_product_pricing(store_id);
CREATE INDEX idx_store_area_product_pricing_area_name ON store_area_product_pricing(area_name);

-- Enable RLS
ALTER TABLE store_area_product_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Update timestamp trigger
CREATE TRIGGER update_store_area_product_pricing_updated_at 
    BEFORE UPDATE ON store_area_product_pricing 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
