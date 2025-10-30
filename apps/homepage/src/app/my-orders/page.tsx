'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const memberData = localStorage.getItem('flower-member')
    if (!memberData) {
      router.push('/login')
      return
    }

    const member = JSON.parse(memberData)
    const res = await fetch(`/api/orders?name=${member.name}&phone=${member.phone}`)
    const data = await res.json()
    
    if (data.success) {
      setOrders(data.orders)
    }
    setLoading(false)
  }

  const handleCancel = async (orderId: string) => {
    if (!confirm('정말 취소하시겠습니까?')) return
    
    const res = await fetch('/api/orders/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        reason: '고객 요청'
      })
    })
    
    if (res.ok) {
      alert('주문이 취소되었습니다')
      fetchOrders()
    } else {
      alert('취소 실패')
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">내 주문 내역</h1>
      
      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-8">주문 내역이 없습니다</p>
      ) : (
        orders.map(order => (
          <div key={order.id} className="border p-4 mb-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg">{order.product_name}</p>
                <p className="text-sm text-gray-600">주문번호: {order.order_number}</p>
                <p>금액: {order.total_amount?.toLocaleString()}원</p>
                <p className="text-sm">
                  상태: 
                  <span className={`ml-2 font-medium ${
                    order.status === 'cancelled' ? 'text-red-500' :
                    order.status === 'completed' ? 'text-green-500' :
                    'text-yellow-500'
                  }`}>
                    {order.status === 'pending' && '주문 대기'}
                    {order.status === 'confirmed' && '주문 확인'}
                    {order.status === 'delivering' && '배송 중'}
                    {order.status === 'completed' && '배송 완료'}
                    {order.status === 'cancelled' && '취소됨'}
                  </span>
                </p>
                <p className="text-sm">배송일: {order.delivery_date}</p>
              </div>
              {order.status === 'pending' && (
                <button
                  onClick={() => handleCancel(order.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
                >
                  주문 취소
                </button>
              )}
              {order.status === 'cancelled' && (
                <span className="text-red-500 text-sm">취소 완료</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}