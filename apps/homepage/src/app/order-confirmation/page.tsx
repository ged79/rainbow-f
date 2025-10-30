'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface OrderData {
  id: string
  order_number: string
  product_name: string
  quantity: number
  total_amount: number
  delivery_date: string
  delivery_time: string
  recipient_name: string
  recipient_phone: string
  delivery_address: string
  delivery_message: string | null
  points_earned: number
  is_referral: boolean
  created_at: string
  customer_name: string
  customer_phone: string
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) {
      setError('주문 정보를 찾을 수 없습니다.')
      setLoading(false)
      return
    }

    loadOrderData()
  }, [orderId])

  const loadOrderData = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) throw error

      setOrder(data)
    } catch (err: any) {
      console.error('주문 조회 오류:', err)
      setError('주문 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">오류</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 성공 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            주문이 접수되었습니다!
          </h1>
          <p className="text-gray-600">
            고객님의 소중한 주문을 받았습니다.
          </p>
        </div>

        {/* 주문 정보 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b-2 border-purple-100">
            📦 주문정보
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">주문번호</span>
              <span className="font-semibold text-purple-600">{order.order_number}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-600">상품명</span>
              <span className="font-semibold">{order.product_name}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-600">수량</span>
              <span className="font-semibold">{order.quantity}개</span>
            </div>
            
            <div className="flex justify-between py-2 border-t pt-3">
              <span className="text-gray-600 text-lg">결제금액</span>
              <span className="font-bold text-xl text-purple-600">
                {order.total_amount.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* 배송 정보 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b-2 border-purple-100">
            🚚 배송정보
          </h2>
          
          <div className="space-y-3">
            <div className="py-2">
              <div className="text-gray-600 mb-1">받는분</div>
              <div className="font-semibold">{order.recipient_name}</div>
            </div>
            
            <div className="py-2">
              <div className="text-gray-600 mb-1">연락처</div>
              <div className="font-semibold">{order.recipient_phone}</div>
            </div>
            
            <div className="py-2">
              <div className="text-gray-600 mb-1">배송주소</div>
              <div className="font-semibold">{order.delivery_address}</div>
            </div>
            
            {order.delivery_message && (
              <div className="py-2">
                <div className="text-gray-600 mb-1">배송 메시지</div>
                <div className="font-semibold text-purple-600">{order.delivery_message}</div>
              </div>
            )}
          </div>
        </div>

        {/* 배송 일시 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b-2 border-purple-100">
            📅 배송일시
          </h2>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {order.delivery_date}
            </div>
            <div className="text-lg text-gray-700">
              {order.delivery_time}
            </div>
          </div>
        </div>

        {/* 포인트 적립 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 mb-6 text-white">
          <h2 className="text-xl font-bold mb-4 pb-3 border-b-2 border-white/20">
            💰 포인트 적립
          </h2>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-lg">
                {order.is_referral ? '추천번호 입력 5%' : '일반 구매 3%'}
              </span>
              <span className="text-2xl font-bold">
                {order.points_earned.toLocaleString()}P
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="flex items-start">
              <span className="mr-2">•</span>
              <span>회원가입 시 4,900P 즉시 적립</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">•</span>
              <span>주문 시 금액의 3~5% 적립</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">•</span>
              <span>추천인도 3% 적립</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">•</span>
              <span>5,000P 이상 시 현금인출 가능</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">•</span>
              <span>포인트 인출 및 사용은 회원가입 후 가능</span>
            </p>
          </div>
        </div>

        {/* 회원가입 CTA */}
        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            아직 회원이 아니신가요?
          </h3>
          <p className="text-gray-600 mb-4">
            지금 가입하고 <span className="text-purple-600 font-bold">4,900P</span>를 받으세요!
          </p>
          <a
            href="https://rainbow-f.kr/signup"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
          >
            회원가입하기
          </a>
        </div>

        {/* 하단 버튼 */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-white text-purple-600 border-2 border-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            홈으로
          </button>
          <button
            onClick={() => router.push('/my-orders')}
            className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            주문내역
          </button>
        </div>

        {/* 고객센터 */}
        <div className="mt-6 text-center text-gray-600">
          <p className="text-sm">문의사항이 있으신가요?</p>
          <a href="tel:010-7741-4569" className="text-purple-600 font-semibold hover:underline">
            📞 010-7741-4569
          </a>
        </div>
      </div>
    </div>
  )
}
