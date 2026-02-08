import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, handleApiError } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Environment check only (no key exposure)
    const envCheck = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }

    // Test database connectivity
    const supabase = createServiceClient()
    
    const { count: memberCount, error } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      status: 'ok',
      environment: envCheck,
      database: {
        connected: !error,
        memberCount: memberCount || 0
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return handleApiError(error)
  }
}
