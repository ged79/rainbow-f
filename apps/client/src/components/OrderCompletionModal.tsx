'use client'
import { useState } from 'react'
import { X, Camera, User, FileText, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import type { CompletionData } from '@/types/completion'
interface OrderCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: CompletionData) => Promise<void>
  orderNumber: string
}
export default function OrderCompletionModal({
  isOpen,
  onClose,
  onComplete,
  orderNumber
}: OrderCompletionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState<CompletionData>({
    receiverName: '',
    receiverPhone: '',
    deliveryMemo: ''
  })
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('파일 크기는 5MB 이하여야 합니다')
        return
      }
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 업로드 가능합니다')
        return
      }
      setFormData({ ...formData, deliveryPhoto: file })
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  const handleSubmit = async () => {
    // Validation
    if (!formData.receiverName.trim()) {
      toast.error('인수자 이름을 입력해주세요')
      return
    }
    if (!formData.deliveryMemo.trim()) {
      toast.error('배송 메모를 입력해주세요')
      return
    }
    setIsSubmitting(true)
    try {
      await onComplete(formData)
      // Reset form
      setFormData({
        receiverName: '',
        receiverPhone: '',
        deliveryMemo: ''
      })
      setPhotoPreview(null)
      onClose()
    } catch (error) {
      toast.error('완료 처리 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">
              배송 완료 처리
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Order Info */}
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">주문번호</p>
              <p className="font-semibold">{orderNumber}</p>
            </div>
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Camera className="inline w-4 h-4 mr-1" />
                배송 사진 (선택)
              </label>
              <div className="mt-1">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"  // This opens camera on mobile devices
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer"
                >
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="배송 사진"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setPhotoPreview(null)
                          setFormData({ ...formData, deliveryPhoto: undefined })
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-500 transition">
                      <Camera className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-600">
                        클릭하여 사진 촬영 또는 업로드
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        모바일에서는 카메라가 열립니다
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>
            {/* Receiver Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                인수자 정보 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="인수자 이름"
                value={formData.receiverName}
                onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 mb-2"
              />
              <input
                type="tel"
                placeholder="인수자 연락처 (선택)"
                value={formData.receiverPhone}
                onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            {/* Delivery Memo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline w-4 h-4 mr-1" />
                배송 메모 <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="배송 완료 상황을 입력하세요"
                value={formData.deliveryMemo}
                onChange={(e) => setFormData({ ...formData, deliveryMemo: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows={3}
              />
            </div>
          </div>
          {/* Footer */}
          <div className="flex gap-2 p-4 border-t">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>처리중...</>
              ) : (
                <>
                  <CheckCircle size={16} />
                  배송완료
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
