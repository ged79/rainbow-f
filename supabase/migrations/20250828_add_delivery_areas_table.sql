-- Create store_delivery_areas table for minimum delivery amounts per area
CREATE TABLE IF NOT EXISTS store_delivery_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    area_name TEXT NOT NULL,
    min_amount INTEGER NOT NULL DEFAULT 30000 CHECK (min_amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate areas per store
    UNIQUE(store_id, area_name)
);

-- Create indexes
CREATE INDEX idx_store_delivery_areas_store_id ON store_delivery_areas(store_id);
CREATE INDEX idx_store_delivery_areas_area_name ON store_delivery_areas(area_name);

-- Enable RLS
ALTER TABLE store_delivery_areas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Stores can view own delivery areas" ON store_delivery_areas
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Stores can insert own delivery areas" ON store_delivery_areas
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Stores can update own delivery areas" ON store_delivery_areas
    FOR UPDATE USING (
        store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Stores can delete own delivery areas" ON store_delivery_areas
    FOR DELETE USING (
        store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_store_delivery_areas_updated_at 
    BEFORE UPDATE ON store_delivery_areas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
