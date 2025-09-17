import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, handleApiError } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ error: '전화번호가 필요합니다' }, { status: 400 })
  }

  try {
    const supabase = createServiceClient()
    const normalizedPhone = phone.replace(/-/g, '')

    // Get referral history
    const { data: history, error } = await supabase
      .from('referral_history')
      .select('*')
      .eq('referrer_phone', normalizedPhone)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      history: history || [],
      count: history?.length || 0
    })

  } catch (error) {
    return handleApiError(error)
  }
}
