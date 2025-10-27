'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const debug = async () => {
      const results: any = {}
      
      // 1. Check auth
      const { data: { user }, error: authError } = await (supabase.auth as any).getUser()
      results.auth = { user: user?.email, error: authError }
      
      // 2. Check admin_users table
      if (user) {
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', user.email)
          .single()
        
        results.adminUser = { data: adminUser, error: adminError }
      }
      
      // 3. Check settlement calculations
      const { data: settlements, error: settlementsError } = await supabase
        .from('order_settlements')
        .select('*')
        .limit(5)
      
      results.settlements = { data: settlements, error: settlementsError }
      
      setDebugInfo(results)
    }
    
    debug()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}
