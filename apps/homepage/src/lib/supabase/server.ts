import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Server-side client (uses anon key with RLS)
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Public client (for client-side operations)
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Error handler for API routes
export function handleApiError(error: any) {
  console.error('API Error:', error)
  
  if (error?.code === 'PGRST301') {
    return NextResponse.json(
      { error: 'Database access denied. Check RLS policies.' },
      { status: 403 }
    )
  }
  
  return NextResponse.json(
    { error: error?.message || 'Internal server error' },
    { status: 500 }
  )
}