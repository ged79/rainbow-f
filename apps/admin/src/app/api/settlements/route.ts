import { NextRequest, NextResponse } from 'next/server'
import { createBrowserClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const storeId = searchParams.get('storeId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    let query = supabase
      .from('settlements')
      .select(`
        *,
        store:stores(
          id,
          business_name,
          owner_name,
          phone,
          bank_name,
          account_number,
          account_holder
        )
      `)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    if (dateFrom) {
      query = query.gte('period_start', dateFrom)
    }

    if (dateTo) {
      query = query.lte('period_end', dateTo)
    }

    const { data, error } = await query.order('period_start', { ascending: false })

    if (error) throw error

    // Ensure all settlements have net_amount for backward compatibility
    const settlements = (data || []).map(settlement => ({
      ...settlement,
      net_amount: settlement.net_amount || (settlement.total_amount - settlement.commission_amount),
      commission_rate: settlement.commission_rate || 25.00
    }))

    return NextResponse.json({ data: settlements })
  } catch (error: any) {
    console.error('Failed to load settlements:', error)
    return NextResponse.json(
      { error: 'Failed to load settlements' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'completed') {
      updateData.processed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('settlements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Failed to update settlement:', error)
    return NextResponse.json(
      { error: 'Failed to update settlement' },
      { status: 500 }
    )
  }
}