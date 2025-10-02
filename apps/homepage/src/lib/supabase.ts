import { createClient } from '@supabase/supabase-js'

// Legacy API keys 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Legacy key format 체크 및 변환
const formatKey = (key: string) => {
  // 새 형식 (sb_publishable_)을 레거시 형식으로 변환
  if (key.startsWith('sb_publishable_')) {
    // Legacy keys 사용 필요
    console.warn('New API key format detected. Please use Legacy API keys from Supabase dashboard.')
    return key // 일단 그대로 반환 (작동 안 할 수 있음)
  }
  return key
}

export const supabase = createClient(
  supabaseUrl, 
  formatKey(supabaseAnonKey)
)