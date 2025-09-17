-- Add admin users to admin_users table
-- Run this after the RLS fix migration

-- Add your admin accounts here
-- Replace with actual admin email addresses
INSERT INTO admin_users (email, role, permissions) 
VALUES 
  ('admin@flower.com', 'super_admin', '["all"]'),
  ('support@flower.com', 'admin', '["orders", "stores"]')
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- Verify admin users
SELECT * FROM admin_users;
