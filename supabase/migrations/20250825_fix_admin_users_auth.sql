-- Add user_id to admin_users table for authentication
-- This links admin_users to auth.users table

-- Add user_id column if it doesn't exist
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add name column for display
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS name TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- Make user_id unique (one admin entry per auth user)
ALTER TABLE admin_users
ADD CONSTRAINT unique_admin_user_id UNIQUE (user_id);

-- Update existing admin users to link with auth.users
-- You need to create auth users first, then update this
-- Example: Link admin@flower.com to its auth.users entry
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user_id for admin@flower.com from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'admin@flower.com'
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        UPDATE admin_users
        SET user_id = v_user_id,
            name = 'System Administrator'
        WHERE email = 'admin@flower.com';
    END IF;
    
    -- Get user_id for support@flower.com from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'support@flower.com'
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        UPDATE admin_users
        SET user_id = v_user_id,
            name = 'Support Team'
        WHERE email = 'support@flower.com';
    END IF;
END $$;

-- Verify the changes
SELECT 
    au.id,
    au.email,
    au.name,
    au.role,
    au.user_id,
    u.email as auth_email
FROM admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id;
