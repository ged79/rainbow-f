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
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      results.auth = { user: user?.email