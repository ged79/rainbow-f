// 통합 주문 타입 - Homepage와 Client 주문을 통합 관리
export interface UnifiedOrder {
  // 기본 정보
  id: string
  source: 'homepage' | 'client'
  order_number: string
  status: 'pending' | 'assigned' | 'accepted' | 'preparing' | 'delivering' | 'completed' | 'cancelled'
  created_at: string
  updated_at?: string
  
  // 고객 정보
  customer: {
    name: string
    phone: string
    company?: string
    memo?: string
  }
  
  // 수령인 정보
  recipient: {
    name: string
    phone: string
    address: {
      sido: string
      sigungu: string
      dong: string
      detail: string
      postal_code?: string
      full_text?: string  // 전체 주소 텍스트
    }
  }
  
  // 배송 정보
  delivery: {
    date: string
    time: string
    status: 'normal' | 'warning' | 'urgent' | 'overdue'
    delayed_minutes?: number
  }
  
  // 상품 정보
  product: {
    type: string
    name: string
    quantity: number
    ribbon_text?: string[]
    special_instructions?: string
    image?: string
  }
  
  // 가격 정보 (출처별 차이 포함)
  pricing: {
    // 공통 필드
    base_price: number      // 원가/기준가
    selling_price: number   // 실제 판매가
    commission: number      // 플랫폼 수수료
    commission_rate: number // 수수료율
    final_amount: number    // 최종 결제액
    
    // Homepage 전용
    homepage_detail?: {
      consumer_price: number    // 소비자가
      discount_amount: number   // 할인액
      points_used: number      // 사용 포인트
      points_earned: number    // 적립 포인트
      coupon_code?: string     // 쿠폰 코드
    }
    
    // Client 전용
    client_detail?: {
      florist_price: number    // 화원가
      additional_fee: number   // 추가비용
      additional_fee_reason?: string
      points_before: number    // 차감 전 포인트
      points_after: number     // 차감 후 포인트
    }
  }
  
  // 화원 정보
  stores: {
    sender?: {
      id: string
      name: string
      phone: string
      owner_name?: string
      points_balance?: number
    }
    receiver?: {
      id: string
      name: string
      phone: string
      owner_name?: string
      is_open?: boolean
      acceptance_time?: string  // 수락 시간
      completion_time?: string  // 완료 시간
    }
  }
  
  // 상태 추적
  tracking: {
    assigned_at?: string
    accepted_at?: string
    prepared_at?: string
    delivered_at?: string
    completed_at?: string
    cancelled_at?: string
    cancel_reason?: string
  }
  
  // 완료 정보
  completion?: {
    photos?: string[]
    memo?: string
    delivered_by?: string
  }
  
  // 원본 데이터 참조 (디버깅용)
  _original?: any
}

// 통합 주문 변환 유틸리티
export function toUnifiedOrder(order: any, source: 'homepage' | 'client'): UnifiedOrder {
  if (source === 'homepage') {
    return {
      id: order.id,
      source: 'homepage',
      order_number: order.order_number,
      status: order.status,
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
        address: {
          sido: order.recipient_address?.sido || '',
          sigungu: order.recipient_address?.sigungu || '',
          dong: order.recipient_address?.dong || '',
          detail: order.recipient_address?.detail || '',
          postal_code: order.recipient_address?.postal_code,
          full_text: typeof order.recipient_address === 'string' 
            ? order.recipient_address 
            : `${order.recipient_address?.sido} ${order.recipient_address?.sigungu} ${order.recipient_address?.dong} ${order.recipient_address?.detail}`
        }
      },
      
      delivery: {
        date: order.delivery_date,
        time: order.delivery_time,
        status: 'normal'  // 계산 필요
      },
      
      product: {
        type: order.mapped_category || order.product_category,
        name: order.product_name,
        quantity: order.quantity || 1,
        ribbon_text: order.ribbon_text,
        special_instructions: order.special_instructions,
        image: order.product_image
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
          points_earned: order.points_earned || 0,
          coupon_code: order.coupon_code
        }
      },
      
      stores: {
        sender: {
          id: 'homepage',
          name: 'Homepage',
          phone: ''
        },
        receiver: order.assigned_store_id ? {
          id: order.assigned_store_id,
          name: order.assigned_store_name || '배정완료',
          phone: ''
        } : undefined
      },
      
      tracking: {
        assigned_at: order.assigned_at,
        completed_at: order.completed_at
      },
      
      _original: order
    }
  }
  
  // Client 주문 변환
  return {
    id: order.id,
    source: 'client',
    order_number: order.order_number || `C-${order.id.slice(0, 8)}`,
    status: order.status || 'pending',
    created_at: order.created_at,
    updated_at: order.updated_at,
    
    customer: {
      name: order.sender_store?.owner_name || order.sender_store?.name || '발신 화원',
      phone: order.sender_store?.phone || '',
      company: order.sender_store?.name
    },
    
    recipient: {
      name: order.recipient_name,
      phone: order.recipient_phone,
      address: {
        sido: order.recipient_address?.sido || '',
        sigungu: order.recipient_address?.sigungu || '',
        dong: order.recipient_address?.dong || '',
        detail: order.recipient_address?.detail || '',
        postal_code: order.recipient_address?.postal_code,
        full_text: typeof order.recipient_address === 'string'
          ? order.recipient_address
          : `${order.recipient_address?.sido} ${order.recipient_address?.sigungu} ${order.recipient_address?.dong} ${order.recipient_address?.detail}`
      }
    },
    
    delivery: {
      date: order.delivery_date,
      time: order.delivery_time || '오전',
      status: 'normal'
    },
    
    product: {
      type: order.product_category,
      name: order.product_name,
      quantity: order.quantity || 1,
      ribbon_text: order.ribbon_text,
      special_instructions: order.special_instructions
    },
    
    pricing: {
      base_price: order.florist_price || 0,
      selling_price: order.florist_price || 0,
      commission: order.commission_amount || 0,
      commission_rate: order.commission_rate || 0.05,
      final_amount: order.total_amount || 0,
      
      client_detail: {
        florist_price: order.florist_price || 0,
        additional_fee: order.additional_fee || 0,
        additional_fee_reason: order.additional_fee_reason,
        points_before: order.points_before || 0,
        points_after: order.points_after || 0
      }
    },
    
    stores: {
      sender: order.sender_store_id ? {
        id: order.sender_store_id,
        name: order.sender_store?.name || '발신 화원',
        phone: order.sender_store?.phone || '',
        owner_name: order.sender_store?.owner_name,
        points_balance: order.sender_store?.points_balance
      } : undefined,
      receiver: order.receiver_store_id ? {
        id: order.receiver_store_id,
        name: order.receiver_store?.name || '수신 화원',
        phone: order.receiver_store?.phone || '',
        owner_name: order.receiver_store?.owner_name,
        is_open: order.receiver_store?.is_open,
        acceptance_time: order.accepted_at,
        completion_time: order.completed_at
      } : undefined
    },
    
    tracking: {
      assigned_at: order.assigned_at,
      accepted_at: order.accepted_at,
      prepared_at: order.prepared_at,
      delivered_at: order.delivered_at,
      completed_at: order.completed_at,
      cancelled_at: order.cancelled_at,
      cancel_reason: order.cancel_reason
    },
    
    completion: order.completion_photos || order.completion_memo ? {
      photos: order.completion_photos,
      memo: order.completion_memo,
      delivered_by: order.delivered_by
    } : undefined,
    
    _original: order
  }
}
