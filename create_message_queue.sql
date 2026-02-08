-- Message Queue Table for Non-Blocking Kakao Messages
-- Safe to add - doesn't affect existing functionality

CREATE TABLE IF NOT EXISTS message_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone varchar(20) NOT NULL,
  message text NOT NULL,
  status varchar(20) DEFAULT 'pending',
  attempts integer DEFAULT 0,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_message_queue_status 
ON message_queue(status, created_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_message_queue_created 
ON message_queue(created_at) WHERE status = 'pending';

-- Grant permissions
GRANT ALL ON message_queue TO authenticated;
GRANT ALL ON message_queue TO anon;
