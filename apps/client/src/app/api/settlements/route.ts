import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { settlementQuerySchema, formatValidationErrors } from '@/lib/validation/schemas'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user's store
    const { data: store } = await supabase
      .from('stores')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single()
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // VALIDATION: Parse and validate query parameters  
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const validationResult = settlementQuerySchema.safeParse(searchParams)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: formatValidationErrors(validationResult.error)
        },
        { status: 400 }
      )
    }

    const { status, start_date, end_date, page, limit } = validationResult.data
    const offset = (page - 1) * limit

    // Date validation - end date must be after start date
    if (start_date && end_date) {
      const startMs = new Date(start_date).getTime()
      const endMs = new Date(end_date).getTime()
      
      if (startMs > endMs) {
        return NextResponse.json(
          { error: '시작일은 종료일보다 이전이어야 합니다' },
          { status: 400 }
        )
      }

      // Limit date range to 1 year
      const oneYear = 365 * 24 * 60 * 60 * 1000
      if (endMs - startMs > oneYear) {
        return NextResponse.json(
          { error: '조회 기간은 최대 1년까지만 가능합니다' },
          { status: 400 }
        )
      }
    }

    // Build query for settlements
    let query = supabase
      .from('settlements')
      .select('*', { count: 'exact' })
      .eq('store_id', store.id)

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply date filters
    if (start_date) {
      query = query.gte('period_start', `${start_date}T00:00:00`)
    }
    if (end_date) {
      query = query.lte('period_end', `${end_date}T23:59:59`)
    }

    // Get paginated settlements
    const { data: settlements, error: settlementsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (settlementsError) {
      logger.error('Settlements query error', settlementsError)
      throw settlementsError
    }

    // Calculate aggregates for pending settlements
    let pendingTotals = {
      total_amount: 0,
      total_orders: 0,
      count: 0
    }

    if (!status || status === 'pending') {
      const { data: pendingStats } = await supabase
        .from('settlements')
        .select('net_amount, settlement_amount, total_orders')
        .eq('store_id', store.id)
        .eq('status', 'pending')

      if (pendingStats) {
        pendingTotals = {
          total_amount: pendingStats.reduce((sum, s) => sum + (s.net_amount || s.settlement_amount || 0), 0),
          total_orders: pendingStats.reduce((sum, s) => sum + (s.total_orders || 0), 0),
          count: pendingStats.length
        }
      }
    }

    // Calculate next settlement date (Friday)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
    const nextSettlementDate = new Date(today)
    nextSettlementDate.setDate(today.getDate() + daysUntilFriday)

    return NextResponse.json({
      data: settlements || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      pending: pendingTotals,
      next_settlement_date: nextSettlementDate.toISOString()
    })

  } catch (error: any) {
    logger.error('Get settlements error', error)
    
    return NextResponse.json(
      { error: '정산 내역 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}