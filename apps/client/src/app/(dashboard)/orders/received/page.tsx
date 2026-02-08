'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/useStore'
import { apiService } from '@/services/api'
import ImageStorageService from '@/services/imageStorage'
import { 
  CheckCircle,
  XCircle,
  Package,
  Eye,
  Truck,
  Clock,
  Store,
  Phone,
  MapPin,
  Camera,
  Calendar,
  ChevronRight,
  User,
  Upload,
  X
} from 'lucide-react'
import type { Order } from '@flower/shared'
import { formatCurrency, formatPhone } from '@flower/shared'
import toast from 'react-hot-toast'
export default function ReceivedOrdersPage() {
  const router = useRouter()
  const { currentStore } = useStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'completed'>('completed')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [showCompletionForm, setShowCompletionForm] = useState<string | null>(null)
  const [completionData, setCompletionData] = useState({
    receiverName: '',
    receiverPhone: '',
    deliveryMemo: '',
    deliveryPhotos: [] as File[],
    uploadedPhotoUrls: [] as string[],
    isUploading: false
  })
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  useEffect(() => {
    if (!currentStore) {
      router.push('/login')
      return
    }
    loadOrders()
  }, [currentStore, router])
  const loadOrders = async () => {
    if (!currentStore) return
    try {
      const { data, pagination } = await apiService.getOrders({
        type: 'received',
        limit: 100
      })
      if (data) {
        setOrders(data)
      }
    } catch (error) {
      toast.error('주문 목록을 불러올 수 없습니다')
    } finally {
      setIsLoading(false)
    }
  }
  const handleAccept = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsUpdating(orderId)
    try {
      await apiService.updateOrderStatus(orderId, 'accepted')
      toast.success('주문을 수락했습니다')
      await loadOrders()
    } catch (error) {
      toast.error('수락 처리 실패')
    } finally {
      setIsUpdating(null)
    }
  }
  const handleReject = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('정말로 이 주문을 거절하시겠습니까?')) return
    setIsUpdating(orderId)
    try {
      await apiService.updateOrderStatus(orderId, 'rejected')
      toast.success('주문을 거절했습니다')
      await loadOrders()
    } catch (error) {
      toast.error('거절 처리 실패')
    } finally {
      setIsUpdating(null)
    }
  }
  const openCompletionForm = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setShowCompletionForm(orderId)
    // Reset form when opening
    setCompletionData({
      receiverName: '',
      receiverPhone: '',
      deliveryMemo: '',
      deliveryPhotos: [],
      uploadedPhotoUrls: [],
      isUploading: false
    })
  }
  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const validFiles = Array.from(files).filter(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}은(는) 이미지 파일이 아닙니다`)
        return false
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}은(는) 5MB를 초과합니다`)
        return false
      }
      return true
    })
    if (validFiles.length === 0) return
    // Limit to 5 photos total
    const currentCount = completionData.deliveryPhotos.length
    const availableSlots = 5 - currentCount
    const photosToAdd = validFiles.slice(0, availableSlots)
    if (photosToAdd.length < validFiles.length) {
      toast.error(`최대 5장까지만 업로드 가능합니다`)
    }
    setCompletionData(prev => ({
      ...prev,
      deliveryPhotos: [...prev.deliveryPhotos, ...photosToAdd]
    }))
    if (photosToAdd.length > 0) {
      toast.success(`${photosToAdd.length}개 사진이 추가되었습니다`)
    }
  }
  const removePhoto = (index: number) => {
    setCompletionData(prev => ({
      ...prev,
      deliveryPhotos: prev.deliveryPhotos.filter((_, i) => i !== index),
      uploadedPhotoUrls: prev.uploadedPhotoUrls.filter((_, i) => i !== index)
    }))
  }
  const handleComplete = async (orderId: string) => {
    // Validate form
    if (!completionData.receiverName) {
      toast.error('인수자 이름을 입력하세요')
      return
    }
    if (!completionData.deliveryMemo) {
      toast.error('배송 메모를 입력하세요')
      return
    }
    setIsUpdating(orderId)
    setCompletionData(prev => ({ ...prev, isUploading: true }))
    try {
      let photoUrls: string[] = [...completionData.uploadedPhotoUrls]
      // Upload photos to Supabase Storage if any
      if (completionData.deliveryPhotos.length > 0) {
        toast('사진을 업로드하고 있습니다...', { icon: '📸' })
        try {
          const uploadResults = await ImageStorageService.uploadMultipleImages(
            completionData.deliveryPhotos,
            orderId,
            (current, total) => {
              toast(`사진 업로드 중... (${current}/${total})`, { icon: '📸' })
            }
          )
          photoUrls = uploadResults.map(r => r.url)
          if (uploadResults.length > 0) {
            toast.success(`${uploadResults.length}개 사진이 업로드되었습니다`)
          }
        } catch (photoError) {
          toast.error('사진 업로드 실패. 사진 없이 계속합니다.')
        }
      }
      const payload = {
        recipient_name: completionData.receiverName,
        recipient_phone: completionData.receiverPhone || '',
        photo_urls: photoUrls,
        note: completionData.deliveryMemo
      }
      await apiService.completeOrderWithDetails(orderId, payload)
      toast.success('배송이 완료되었습니다')
      // Reset form
      setShowCompletionForm(null)
      setCompletionData({
        receiverName: '',
        receiverPhone: '',
        deliveryMemo: '',
        deliveryPhotos: [],
        uploadedPhotoUrls: [],
        isUploading: false
      })
      await loadOrders()
    } catch (error) {
      toast.error('완료 처리 실패')
    } finally {
      setIsUpdating(null)
      setCompletionData(prev => ({ ...prev, isUploading: false }))
    }
  }
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'accepted': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'completed': return 'bg-green-100 text-green-700 border-green-300'
      case 'rejected': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '대기중',
      accepted: '배송중',
      completed: '완료',
      rejected: '거절됨'
    }
    return labels[status] || status
  }
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock size={12} />
      case 'accepted': return <CheckCircle size={12} />
      case 'completed': return <Package size={12} />
      case 'rejected': return <XCircle size={12} />
      default: return null
    }
  }
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') return order.status === 'pending'
    if (activeTab === 'accepted') return order.status === 'accepted'
    if (activeTab === 'completed') return order.status === 'completed'
    return false
  })
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩중...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">수주 관리</h1>
          <p className="text-gray-600 mt-1">받은 주문을 관리합니다</p>
        </div>
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-4">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activeTab === 'pending'
                  ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              대기중 ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('accepted')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activeTab === 'accepted'
                  ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              배송중 ({orders.filter(o => o.status === 'accepted').length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activeTab === 'completed'
                  ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              완료됨 ({orders.filter(o => o.status === 'completed').length})
            </button>
          </div>
        </div>
        {/* Compact Cards */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">
              {activeTab === 'pending' && '대기 중인 주문이 없습니다'}
              {activeTab === 'accepted' && '배송 중인 주문이 없습니다'}
              {activeTab === 'completed' && '완료된 주문이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredOrders.map((order) => (
              <div key={order.id}>
                <div
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  {/* Compact Card Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </span>
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium">
                          수주
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {order.order_number}
                      </span>
                    </div>
                    {/* Store & Product & Recipient Info with Labels */}
                    <div className="text-sm mb-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">발주:</span>
                          <span className="font-medium text-gray-900">{order.sender_store_id}</span>
                        </div>
                        <span className="text-gray-400">/</span>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">상품:</span>
                          <span className="text-gray-700">{order.product?.name}({order.product?.quantity}개)</span>
                        </div>
                        <span className="text-gray-400">/</span>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">수령인:</span>
                          <span className="text-gray-700 font-medium">{order.recipient?.name}</span>
                        </div>
                      </div>
                    </div>
                    {/* Address Only */}
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                      <MapPin size={12} className="text-gray-400" />
                      <span>
                        {order.recipient?.address?.sido} {order.recipient?.address?.sigungu} {order.recipient?.address?.detail}
                      </span>
                    </div>
                    {/* Bottom Row with Actions */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(order.payment?.total || 0)}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Action Buttons based on status */}
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={(e) => handleAccept(order.id, e)}
                              disabled={isUpdating === order.id}
                              className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded hover:bg-green-600 disabled:opacity-50 transition"
                            >
                              수락
                            </button>
                            <button
                              onClick={(e) => handleReject(order.id, e)}
                              disabled={isUpdating === order.id}
                              className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 disabled:opacity-50 transition"
                            >
                              거절
                            </button>
                          </>
                        )}
                        {order.status === 'accepted' && (
                          <button
                            onClick={(e) => openCompletionForm(order.id, e)}
                            disabled={isUpdating === order.id}
                            className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 disabled:opacity-50 transition"
                          >
                            배송완료
                          </button>
                        )}
                        {/* Date/Time */}
                        <div className="flex items-center gap-1 text-xs text-gray-500 ml-2">
                          <Calendar size={12} />
                          <span>
                            {new Date(order.created_at).toLocaleDateString('ko-KR')}
                          </span>
                          <span>
                            {new Date(order.created_at).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <ChevronRight size={14} className="text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Completion Form Modal */}
                {showCompletionForm === order.id && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Truck size={20} className="text-blue-500" />
                          배송 완료 정보 입력
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              인수자 이름 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={completionData.receiverName}
                              onChange={(e) => setCompletionData({
                                ...completionData,
                                receiverName: e.target.value
                              })}
                              placeholder="홍길동"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              인수자 연락처
                            </label>
                            <input
                              type="tel"
                              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={completionData.receiverPhone}
                              onChange={(e) => setCompletionData({
                                ...completionData,
                                receiverPhone: e.target.value
                              })}
                              placeholder="010-1234-5678"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              배송 메모 <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={3}
                              value={completionData.deliveryMemo}
                              onChange={(e) => setCompletionData({
                                ...completionData,
                                deliveryMemo: e.target.value
                              })}
                              placeholder="배송 완료 상황을 입력하세요"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              배송 사진 (선택, 최대 5장)
                            </label>
                            {/* Photo preview */}
                            {completionData.deliveryPhotos.length > 0 && (
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                {completionData.deliveryPhotos.map((photo, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={URL.createObjectURL(photo)}
                                      alt={`배송 사진 ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg"
                                    />
                                    <button
                                      onClick={() => removePhoto(index)}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X size={14} />
                                    </button>
                                    <span className="absolute bottom-1 left-1 text-xs bg-black bg-opacity-50 text-white px-1 rounded">
                                      {(photo.size / 1024).toFixed(0)}KB
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* File input */}
                            {completionData.deliveryPhotos.length < 5 && (
                              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-pink-500 transition-colors">
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handlePhotoUpload(e.target.files)}
                                  disabled={completionData.isUploading}
                                />
                                <div className="text-center">
                                  <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                                  <span className="text-sm text-gray-600">
                                    클릭하여 사진 추가 ({completionData.deliveryPhotos.length}/5)
                                  </span>
                                </div>
                              </label>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              * 사진은 자동으로 압축되어 저장됩니다
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                          <button
                            onClick={() => {
                              setShowCompletionForm(null)
                              setCompletionData({
                                receiverName: '',
                                receiverPhone: '',
                                deliveryMemo: '',
                                deliveryPhotos: [],
                                uploadedPhotoUrls: [],
                                isUploading: false
                              })
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            disabled={completionData.isUploading}
                          >
                            취소
                          </button>
                          <button
                            onClick={() => handleComplete(order.id)}
                            disabled={isUpdating === order.id || completionData.isUploading}
                            className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                          >
                            {completionData.isUploading ? '업로드 중...' : '완료 처리'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}