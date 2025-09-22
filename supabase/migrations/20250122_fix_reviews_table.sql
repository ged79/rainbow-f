-- Drop existing table if exists
DROP TABLE IF EXISTS order_reviews;

-- Create order_reviews table with correct type
CREATE TABLE order_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL,
  customer_phone VARCHAR(20),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_order_reviews_order_id ON order_reviews(order_id);
CREATE INDEX idx_order_reviews_customer_phone ON order_reviews(customer_phone);

-- Add has_review column to customer_orders
ALTER TABLE customer_orders 
ADD COLUMN IF NOT EXISTS has_review BOOLEAN DEFAULT FALSE;
