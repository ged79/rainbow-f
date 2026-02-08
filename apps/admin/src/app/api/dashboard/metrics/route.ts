import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerSupabaseClient()

  try {
    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get week's date range
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    
    // Get month's date range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // Today's commission
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('payment')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    const todayCommission = todayOrders?.reduce((sum, order) => 
      sum + (order.payment?.commission || 0), 0) || 0

    // Week's commission
    const { data: weekOrders } = await supabase
      .from('orders')
      .select('payment')
      .gte('created_at', weekStart.toISOString())

    const weekCommission = weekOrders?.reduce((sum, order) => 
      sum + (order.payment?.commission || 0), 0) || 0

    // Month's commission
    const { data: monthOrders } = await supabase
      .from('orders')
      .select('payment')
      .gte('created_at', monthStart.toISOString())

    const monthCommission = monthOrders?.reduce((sum, order) => 
      sum + (order.payment?.commission || 0), 0) || 0

    // Active stores count
    const { count: activeStores } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Today's orders count
    const { count: ordersToday } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    // Pending settlements count
    const { count: pendingSettlements } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .is('receiver_store_id', null)
      .eq('status', 'pending')

    return NextResponse.json({
      today_commission: todayCommission,
      week_commission: weekCommission,
      month_commission: monthCommission,
      pending_settlements: pendingSettlements || 0,
      active_stores: activeStores || 0,
      total_orders_today: ordersToday || 0,
      revenue_trend: []
    })
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to load metrics' },
      { status: 500 }
    )
  }
}