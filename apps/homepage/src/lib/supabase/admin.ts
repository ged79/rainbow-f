import { createClient } from '@supabase/supabase-js'

/**
 * Secure Supabase Client for API Routes (Server-Side Only)
 * Uses SERVICE_ROLE_KEY to bypass RLS - NEVER expose to client
 */

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in environment variables')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required in environment variables')
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * WARNING: Only use this client in API routes (/app/api/**)
 * Never import this in client components or pages
 */
