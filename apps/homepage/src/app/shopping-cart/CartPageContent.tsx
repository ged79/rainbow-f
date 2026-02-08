'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Heart, Clock, Search, Trash2, Plus, Minus, User, Phone, TrendingUp, Gift } from 'lucide-react'
import EmotionalNavbar from '../../components/EmotionalNavbar'
import CategoryTabs from '../../components/CategoryTabs'

type TabType = 'cart' | 'wishlist' | 'orders'

interface OrderItem {
  product_id: string
  product_name: string
  product_image: string
  price: number
  quantity: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  recipient_name: string
  recipient_phone: string
  recipient_address: string | {
    dong?: string
    sido?: string
    detail?: string
    sigungu?: string
    postal_code?: string
  }
  delivery_date?: string
  delivery_time?: string
  total_amount: number
  status: string
  created_at: string
  order_items: OrderItem[]
  updated_at?: string
  completion?: {
    completed_at: string
    recipient_name: string
    note?: string
    photos?: string[]
  }
}

interface PointsData {
  total: number
  available: number
  coupons: any[]
  count: number
  canUse: boolean
  message?: string
}

export default function CartPageContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('cart')
  const [cart, setCart] = useState<any[]>([])
  const [wishlist, setWishlist] = useState<any[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [mounted, setMounted] = useState(false)
  
  // 조회용 정보 - 기본값 설정
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  
  // 포인트 정보 추가
  const [pointsData, setPointsData] = useState<PointsData | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [expandedReviews, setExpandedReviews] = useState<{[key: string]: boolean}>({})  // 리뷰 펼침 상태

  // URL 파라미터 처리
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'orders' || tab === 'wishlist' || tab === 'cart') {
      setActiveTab(tab as TabType)
      
      // 로그인한 사용자가 orders 탭을 요청한 경우 자동 조회
      if (tab === 'orders' && customerName && customerPhone && !hasAutoLoaded) {
        fetchOrderHistory()
        setHasAutoLoaded(true)
      }
    }
  }, [searchParams, customerName, customerPhone, hasAutoLoaded])

  useEffect(() => {
    setMounted(true)
    loadCart()
    loadLocalWishlist()
    
    // 로그인된 사용자 정보 확인
    const memberSession = localStorage.getItem('flower-member')
    if (memberSession) {
      try {
        const member = JSON.parse(memberSession)
        setCustomerName(member.name || '')
        setCustomerPhone(member.phone || '')
        setIsLoggedIn(true)
      } catch (e) {
        console.error('Failed to parse member session:', e)
      }
    } else {
      // 로그인하지 않은 경우 마지막 사용 정보 불러오기
      const savedName = localStorage.getItem('lastCustomerName')
      const savedPhone = localStorage.getItem('lastCustomerPhone')
      if (savedName && savedPhone) {
        setCustomerName(savedName)
        setCustomerPhone(savedPhone)
      }
      setIsLoggedIn(false)
    }
  }, [])

  const loadCart = () => {
    if (typeof window !== 'undefined') {
      const savedCart = JSON.parse(localStorage.getItem('flowerCart') || '[]')
      setCart(savedCart)
      calculateTotal(savedCart)
    }
  }

  const loadLocalWishlist = () => {
    if (typeof window !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setWishlist(saved)
    }
  }

  const calculateTotal = (cartItems: any[]) => {
    const total = cartItems.reduce((sum, item) => {
      const price = item.price || 0
      const quantity = item.quantity || 1
      return sum + (price * quantity)
    }, 0)
    setTotalAmount(total)
  }

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    const newCart = [...cart]
    newCart[index].quantity = newQuantity
    setCart(newCart)
    localStorage.setItem('flowerCart', JSON.stringify(newCart))
    calculateTotal(newCart)
  }

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index)
    setCart(newCart)
    localStorage.setItem('flowerCart', JSON.stringify(newCart))
    calculateTotal(newCart)
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const clearCart = () => {
    setCart([])
    localStorage.setItem('flowerCart', JSON.stringify([]))
    setTotalAmount(0)
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const moveToCart = (item: any) => {
    const cartItem = {
      id: item.id || item.product_id,
      name: item.name || item.product_name,
      price: item.price || item.product_price || 0,
      image: item.image || item.product_image,
      quantity: 1
    }
    
    const newCart = [...cart, cartItem]
    setCart(newCart)
    localStorage.setItem('flowerCart', JSON.stringify(newCart))
    calculateTotal(newCart)
    window.dispatchEvent(new Event('cartUpdated'))
    
    // 찜 목록에서 제거
    const newWishlist = wishlist.filter(w => (w.id || w.product_id) !== cartItem.id)
    setWishlist(newWishlist)
    localStorage.setItem('wishlist', JSON.stringify(newWishlist))
  }

  const handleReviewSubmit = async () => {
    if (!selectedOrder || !rating) return
    
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          rating,
          review: reviewText,
          customer_phone: selectedOrder.customer_phone
        })
      })
      
      if (res.ok) {
        alert('리뷰가 등록되었습니다')
        setShowReviewModal(false)
        setRating(5)
        setReviewText('')
        // 주문 목록 새로고침
        fetchOrderHistory()
      }
    } catch (error) {
      alert('리뷰 등록 실패')
    }
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    setCustomerPhone(formatted)
  }

  const fetchOrderHistory = async () => {
    if (!customerName || !customerPhone) {
      alert('이름과 전화번호를 입력해주세요')
      return
    }

    setIsLoading(true)
    try {
      // 주문 내역 조회 (포인트 포함)
      const orderRes = await fetch(`/api/orders?name=${encodeURIComponent(customerName)}&phone=${encodeURIComponent(customerPhone)}`)
      if (orderRes.ok) {
        const data = await orderRes.json()
        setOrders(data.orders || [])
        setPointsData(data.points || null) // 포인트 정보 저장
        
        // 정보 저장
        localStorage.setItem('lastCustomerName', customerName)
        localStorage.setItem('lastCustomerPhone', customerPhone)
        
        if (data.orders && data.orders.length > 0) {
          setActiveTab('orders')
        } else {
          alert('주문 내역이 없습니다')
        }
      } else {
        const errorData = await orderRes.json()
        alert(errorData.error || '조회에 실패했습니다')
      }

      // 찜 목록 조회
      const wishRes = await fetch(`/api/wishlist?name=${encodeURIComponent(customerName)}&phone=${encodeURIComponent(customerPhone)}`)
      if (wishRes.ok) {
        const { wishlists } = await wishRes.json()
        if (wishlists && wishlists.length > 0) {
          setWishlist(wishlists)
        }
      }
    } catch (error) {
      console.error('조회 실패:', error)
      alert('조회에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const reorder = (order: Order) => {
    const newCart = order.order_items.map(item => ({
      id: item.product_id,
      name: item.product_name,
      image: item.product_image,
      price: item.price,
      quantity: item.quantity
    }))
    
    setCart(newCart)
    localStorage.setItem('flowerCart', JSON.stringify(newCart))
    calculateTotal(newCart)
    window.dispatchEvent(new Event('cartUpdated'))
    setActiveTab('cart')
    alert('장바구니에 담았습니다')
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      pending: { text: '주문접수', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { text: '확인완료', color: 'bg-blue-100 text-blue-800' },
      preparing: { text: '준비중', color: 'bg-purple-100 text-purple-800' },
      delivering: { text: '배송중', color: 'bg-indigo-100 text-indigo-800' },
      completed: { text: '배송완료', color: 'bg-green-100 text-green-800' },
      cancelled: { text: '취소됨', color: 'bg-red-100 text-red-800' }
    }
    const { text, color } = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{text}</span>
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50">
      <EmotionalNavbar fixed={true} />
      <CategoryTabs />
      
      <div className="pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">장바구니</h1>
            
            {/* 주문자 정보 및 조회 섹션 - 항상 표시 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-rose-500" />
                주문자 정보 및 주문내역 조회
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                  />
                </div>
                
                <div>
                  <input
                    type="tel"
                    placeholder="010-1234-5678"
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={fetchOrderHistory}
                    disabled={isLoading || !customerName || !customerPhone}
                    className="w-full px-6 py-2.5 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    {isLoading ? '조회중...' : '주문내역 조회'}
                  </button>
                </div>
              </div>
              
              {/* 안내 메시지 */}
              <p className="mt-3 text-sm text-gray-500">
                ※ 이름과 전화번호로 이전 주문내역과 포인트를 조회하실 수 있습니다. 
                {!customerName && !customerPhone && '로그인하시면 자동으로 정보가 입력됩니다.'}
              </p>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('cart')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'cart' 
                  ? 'text-rose-500 border-b-2 border-rose-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              장바구니 ({cart.length})
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'wishlist' 
                  ? 'text-rose-500 border-b-2 border-rose-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              찜한 상품 ({wishlist.length})
            </button>
            {(orders.length > 0 || activeTab === 'orders') && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'orders' 
                    ? 'text-rose-500 border-b-2 border-rose-500' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                주문내역 ({orders.length})
              </button>
            )}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* 장바구니 탭 */}
            {activeTab === 'cart' && (
              <div className="p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">장바구니가 비어있습니다</p>
                    <Link 
                      href="/" 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      쇼핑 계속하기
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-semibold text-gray-900">상품 목록</h2>
                      <button
                        onClick={clearCart}
                        className="text-gray-500 hover:text-red-500 flex items-center gap-1 text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        전체삭제
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {cart.map((item, index) => (
                        <div key={index} className="flex gap-4 pb-4 border-b">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">{item.name}</h3>
                            <p className="text-gray-600 text-sm mt-1">
                              {(item.price || 0).toLocaleString()}원
                            </p>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                              >
                                <Minus className="w-4 h-4 mx-auto" />
                              </button>
                              <span className="w-12 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                              >
                                <Plus className="w-4 h-4 mx-auto" />
                              </button>
                              
                              <button
                                onClick={() => removeFromCart(index)}
                                className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">
                              {((item.price || 0) * item.quantity).toLocaleString()}원
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex justify-between text-xl font-bold mb-4">
                        <span>총 결제금액</span>
                        <span className="text-rose-500">{totalAmount.toLocaleString()}원</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (cart.length === 1) {
                            // 상품 1개일 때는 기존 방식
                            window.location.href = `/order?id=${cart[0].id}`
                          } else {
                            // 여러 상품일 때는 장바구니 모드
                            window.location.href = '/order?mode=cart'
                          }
                        }}
                        className="w-full py-3 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition-colors"
                      >
                        주문하기
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 찜한 상품 탭 */}
            {activeTab === 'wishlist' && (
              <div className="p-6">
                {wishlist.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">찜한 상품이 없습니다</p>
                    <Link 
                      href="/" 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    >
                      <Heart className="w-5 h-5" />
                      상품 둘러보기
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {wishlist.map((item) => (
                      <div key={item.id || item.product_id} className="bg-gray-50 rounded-lg p-3">
                        <img
                          src={item.image || item.product_image}
                          alt={item.name || item.product_name}
                          className="w-full aspect-square object-cover rounded-lg mb-3"
                        />
                        <h3 className="font-medium text-sm mb-1 line-clamp-2">
                          {item.name || item.product_name}
                        </h3>
                        <p className="text-rose-500 font-bold mb-2">
                          {(item.price || item.product_price || 0).toLocaleString()}원
                        </p>
                        <button
                          onClick={() => moveToCart(item)}
                          className="w-full py-2 bg-rose-500 text-white text-sm rounded hover:bg-rose-600 transition-colors"
                        >
                          장바구니 담기
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 주문내역 탭 */}
            {activeTab === 'orders' && (
              <div className="p-6">
                {/* 포인트 현황 카드 - 새로 추가 */}
                {pointsData && pointsData.total > 0 && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6 border border-yellow-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <Gift className="w-5 h-5 text-orange-500" />
                          나의 포인트
                        </h3>
                        <p className="text-3xl font-bold text-orange-600">
                          {pointsData.total.toLocaleString()}원
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {pointsData.count}개 쿠폰 보유
                        </p>
                      </div>
                      
                      {!isLoggedIn && pointsData.message && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-2">
                            포인트를 사용하려면
                          </p>
                          <Link 
                            href={`/signup?phone=${encodeURIComponent(customerPhone)}&name=${encodeURIComponent(customerName)}`}
                            className="inline-block px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm font-medium"
                          >
                            회원가입 하기 →
                          </Link>
                        </div>
                      )}
                    </div>
                    
                    {/* 포인트 내역 */}
                    {pointsData.coupons && pointsData.coupons.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-yellow-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">최근 적립 내역</p>
                        <div className="space-y-1">
                          {pointsData.coupons.slice(0, 3).map((coupon: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {coupon.type === 'purchase' ? '구매 적립' : 
                                 coupon.type === 'referral' ? '추천 보상' : 
                                 coupon.type === 'welcome' ? '회원가입 쿠폰' : '포인트'}
                              </span>
                              <span className="font-medium text-gray-900">
                                +{coupon.amount.toLocaleString()}원
                              </span>
                            </div>
                          ))}
                        </div>
                        {pointsData.coupons.length > 3 && (
                          <p className="text-xs text-gray-500 mt-2">
                            외 {pointsData.coupons.length - 3}개 더 보기
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* 추천 통계 (나중에 추가) */}
                    {isLoggedIn && (
                      <div className="mt-4 pt-4 border-t border-yellow-200">
                        <Link 
                          href="/my-referrals"
                          className="flex items-center justify-between text-sm hover:bg-yellow-100 -mx-2 px-2 py-1 rounded transition-colors"
                        >
                          <span className="text-gray-700">나의 추천 현황</span>
                          <TrendingUp className="w-4 h-4 text-orange-500" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">주문 내역이 없습니다</p>
                    {customerName && customerPhone && (
                      <p className="text-sm text-gray-400 mt-2">
                        입력하신 정보로 조회된 주문이 없습니다.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900">
                                주문번호: 
                              </span>
                              <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">
                                {order.order_number.split('-').pop()}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleDateString()} 주문
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(order.status)}
                            <p className="font-bold text-lg mt-1">
                              {order.total_amount.toLocaleString()}원
                            </p>
                          </div>
                        </div>
                        
                        {/* 수령인 및 배송지 정보 추가 */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">수령인:</span>
                              <span className="font-medium ml-2">{order.recipient_name}</span>
                              <span className="text-gray-500 ml-2">({order.recipient_phone})</span>
                            </div>
                            <div>
                              <span className="text-gray-600">배송지:</span>
                              <span className="font-medium ml-2">
                                {typeof order.recipient_address === 'object' && order.recipient_address
                                  ? `${order.recipient_address.sido || ''} ${order.recipient_address.sigungu || ''} ${order.recipient_address.dong || ''} ${order.recipient_address.detail || ''}`.trim()
                                  : order.recipient_address}
                              </span>
                            </div>
                            {order.delivery_date && (
                              <div>
                                <span className="text-gray-600">배송일:</span>
                                <span className="font-medium ml-2">{order.delivery_date}</span>
                                {order.delivery_time && <span className="text-gray-500 ml-1">{order.delivery_time}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          {order.order_items.map((item, idx) => (
                            <div key={idx} className="flex gap-3 text-sm">
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-gray-500">
                                  {item.price.toLocaleString()}원 × {item.quantity}개
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* 배송 완료 정보 표시 */}
                        {order.status === 'completed' && order.completion && (
                          <>
                            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex gap-3">
                                {/* 배송 사진 */}
                                {order.completion.photos && order.completion.photos.length > 0 && (
                                  <img
                                    src={order.completion.photos[0]}
                                    alt="배송 사진"
                                    className="w-20 h-20 object-cover rounded border border-green-300 cursor-pointer hover:opacity-90"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (order.completion?.photos && order.completion.photos[0]) {
                                        window.open(order.completion.photos[0], '_blank')
                                      }
                                    }}
                                  />
                                )}
                                
                                {/* 배송 정보 */}
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-green-800 mb-1">배송 완료</p>
                                  
                                  {order.completion.recipient_name && (
                                    <p className="text-sm text-gray-700">
                                      인수자: <span className="font-medium">{order.completion.recipient_name}</span>
                                    </p>
                                  )}
                                  
                                  <p className="text-xs text-gray-600 mt-1">
                                    배송완료: {order.status === 'completed' && order.updated_at 
                                      ? (() => {
                                          const date = new Date(order.updated_at);
                                          // UTC를 KST로 변환 (+9시간)
                                          date.setHours(date.getHours() + 9);
                                          return date.toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit', 
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          });
                                        })()
                                      : ''}
                                  </p>
                                </div>
                                
                                {/* 리뷰 버튼 */}
                                {!(order as any).review && (
                                  <div className="flex items-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedOrder(order)
                                        setShowReviewModal(true)
                                      }}
                                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                                    >
                                      리뷰 작성
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* 리뷰 내용 표시 */}
                            {(order as any).review && (order as any).review.review && (
                              <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <span key={i} className={`text-xs ${i < (order as any).review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date((order as any).review.created_at).toLocaleDateString('ko-KR')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">
                                  {(order as any).review.review}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 리뷰 모달 */}
      {showReviewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">리뷰 작성</h3>
            
            {/* 상품 정보 */}
            <div className="flex gap-3 mb-4 pb-4 border-b">
              {selectedOrder.order_items[0] && (
                <>
                  <img
                    src={selectedOrder.order_items[0].product_image}
                    alt={selectedOrder.order_items[0].product_name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{selectedOrder.order_items[0].product_name}</p>
                    <p className="text-sm text-gray-500">주문번호: {selectedOrder.order_number.split('-').pop()}</p>
                  </div>
                </>
              )}
            </div>
            
            {/* 별점 */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">만족도</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-3xl transition-colors"
                  >
                    <span className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* 리뷰 텍스트 */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">리뷰 내용 (선택)</p>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                rows={4}
                placeholder="상품에 대한 소감을 남겨주세요"
              />
            </div>
            
            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setRating(5)
                  setReviewText('')
                }}
                className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReviewSubmit}
                className="flex-1 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium"
              >
                리뷰 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}