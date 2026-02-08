-- Admin System Tables
-- Run this after main schema

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'support')),
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment history for tracking
CREATE TABLE IF NOT EXISTS assignment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  assigned_to UUID REFERENCES stores(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assignment_type TEXT CHECK (assignment_type IN ('auto', 'manual')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store metrics for scoring
CREATE TABLE IF NOT EXISTS store_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  acceptance_rate DECIMAL(3,2) DEFAULT 0,
  delivery_rate DECIMAL(3,2) DEFAULT 0,
  response_time_avg INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_rejected INTEGER DEFAULT 0,
  calculated_at DATE DEFAULT CURRENT_DATE,
  UNIQUE(store_id, calculated_at)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assignment_history_order ON assignment_history(order_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_store ON assignment_history(assigned_to);
CREATE INDEX IF NOT EXISTS idx_store_metrics_store ON store_metrics(store_id);

-- Function to calculate store metrics
CREATE OR REPLACE FUNCTION get_store_metrics(p_store_id UUID)
RETURNS TABLE(
  acceptance_rate DECIMAL,
  delivery_rate DECIMAL,
  total_orders_sent INTEGER,
  response_time_avg INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      COUNT(CASE WHEN o.status != 'rejected' THEN 1 END)::DECIMAL / 
      NULLIF(COUNT(*)::DECIMAL, 0), 
      0
    ) as acceptance_rate,
    COALESCE(
      COUNT(CASE WHEN o.status = 'completed' THEN 1 END)::DECIMAL / 
      NULLIF(COUNT(CASE WHEN o.status IN ('completed', 'accepted') THEN 1 END)::DECIMAL, 0),
      0
    ) as delivery_rate,
    COUNT(*)::INTEGER as total_orders_sent,
    COALESCE(
      EXTRACT(EPOCH FROM AVG(
        CASE WHEN o.status != 'pending' 
        THEN o.updated_at - o.created_at 
        END
      ))::INTEGER / 60,
      0
    ) as response_time_avg
  FROM orders o
  WHERE o.receiver_store_id = p_store_id
  AND o.created_at > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Insert default admin user (change password immediately)
INSERT INTO admin_users (email, role, permissions) 
VALUES 
  ('admin@flower.com', 'super_admin', '["all"]')
ON CONFLICT (email) DO NOTHING;

-- Grant permissions
GRANT ALL ON admin_users TO authenticated;
GRANT ALL ON assignment_history TO authenticated;
GRANT ALL ON store_metrics TO authenticated;
