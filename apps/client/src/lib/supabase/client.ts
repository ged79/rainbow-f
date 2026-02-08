import { createBrowserClient } from '@supabase/ssr'
// FlowerAPIClient removed from shared - use apiService directly

// Supabase client for browser
export function createClient() {
  // 새 publishable key 지원
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const isLegacy = key.startsWith('eyJ')
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'flower-client'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      }
    }
  )
}

// API client with multi-tenant support
export function createAPIClient() {
  const supabase = createClient()
  // FlowerAPIClient no longer exists in shared
  // Use apiService directly instead
  return supabase
}
