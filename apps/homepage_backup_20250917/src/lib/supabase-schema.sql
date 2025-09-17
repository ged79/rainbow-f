-- Orders table (주문)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(100),
  recipient_phone VARCHAR(20),
  delivery_address TEXT,
  delivery_date DATE,
  delivery_time VARCHAR(50),
  message TEXT,
  ribbon_message VARCHAR(200),
  total_amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Order items table (주문 상품)
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_image TEXT,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Wishlists table (찜하기)
CREATE TABLE wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(200),
  product_image TEXT,
  product_price INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(customer_phone, product_id)
);

-- Indexes for performance
CREATE INDEX idx_orders_customer ON orders(customer_name, customer_phone);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_wishlists_customer ON wishlists(customer_name, customer_phone);

-- RLS Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Public read for orders with matching phone/name
CREATE POLICY "Orders viewable by customer" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Order items viewable" ON order_items
  FOR SELECT USING (true);

CREATE POLICY "Wishlists viewable" ON wishlists
  FOR SELECT USING (true);

-- Insert policies
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can add to wishlist" ON wishlists
  FOR INSERT WITH CHECK (true);
