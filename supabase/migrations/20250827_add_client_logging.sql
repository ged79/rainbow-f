-- Client error and activity logging
-- Created: 2025-08-27

-- Create logs table
CREATE TABLE IF NOT EXISTS client_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  stack TEXT,
  session_id TEXT,
  environment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast querying
CREATE INDEX idx_logs_store_id ON client_logs(store_id);
CREATE INDEX idx_logs_user_id ON client_logs(user_id);
CREATE INDEX idx_logs_level ON client_logs(level);
CREATE INDEX idx_logs_created_at ON client_logs(created_at DESC);
CREATE INDEX idx_logs_session ON client_logs(session_id) WHERE session_id IS NOT NULL;

-- RLS policies
ALTER TABLE client_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can insert their own logs
CREATE POLICY "Users can insert their own logs"
  ON client_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Store admins can view their store's logs
CREATE POLICY "Store admins can view store logs"
  ON client_logs FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Create function to clean old logs (keep 30 days)
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM client_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run daily)
-- Note: This requires pg_cron extension to be enabled
-- For now, run manually or set up external cron job

COMMENT ON TABLE client_logs IS 'Client-side error and activity logging';
