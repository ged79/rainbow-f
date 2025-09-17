-- Create product pricing configuration table
CREATE TABLE IF NOT EXISTS product_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_type TEXT NOT NULL,
    
    -- Pricing tiers
    price_basic INTEGER NOT NULL CHECK (price_basic > 0),
    price_premium INTEGER NOT NULL CHECK (price_premium > 0),
    price_deluxe INTEGER NOT NULL CHECK (price_deluxe > 0),
    
    -- Ensure premium > basic and deluxe > premium
    CHECK (price_premium >= price_basic),
    CHECK (price_deluxe >= price_premium),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate product types per store
    UNIQUE(store_id, product_type)
);

-- Create indexes
CREATE INDEX idx_product_pricing_store_id ON product_pricing(store_id);
CREATE INDEX idx_product_pricing_product_type ON product_pricing(product_type);

-- Enable RLS
ALTER TABLE product_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Stores can view own product pricing" ON product_pricing
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Stores can insert own product pricing" ON product_pricing
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Stores can update own product pricing" ON product_pricing
    FOR UPDATE USING (
        store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Stores can delete own product pricing" ON product_pricing
    FOR DELETE USING (
        store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    );

-- Update timestamp trigger
CREATE TRIGGER update_product_pricing_updated_at 
    BEFORE UPDATE ON product_pricing 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default pricing for existing stores
INSERT INTO product_pricing (store_id, product_type, price_basic, price_premium, price_deluxe)
SELECT 
    s.id,
    pt.product_type,
    pt.price_basic,
    pt.price_premium,
    pt.price_deluxe
FROM stores s
CROSS JOIN (
    VALUES 
        ('근조화환', 60000, 70000, 80000),
        ('축하화환', 60000, 70000, 80000),
        ('관엽화분', 50000, 80000, 100000),
        ('꽃바구니', 50000, 80000, 100000),
        ('꽃다발', 50000, 80000, 100000),
        ('서양란', 50000, 80000, 100000)
) AS pt(product_type, price_basic, price_premium, price_deluxe)
WHERE NOT EXISTS (
    SELECT 1 FROM product_pricing pp 
    WHERE pp.store_id = s.id AND pp.product_type = pt.product_type
);
