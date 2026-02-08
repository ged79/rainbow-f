import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// GET single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        sender_store:stores!sender_store_id(id, business_name, phone),
        receiver_store:stores!receiver_store_id(id, business_name, phone)
      `)
      .eq('id', params.id)
      .or(`sender_store_id.eq.${store.id},receiver_store_id.eq.${store.id}`)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Transform completion_photos to match frontend expectations
    if (order.completion_photos) {
      order.completion = {
        ...order.completion,
        photos: order.completion_photos,
        completed_at: order.updated_at,
        recipient_name: order.recipient?.name || ''
      }
    }

    return NextResponse.json({ data: order })
  } catch (error: any) {
    logger.error('Get order error', error, request)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// UPDATE order (FIXED with points handling AND receiver status updates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Get current order to check ownership and get original amount
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*, sender_store_id, receiver_store_id, payment')
      .eq('id', params.id)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user is sender or receiver
    const isSender = currentOrder.sender_store_id === store.id
    const isReceiver = currentOrder.receiver_store_id === store.id
    
    if (!isSender && !isReceiver) {
      return NextResponse.json({ error: 'Unauthorized to modify this order' }, { status: 403 })
    }

    const body = await request.json()
    
    // Handle status updates separately - both sender and receiver can update status
    if (body.status) {
      const newStatus = body.status
      const currentStatus = currentOrder.status
      
      // Validation rules for status transitions
      const validTransitions: Record<string, string[]> = {
        pending: ['accepted', 'rejected', 'cancelled'],
        accepted: ['in_delivery', 'completed', 'cancelled'],
        in_delivery: ['completed'],
        rejected: [],
        completed: [],
        cancelled: []
      }
      
      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return NextResponse.json(
          { error: `Cannot change status from ${currentStatus} to ${newStatus}` },
          { status: 400 }
        )
      }
      
      // Permission checks for specific status changes
      if ((newStatus === 'accepted' || newStatus === 'rejected') && !isReceiver) {
        return NextResponse.json(
          { error: 'Only receiver can accept or reject orders' },
          { status: 403 }
        )
      }
      
      if (newStatus === 'cancelled' && !isSender) {
        return NextResponse.json(
          { error: 'Only sender can cancel orders' },
          { status: 403 }
        )
      }
      
      // Update status
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      return NextResponse.json({ data: updatedOrder })
    }
    
    // Handle product/price updates - only sender can modify
    if (!isSender) {
      return NextResponse.json(
        { error: 'Only sender can modify order details' },
        { status: 403 }
      )
    }
    
    // Check if order can be modified (not completed or cancelled)
    if (currentOrder.status === 'completed' || currentOrder.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot modify completed or cancelled orders' },
        { status: 400 }
      )
    }
    
    // Calculate new total if product details changed
    let newTotal = currentOrder.payment?.total || 0
    if (body.product) {
      const price = body.product.price || currentOrder.product?.price || 0
      const quantity = body.product.quantity || currentOrder.product?.quantity || 1
      const additionalFee = body.additional_fee || currentOrder.payment?.additional_fee || 0
      newTotal = (price * quantity) + additionalFee
    }

    const originalTotal = currentOrder.payment?.total || 0

    // If price changed, use the new RPC function to handle points
    if (newTotal !== originalTotal) {
      const orderData = {
        customer: body.customer || currentOrder.customer,
        recipient: body.recipient || currentOrder.recipient,
        product: body.product || currentOrder.product,
        receiver_store_id: body.receiver_store_id || currentOrder.receiver_store_id
      }

      const { data, error } = await supabase.rpc('handle_order_edit', {
        p_order_id: params.id,
        p_store_id: store.id,
        p_original_amount: originalTotal,
        p_new_amount: newTotal,
        p_order_data: orderData
      })

      if (error) throw error
      
      if (!data.success) {
        return NextResponse.json({ error: data.error }, { status: 400 })
      }

      // Fetch updated order
      const { data: updatedOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .single()

      return NextResponse.json({ 
        data: updatedOrder,
        points_adjusted: data.points_adjusted,
        difference: data.difference,
        new_balance: data.new_balance
      })
    } else {
      // No price change, just update order details
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          customer: body.customer || currentOrder.customer,
          recipient: body.recipient || currentOrder.recipient,
          product: body.product || currentOrder.product,
          receiver_store_id: body.receiver_store_id || currentOrder.receiver_store_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .select()
        .single()

      if (updateError) throw updateError

      return NextResponse.json({ 
        data: updatedOrder,
        points_adjusted: false
      })
    }
  } catch (error: any) {
    logger.error('Update order error', error, request)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE order (only if pending)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Check order status
    const { data: order } = await supabase
      .from('orders')
      .select('status, payment')
      .eq('id', params.id)
      .eq('sender_store_id', store.id)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only delete pending orders' },
        { status: 400 }
      )
    }

    // Refund points before deletion
    const refundAmount = order.payment?.total || 0
    if (refundAmount > 0) {
      const { error: refundError } = await supabase.rpc('refund_order_points', {
        p_order_id: params.id,
        p_store_id: store.id,
        p_amount: refundAmount
      })
      
      if (refundError) throw refundError
    }

    // Delete order
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Delete order error', error, request)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}