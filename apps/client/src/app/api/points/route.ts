import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { pointChargeSchema, formatValidationErrors } from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('id, points_balance')
      .eq('user_id', user.id)
      .single()
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Get transactions with pagination
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Try to get transactions, but don't fail if table doesn't exist
    let transactions = []
    let count = 0
    
    try {
      const { data, error, count: totalCount } = await supabase
        .from('point_transactions')
        .select('*', { count: 'exact' })
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (!error && data) {
        transactions = data
        count = totalCount || 0
      }
    } catch (e) {
      // Table might not exist, continue without transactions
      console.log('Point transactions table not found or accessible')
    }

    return NextResponse.json({ 
      balance: store.points_balance || 0,
      transactions: transactions,
      total_count: count
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: '포인트 내역 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('id, points_balance')
      .eq('user_id', user.id)
      .single()
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // VALIDATION: Validate point charge data
    const validationResult = pointChargeSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '입력값 검증 실패',
          details: formatValidationErrors(validationResult.error)
        },
        { status: 400 }
      )
    }

    const { amount, payment_method } = validationResult.data

    // Additional business validation
    const currentBalance = store.points_balance || 0
    const maxBalance = 50000000 // 50 million won max balance
    
    if (currentBalance + amount > maxBalance) {
      return NextResponse.json(
        { 
          error: `최대 잔액 ${maxBalance.toLocaleString()}원을 초과할 수 없습니다`,
          current_balance: currentBalance,
          requested_charge: amount,
          max_allowed: maxBalance - currentBalance
        },
        { status: 400 }
      )
    }

    // SIMPLIFIED: Just update the balance directly
    const newBalance = currentBalance + amount
    
    const { data: updatedStore, error: updateError } = await supabase
      .from('stores')
      .update({ 
        points_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', store.id)
      .select('points_balance')
      .single()

    if (updateError) {
      console.error('Store balance update error:', updateError)
      throw updateError
    }

    // Try to create transaction record (optional - don't fail if table doesn't exist)
    try {
      await supabase
        .from('point_transactions')
        .insert({
          store_id: store.id,
          type: 'charge',
          amount: amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `포인트 충전 (${payment_method})`,
          payment_method: payment_method,
          status: 'completed',
          created_at: new Date().toISOString()
        })
    } catch (e) {
      // Transaction logging failed, but charge succeeded
      console.log('Could not log transaction (table might not exist), but charge succeeded')
    }

    return NextResponse.json({
      success: true,
      charged_amount: amount,
      new_balance: updatedStore.points_balance || newBalance,
      payment_method: payment_method,
      message: '포인트 충전이 완료되었습니다'
    })

  } catch (error: any) {
    console.error('Point charge error:', error)
    
    // More specific error messages
    let errorMessage = '포인트 충전 중 오류가 발생했습니다'
    if (error.message?.includes('violates foreign key')) {
      errorMessage = '스토어 정보가 올바르지 않습니다'
    } else if (error.message?.includes('permission denied')) {
      errorMessage = '권한이 없습니다'
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}