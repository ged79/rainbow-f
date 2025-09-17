import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone') || '010-7741-4569'
  const amount = parseInt(searchParams.get('amount') || '5000')
  
  try {
    // Direct DB test
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // 1. Check available coupons
    const { data: coupons, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('customer_phone', phone)
      .is('used_at', null)
    
    if (fetchError) {
      return NextResponse.json({ error: 'Fetch failed', details: fetchError })
    }
    
    // 2. Try to use first coupon
    if (coupons && coupons.length > 0) {
      const { data: updated, error: updateError } = await supabase
        .from('coupons')
        .update({ 
          used_at: new Date().toISOString()
        })
        .eq('id', coupons[0].id)
        .select()
      
      return NextResponse.json({
        success: !updateError,
        before: coupons.length,
        used: updated?.length || 0,
        error: updateError
      })
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'No coupons found',
      phone 
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message })
  }
}
