import { UnifiedOrder, OrderStatus } from '../types'

/**
 * Homepage 주문을 통합 주문 형식으로 변환
 */
export function homepageToUnifiedOrder(order: any): UnifiedOrder {
  const address = order.recipient_address
  
  // 🏺 Funeral 주문인 경우 별도 source 설정
  const source = order.order_source === 'funeral' ? 'funeral' : 'homepage'
  
  return {
    id: order.id,
    source: source,
    order_number: order.order_number,
    status: mapHomepageStatus(order.status),
    created_at: order.created_at,
    updated_at: order.updated_at,
    
    customer: {
      name: order.customer_name,
      phone: order.customer_phone,
      company: order.customer_company,
      memo: order.customer_memo
    },
    
    recipient: {
      name: order.recipient_name,
      phone: order.recipient_phone,
      address: typeof address === 'string' 
        ? { sido: '', sigungu: '', dong: '', detail: address }
        : {
            sido: address?.sido || '',
            sigungu: address?.sigungu || '',
            dong: address?.dong || '',
            detail: address?.detail || '',
            postal_code: address?.postal_code
          }
    },
    
    delivery: {
      date: order.delivery_date,
      time: order.delivery_time,
      status: 'normal'
    },
    
    product: {
      type: order.mapped_category || order.product_category || '기타',
      name: order.product_name,
      price: order.mapped_price || order.total_amount,
      quantity: order.quantity || 1,
      ribbon_text: Array.isArray(order.ribbon_text) ? order.ribbon_text : [order.ribbon_text].filter(Boolean),
      special_instructions: order.special_instructions
    },

    
    pricing: {
      base_price: order.original_price,
      selling_price: order.mapped_price || order.total_amount,
      commission: Math.floor((order.mapped_price || order.total_amount) * 0.25),
      commission_rate: 0.25,
      final_amount: order.total_amount,
      
      homepage_detail: {
        consumer_price: order.original_price,
        discount_amount: order.discount_amount || 0,
        points_used: order.points_used || 0,
        points_earned: order.points_earned || 0
      }
    },
    
    stores: {
      sender: undefined,
      receiver: order.assigned_store_id ? {
        id: order.assigned_store_id,
        business_name: order.assigned_store_name || '배정완료',
        owner_name: '',
        phone: '',
        email: '',
        address: { sido: '', sigungu: '' },
        service_areas: [],
        points_balance: 0,
        commission_rate: 0.25,
        bank_name: '',
        account_number: '',
        account_holder: '',
        status: 'active',
        is_open: true,
        rating: 0,
        total_orders_sent: 0,
        total_orders_received: 0,
        total_sales: 0,
        created_at: '',
        updated_at: '',
        business_license: '',
        user_id: '',
        store_code: ''
      } : undefined
    },
    
    tracking: {
      assigned_at: order.assigned_at
    },
    
    _original: order
  }
}

/**
 * Client 주문을 통합 주문 형식으로 변환
 */
export function clientToUnifiedOrder(order: any): UnifiedOrder {
  // Debug: Check actual structure
  if (order.order_number === 'ORD-20250917-1367') {
    console.log('Debug Client Order:', order);
    console.log('Recipient:', order.recipient);
  }
  
  return {
    id: order.id,
    source: 'client',
    order_number: order.order_number,
    status: order.status,
    created_at: order.created_at,
    updated_at: order.updated_at,
    
    customer: order.customer || {
      name: '',
      phone: ''
    },
    
    // Client orders from DB already have proper recipient structure
    recipient: order.recipient || {
      name: '',
      phone: '',
      address: { sido: '', sigungu: '', dong: '', detail: '' }
    },
    
    delivery: {
      date: order.delivery_date || order.recipient?.delivery_date || '',
      time: order.delivery_time || order.recipient?.delivery_time || '',
      status: 'normal'
    },
    
    product: order.product || {
      type: '기타',
      name: '',
      price: 0,
      quantity: 1
    },
    
    pricing: {
      base_price: order.product?.price || 0,
      selling_price: order.product?.price || 0,
      commission: order.payment?.commission || 0,
      commission_rate: 0.25,
      final_amount: order.payment?.total || 0,
      
      client_detail: {
        florist_price: order.product?.price || 0,
        additional_fee: order.payment?.additional_fee || 0,
        additional_fee_reason: order.payment?.additional_fee_reason
      }
    },
    
    stores: {
      sender: order.sender_store,
      receiver: order.receiver_store
    },
    
    tracking: {
      accepted_at: order.accepted_at,
      completed_at: order.completed_at
    },
    
    _original: order
  }
}

/**
 * Homepage 상태를 표준 상태로 매핑
 */
function mapHomepageStatus(status: string): OrderStatus {
  const mapping: Record<string, OrderStatus> = {
    'pending': 'pending',
    'assigned': 'accepted',
    'completed': 'completed',
    'cancelled': 'cancelled'
  }
  return mapping[status] || 'pending'
}

/**
 * 배송 상태 체크
 */
export function checkDeliveryStatus(order: UnifiedOrder): 'normal' | 'warning' | 'urgent' | 'overdue' {
  const now = new Date()
  const deliveryDateTime = new Date(`${order.delivery.date}T${order.delivery.time}`)
  const diffMs = deliveryDateTime.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  
  if (diffMs < 0 && ['pending', 'accepted', 'preparing', 'delivering'].includes(order.status)) {
    return 'overdue'
  }
  if (diffHours <= 1) return 'urgent'
  if (diffHours <= 3) return 'warning'
  return 'normal'
}
