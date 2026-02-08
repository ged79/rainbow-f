import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const checks = {
    server: 'ok',
    database: 'unknown',
    storage: 'unknown',
    timestamp: new Date().toISOString()
  }

  try {
    // Check database
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('stores')
      .select('id')
      .limit(1)
      .single()
    
    checks.database = dbError ? 'error' : 'ok'
    
    // Check storage
    const { error: storageError } = await supabase
      .storage
      .from('order-photos')
      .list('', { limit: 1 })
    
    checks.storage = storageError ? 'error' : 'ok'
    
    const status = Object.values(checks).every(v => 
      v === 'ok' || v === checks.timestamp
    ) ? 200 : 503

    return NextResponse.json(checks, { status })
  } catch (error) {
    checks.server = 'error'
    return NextResponse.json(checks, { status: 503 })
  }
}
