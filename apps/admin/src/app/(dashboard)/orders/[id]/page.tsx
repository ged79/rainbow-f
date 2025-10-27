'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { OrderWithStores } from '@/shared/types'

interface ExtendedOrder extends OrderWithStores {
  completion_photos?: string[]
  updated_at: string
}
import { formatCurrency, formatPhone, formatDate } from '@/shared/utils'
import { 
  ArrowLeft,
  Package, 
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Building,
  Camera,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit,
  ImageIcon
} from 'lucide-react'

function OrderDetailContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const source = searchParams.get('source')
  const [order, setOrder] = useState<ExtendedOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState<{[key: string]: boolean}>({})

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadOrder()
  }, [params.id, source])

  const loadOrder = async () => {
    if (!params.id) return

    // Homepage 또는 Funeral 주문인 경우 customer_orders 테이블에서 조회
    if (source === 'homepage' || source === 'funeral') {
      const { data, error } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error loading homepage order:', error)
        router.push('/orders')
        return
      }

      // Homepage 주문을 OrderWithStores 형식으로 변환
      const homepageOrder: ExtendedOrder = {
        id: data.id,
        order_number: data.order_number,
        sender_store_id: null as any,
        receiver_store_id: data.assigned_store_id,
        type: 'receive',
        customer: {
          name: data.customer_name,
          phone: data.customer_phone,
          memo: data.customer_memo || '',
          company: data.customer_company || ''
        },
        recipient: {
          name: data.recipient_name,
          phone: data.recipient_phone,
          address: data.recipient_address
        },
        product: {
          type: data.mapped_category || data.product_category || '기타',
          name: data.product_name,
          price: data.mapped_price || data.original_price,
          quantity: data.quantity || 1,
          ribbon_text: data.ribbon_text,
          special_instructions: data.special_instructions
        },
        payment: {
          subtotal: data.total_amount,
          additional_fee: 0,
          additional_fee_reason: '',
          commission: Math.round((data.mapped_price || data.original_price) * 0.25),
          total: data.total_amount,
          points_used: data.points_used || 0,
          points_after: 0
        },
        status: data.status,
        completion: data.completion,
        completion_photos: data.completion?.photos || [],
        delivery_date: data.delivery_date,
        delivery_time: data.delivery_time,
        special_instructions: data.special_instructions,
        created_at: data.created_at,
        updated_at: data.updated_at
      }

      setOrder(homepageOrder)
    } else {
      // Client 주문은 기존 orders 테이블에서
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          sender_store:stores!sender_store_id(*),
          receiver_store:stores!receiver_store_id(*)
        `)
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error loading order:', error)
        router.push('/orders')
        return
      }

      setOrder(data)
    }
    
    setIsLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />
      case 'accepted': 
      case 'preparing': 
      case 'delivering': return <AlertCircle className="h-5 w-5 text-blue-500" />
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'cancelled':
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />
      default: return <Package className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: {[key: string]: string} = {
      'pending': '대기중',
      'accepted': '수락됨',
      'assigned': '배정됨',
      'preparing': '준비중',
      'delivering': '배송중',
      'completed': '완료',
      'cancelled': '취소',
      'rejected': '거절'
    }
    return statusMap[status] || status
  }

  if (isLoading) return <div className="p-8">Loading...</div>
  if (!order) return <div className="p-8">주문을 찾을 수 없습니다</div>

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">주문 상세</h1>
            <p className="text-gray-600">{order.order_number}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusIcon(order.status)}
          <span className="text-lg font-medium">{getStatusText(order.status)}</span>
          {source === 'homepage' && (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
              홈페이지 주문
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* 주문 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">주문 정보</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">주문번호</dt>
                <dd className="font-medium">{order.order_number}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">주문일시</dt>
                <dd>{formatDate(order.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">배송예정</dt>
                <dd>
                  {order.delivery_date} {order.delivery_time}
                </dd>
              </div>
              {order.special_instructions && (
                <div>
                  <dt className="text-gray-600 mb-1">특별 지시사항</dt>
                  <dd className="text-sm bg-yellow-50 p-2 rounded">
                    {order.special_instructions}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* 고객 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">고객 정보</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">주문자</dt>
                <dd className="font-medium">{order.customer.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">연락처</dt>
                <dd>{formatPhone(order.customer.phone)}</dd>
              </div>
              {order.customer.company && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">회사</dt>
                  <dd>{order.customer.company}</dd>
                </div>
              )}
              {order.customer.memo && (
                <div>
                  <dt className="text-gray-600 mb-1">메모</dt>
                  <dd className="text-sm bg-gray-50 p-2 rounded">{order.customer.memo}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* 수령인 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">수령인 정보</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">수령인</dt>
                <dd className="font-medium">{order.recipient.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">연락처</dt>
                <dd>{formatPhone(order.recipient.phone)}</dd>
              </div>
              <div>
                <dt className="text-gray-600 mb-1">배송지</dt>
                <dd className="text-sm">
                  {typeof order.recipient.address === 'string' 
                    ? order.recipient.address
                    : `${order.recipient.address.sido} ${order.recipient.address.sigungu} ${order.recipient.address.dong} ${order.recipient.address.detail || ''}`.trim()
                  }
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          {/* 화원 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">화원 정보</h2>
            <dl className="space-y-3">
              {order.sender_store && (
                <>
                  <div className="pb-3 border-b">
                    <dt className="text-gray-600 mb-1">발주 화원</dt>
                    <dd>
                      <div className="font-medium">{order.sender_store.business_name}</div>
                      <div className="text-sm text-gray-600">
                        {order.sender_store.owner_name} | {formatPhone(order.sender_store.phone)}
                      </div>
                    </dd>
                  </div>
                </>
              )}
              {order.receiver_store && (
                <div>
                  <dt className="text-gray-600 mb-1">수주 화원</dt>
                  <dd>
                    <div className="font-medium">{order.receiver_store.business_name}</div>
                    <div className="text-sm text-gray-600">
                      {order.receiver_store.owner_name} | {formatPhone(order.receiver_store.phone)}
                    </div>
                  </dd>
                </div>
              )}
              {!order.sender_store && !order.receiver_store && source === 'homepage' && (
                <div>
                  <dt className="text-gray-600 mb-1">발주처</dt>
                  <dd className="font-medium">홈페이지</dd>
                </div>
              )}
              {!order.receiver_store && (
                <div className="text-center py-3 text-orange-600">
                  미배정 주문
                </div>
              )}
            </dl>
          </div>

          {/* 상품 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">상품 정보</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">상품명</dt>
                <dd className="font-medium">{order.product.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">상품유형</dt>
                <dd>{order.product.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">수량</dt>
                <dd>{order.product.quantity}개</dd>
              </div>
              {order.product.ribbon_text && order.product.ribbon_text.length > 0 && (
                <div>
                  <dt className="text-gray-600 mb-1">리본 문구</dt>
                  <dd className="text-sm bg-pink-50 p-2 rounded">
                    {Array.isArray(order.product.ribbon_text) 
                      ? order.product.ribbon_text.join(', ')
                      : order.product.ribbon_text}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* 결제 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">결제 정보</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">상품금액</dt>
                <dd>{formatCurrency(order.payment?.subtotal || 0)}</dd>
              </div>
              {order.payment?.additional_fee && order.payment.additional_fee > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">추가요금</dt>
                  <dd>{formatCurrency(order.payment.additional_fee)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-600">수수료</dt>
                <dd>{formatCurrency(order.payment?.commission || 0)}</dd>
              </div>
              <div className="flex justify-between pt-3 border-t font-semibold">
                <dt>총 결제금액</dt>
                <dd className="text-lg">{formatCurrency(order.payment?.total || 0)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* 배송 완료 정보 */}
      {order.status === 'completed' && order.completion && (
        <div className="mt-6 bg-green-50 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            배송 완료 정보
          </h2>
          
          <div className="grid grid-cols-2 gap-6">
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">완료일시</dt>
                <dd className="font-medium">
                  {order.completion.completed_at
                    ? new Date(order.completion.completed_at).toLocaleString('ko-KR')
                    : order.updated_at
                    ? new Date(order.updated_at).toLocaleString('ko-KR')
                    : '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">인수자</dt>
                <dd className="font-medium">{order.completion.recipient_name || '-'}</dd>
              </div>
              {order.completion.note && (
                <div>
                  <dt className="text-gray-600 mb-1">배송 메모</dt>
                  <dd className="text-sm bg-white p-2 rounded">{order.completion.note}</dd>
                </div>
              )}
            </dl>

            {/* 배송 사진 */}
            {order.completion.photos && order.completion.photos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">배송 완료 사진</h3>
                <div className="grid grid-cols-2 gap-2">
                  {order.completion.photos.map((photo: string, index: number) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                      {!imageError[photo] ? (
                        <img
                          src={photo}
                          alt={`배송완료 사진 ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                          onError={() => setImageError(prev => ({...prev, [photo]: true}))}
                          onClick={() => window.open(photo, '_blank')}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-200">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminOrderDetailPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <OrderDetailContent />
    </Suspense>
  )
}