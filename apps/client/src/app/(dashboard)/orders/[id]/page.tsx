'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStore } from '@/stores/useStore'
import { apiService } from '@/services/api'
import { 
  ArrowLeft,
  Package, 
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  CheckCircle,
  Building,
  Camera,
  FileText,
  Upload,
  X,
  Store,
  Clock,
  Truck
} from 'lucide-react'
import { PRODUCT_CATEGORIES } from '@flower/shared/constants'
import type { OrderWithStores, OrderStatus } from '@flower/shared/types'
import { formatCurrency, formatPhone } from '@flower/shared/utils'
import toast from 'react-hot-toast'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentStore } = useStore()
  const [order, setOrder] = useState<OrderWithStores | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [showCompletionForm, setShowCompletionForm] = useState(false)
  const [completionData, setCompletionData] = useState({
    receiverName: '',
    receiverPhone: '',
    deliveryMemo: '',
    deliveryPhotos: [] as File[]
  })
  const [photoPreview, setPhotoPreview] = useState<string[]>([])
  
  // 가격 등급 판별 함수
  const getPriceGrade = (price: number | undefined, productType: string | undefined) => {
    if (!price || !productType) return '기본'
    const category = PRODUCT_CATEGORIES.find(cat => cat.type === productType)
    if (!category) return '기본'
    const basePrice = category.defaultPrice
    if (price <= basePrice * 1.1) return '기본'
    if (price <= basePrice * 1.4) return '고급'
    return '특대'
  }
  
  useEffect(() => {
    if (!currentStore) {
      router.push('/login')
      return
    }
    loadOrder()
  }, [currentStore, params.id])
  
  const loadOrder = async () => {
    if (!params.id) return
    try {
      const result = await apiService.getOrder(params.id as string)
      if (result.data) {
        setOrder(result.data)
      } else {
        toast.error('주문을 찾을 수 없습니다')
        router.push('/orders')
      }
    } catch (error) {
      toast.error('주문 정보를 불러올 수 없습니다')
      router.push('/orders')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return
    setIsUpdating(true)
    try {
      const result = await apiService.updateOrderStatus(order.id, newStatus)
      if (result.data) {
        setOrder(result.data)
        toast.success('주문 상태가 업데이트되었습니다')
        if (newStatus === 'accepted') {
          setShowCompletionForm(true)
        }
      } else {
        throw new Error('상태 업데이트 실패')
      }
    } catch (error: any) {
      toast.error(error.message || '상태 업데이트 실패')
    } finally {
      setIsUpdating(false)
    }
  }
  
  const handleCancel = async () => {
    if (!order) return
    if (!confirm('주문을 취소하시겠습니까?')) return
    setIsUpdating(true)
    try {
      const result = await apiService.updateOrderStatus(order.id, 'cancelled')
      if (result.data) {
        setOrder(result.data)
        toast.success('주문이 취소되었습니다')
      } else {
        throw new Error('취소 실패')
      }
    } catch (error: any) {
      toast.error(error.message || '주문 취소 실패')
    } finally {
      setIsUpdating(false)
    }
  }
  
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + completionData.deliveryPhotos.length > 3) {
      toast.error('최대 3장까지 업로드 가능합니다')
      return
    }
    const newPhotos = [...completionData.deliveryPhotos, ...files]
    setCompletionData({...completionData, deliveryPhotos: newPhotos})
    // Preview
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }
  
  const removePhoto = (index: number) => {
    const newPhotos = completionData.deliveryPhotos.filter((_, i) => i !== index)
    const newPreviews = photoPreview.filter((_, i) => i !== index)
    setCompletionData({...completionData, deliveryPhotos: newPhotos})
    setPhotoPreview(newPreviews)
  }
  
  const handleComplete = async () => {
    if (!order || !completionData.receiverName || completionData.deliveryPhotos.length === 0) {
      toast.error('수령인 이름과 배송 사진을 첨부해주세요')
      return
    }
    setIsUpdating(true)
    let retryCount = 0
    const maxRetries = 3
    while (retryCount < maxRetries) {
      try {
        setUploadProgress(completionData.deliveryPhotos.length > 0 ? '사진 업로드 중...' : '처리 중...')
        const result = await apiService.completeOrder({
          orderId: order.id,
          recipient_name: completionData.receiverName,
          note: completionData.deliveryMemo,
          photos: completionData.deliveryPhotos
        })
        if (result.data) {
          toast.success('배송이 완료되었습니다')
          setUploadProgress('')
          setShowCompletionForm(false)
          loadOrder()
          break
        }
      } catch (error: any) {
        retryCount++
        if (retryCount >= maxRetries) {
          toast.error(`완료 처리 실패: ${error.message || '네트워크 오류'}`)
        } else {
          toast.error(`재시도 중... (${retryCount}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
        }
      }
    }
    setIsUpdating(false)
  }
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    const labels: Record<string, string> = {
      pending: '대기',
      accepted: '수락',
      completed: '완료',
      cancelled: '취소'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    )
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }
  
  if (!order) return null
  
  const isSender = order.sender_store_id === currentStore?.id
  const isReceiver = order.receiver_store_id === currentStore?.id
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={20} />
        <span>돌아가기</span>
      </button>
      
      <div className="bg-white rounded-lg shadow">
        {/* Compact Header - 2 lines */}
        <div className="p-3 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold">#{order.order_number}</h1>
                {getStatusBadge(order.status)}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(order.created_at).toLocaleDateString('ko-KR')} {new Date(order.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex gap-2">
              {isSender && order.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      const editData = {
                        order_id: order.id,
                        customer_name: order.customer?.name,
                        customer_phone: order.customer?.phone,
                        customer_company: order.customer?.company,
                        customer_memo: order.customer?.memo,
                        recipient_name: order.recipient?.name,
                        recipient_phone: order.recipient?.phone,
                        recipient_address: order.recipient?.address,
                        delivery_date: order.delivery_date,
                        delivery_time: order.delivery_time,
                        product_type: order.product?.type,
                        product_name: order.product?.name,
                        product_price: order.product?.price,
                        product_quantity: order.product?.quantity,
                        ribbon_text: order.product?.ribbon_text,
                        special_instructions: order.product?.special_instructions,
                        receiver_store_id: order.receiver_store_id,
                        additional_fee: order.payment?.additional_fee || 0,
                        additional_fee_reason: order.payment?.additional_fee_reason || ''
                      }
                      sessionStorage.setItem('editOrderData', JSON.stringify(editData))
                      router.push('/orders/new')
                    }}
                    className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                  >
                    취소
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content - Compact List */}
        <div className="p-4 space-y-2">
          
          {/* 화원 정보 - 한 줄 */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-gray-600 w-16">발주화원</span>
            <span className="font-semibold flex-1 text-center">{order.sender_store?.business_name || '알 수 없음'}</span>
            <span className="text-sm text-gray-600">{order.sender_store?.phone && formatPhone(order.sender_store.phone)}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm text-gray-600 w-16">수주화원</span>
            <span className="font-semibold flex-1 text-center">{order.receiver_store?.business_name || '배정 대기'}</span>
            <span className="text-sm text-gray-600">{order.receiver_store?.phone && formatPhone(order.receiver_store.phone)}</span>
          </div>
          
          {/* 주문자 - 한 줄 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="text-sm text-gray-600 w-16">주문자</span>
            <span className="font-semibold flex-1 text-center">{order.customer?.name}</span>
            <span className="text-sm text-gray-600">{formatPhone(order.customer?.phone || '')}</span>
          </div>
          
          {/* 수령인 - 한 줄 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="text-sm text-gray-600 w-16">수령인</span>
            <span className="font-semibold flex-1 text-center">{order.recipient?.name}</span>
            <span className="text-sm text-gray-600">{formatPhone(order.recipient?.phone || '')}</span>
          </div>
          
          {/* 배송지 */}
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={14} className="text-gray-600" />
              <span className="text-sm font-semibold">배송지</span>
            </div>
            <p className="text-sm text-gray-600">
              {typeof order.recipient?.address === 'object' 
                ? order.recipient.address.detail || `${order.recipient.address.sido} ${order.recipient.address.sigungu} ${order.recipient.address.dong || ''}`
                : order.recipient?.address}
            </p>
          </div>
          
          {/* 상품 정보 */}
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-pink-500" />
                <span className="text-sm font-semibold">상품</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {order.product?.name || order.product?.type}
                  {order.product?.quantity && order.product.quantity > 1 && ` × ${order.product.quantity}개`}
                </p>
                {/* Homepage 원본 상품명 표시 */}
                {order.product?.original_name && order.product.original_name !== order.product?.name && (
                  <p className="text-xs text-gray-500">({order.product.original_name})</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">
                  {getPriceGrade(order.product?.price, order.product?.type)}
                </span>
                <span className="text-lg font-bold text-pink-600">
                  {formatCurrency((order.product?.price || 0) * (order.product?.quantity || 1))}
                </span>
              </div>
            </div>
            
            {/* 리본 문구 - 각 줄 분리 */}
            {order.product?.ribbon_text && (
              <div className="mt-2 pt-2 border-t space-y-1">
                {Array.isArray(order.product.ribbon_text) ? (
                  order.product.ribbon_text.map((text, index) => (
                    <p key={index} className="text-sm text-purple-700">
                      {text}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-purple-700">
                    {order.product.ribbon_text}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* 배송 - 한 줄 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Truck size={14} className="text-blue-500" />
              <span className="text-sm font-semibold">배송</span>
            </div>
            <span className="font-medium">
              {(() => {
                // 최상위 필드 확인
                let dateStr = order.delivery_date;
                let timeStr = order.delivery_time;
                
                // recipient JSONB 내부도 확인 (fallback)
                if (!dateStr && order.recipient && typeof order.recipient === 'object') {
                  dateStr = (order.recipient as any).delivery_date;
                }
                if (!timeStr && order.recipient && typeof order.recipient === 'object') {
                  timeStr = (order.recipient as any).delivery_time;
                }
                
                if (dateStr && timeStr) {
                  const date = new Date(dateStr);
                  const year = date.getFullYear();
                  const month = date.getMonth() + 1;
                  const day = date.getDate();
                  
                  // "즉시배송" 처리
                  if (timeStr === '즉시배송') {
                    return `${year}. ${month}. ${day}. 즉시배송 (3시간 내)`;
                  }
                  
                  // HH:MM 형식을 "오전/오후 X시"로 변환
                  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
                  if (timeMatch) {
                    const hour = parseInt(timeMatch[1]);
                    const minute = parseInt(timeMatch[2]);
                    const period = hour < 12 ? '오전' : '오후';
                    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                    const timeDisplay = minute === 0 ? `${period} ${displayHour}시` : `${period} ${displayHour}시 ${minute}분`;
                    return `${year}. ${month}. ${day}. ${timeDisplay}`;
                  }
                  
                  return `${year}. ${month}. ${day}. ${timeStr}`;
                }
                return '배송 정보 확인 중';
              })()}
            </span>
          </div>
          
          {/* 결제 */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="text-gray-600" />
                <span className="text-sm font-semibold">결제</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(order.payment?.total || 0)}</span>
            </div>
          </div>
          
          {/* 배송 완료 정보 (있을 경우) */}
          {order.status === 'completed' && order.completion && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} className="text-green-600" />
                <span className="font-semibold">배송 완료</span>
                <span className="text-sm text-gray-600">{new Date(order.completion.completed_at).toLocaleString('ko-KR')}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">인수자: <span className="font-medium text-gray-900">{order.completion.recipient_name}</span></p>
                  {order.completion.note && (
                    <p className="text-sm text-gray-600 mt-1">메모: {order.completion.note}</p>
                  )}
                </div>
                {order.completion.photos && order.completion.photos.length > 0 && (
                  <div className="flex gap-2">
                    {order.completion.photos.map((photo, idx) => (
                      <img 
                        key={idx} 
                        src={photo} 
                        alt={`배송사진 ${idx + 1}`}
                        className="h-16 w-16 rounded border cursor-pointer hover:opacity-90 object-cover"
                        onClick={() => window.open(photo, '_blank')}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        {isReceiver && order.status === 'pending' && (
          <div className="p-4 border-t bg-gray-50 flex gap-3">
            <button
              onClick={() => handleStatusUpdate('accepted')}
              disabled={isUpdating}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium"
            >
              주문 수락
            </button>
            <button
              onClick={() => handleStatusUpdate('rejected')}
              disabled={isUpdating}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium"
            >
              주문 거절
            </button>
          </div>
        )}
        
        {isReceiver && order.status === 'accepted' && (
          <div className="p-4 border-t bg-gray-50">
            {!showCompletionForm ? (
              <button
                onClick={() => setShowCompletionForm(true)}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
              >
                배송 완료 처리
              </button>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle size={20} />
                  배송 완료 정보 입력
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      인수자 이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={completionData.receiverName}
                      onChange={(e) => setCompletionData({...completionData, receiverName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      인수자 연락처
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={completionData.receiverPhone}
                      onChange={(e) => setCompletionData({...completionData, receiverPhone: e.target.value})}
                      placeholder="선택사항"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    배송 메모 (선택사항)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                    value={completionData.deliveryMemo}
                    onChange={(e) => setCompletionData({...completionData, deliveryMemo: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    배송 사진 <span className="text-red-500">*</span> (최소 1장, 최대 3장)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex items-center justify-center w-full px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-pink-500"
                  >
                    <Upload size={20} className="mr-2" />
                    사진 선택
                  </label>
                  {photoPreview.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {photoPreview.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`배송사진 ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleComplete}
                    disabled={isUpdating || !completionData.receiverName || completionData.deliveryPhotos.length === 0}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    {uploadProgress || '완료 처리'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCompletionForm(false)
                      setCompletionData({receiverName: '', receiverPhone: '', deliveryMemo: '', deliveryPhotos: []})
                      setPhotoPreview([])
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
