'use client'

import React, { useState } from 'react'
import { X, Upload, Camera, User, CheckCircle } from 'lucide-react'

interface DeliveryCompleteModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  onComplete: (data: { photos: string[], recipientName: string, note: string }) => void
}

export default function DeliveryCompleteModal({ 
  isOpen, 
  onClose, 
  orderId, 
  orderNumber,
  onComplete 
}: DeliveryCompleteModalProps) {
  const [photos, setPhotos] = useState<string[]>([])
  const [recipientName, setRecipientName] = useState('')
  const [note, setNote] = useState('')
  const [uploading, setUploading] = useState(false)

  if (!isOpen) return null

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    const newPhotos: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      
      await new Promise((resolve) => {
        reader.onload = () => {
          newPhotos.push(reader.result as string)
          resolve(null)
        }
        reader.readAsDataURL(file)
      })
    }

    setPhotos(prev => [...prev, ...newPhotos].slice(0, 4)) // 최대 4장
    setUploading(false)
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!recipientName.trim()) {
      alert('인수자 이름을 입력해주세요')
      return
    }
    if (photos.length === 0) {
      alert('배송완료 사진을 최소 1장 업로드해주세요')
      return
    }

    onComplete({
      photos,
      recipientName,
      note
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">배송완료 처리</h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-gray-600">주문번호: {orderNumber}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* 배송완료 사진 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Camera className="w-4 h-4 inline mr-1" />
              배송완료 사진 (필수, 최대 4장)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img 
                    src={photo} 
                    alt={`배송완료 ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {photos.length < 4 && (
                <label className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-green-500">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">
                    {uploading ? '업로드 중...' : '사진 추가'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* 인수자 정보 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              인수자 이름 (필수)
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="예: 홍길동, 본인, 가족"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모 (선택)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="특이사항이나 전달사항을 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!recipientName || photos.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            배송완료 처리
          </button>
        </div>
      </div>
    </div>
  )
}
