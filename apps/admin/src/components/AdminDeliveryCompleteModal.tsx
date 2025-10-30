'use client'

import React, { useState } from 'react'
import { X, Upload, Camera, User, CheckCircle, Package, MapPin, Calendar } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import toast from 'react-hot-toast'
import { formatPhone, formatDate } from '@/shared/utils'

interface AdminDeliveryCompleteModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  source: 'homepage' | 'client' | 'funeral'
  onComplete?: () => void
  orderData?: any
}

export default function AdminDeliveryCompleteModal({ 
  isOpen, 
  onClose, 
  orderId, 
  orderNumber,
  source,
  orderData,
  onComplete 
}: AdminDeliveryCompleteModalProps) {
  const [photos, setPhotos] = useState<string[]>([])
  const [recipientName, setRecipientName] = useState('')
  const [sameAsRecipient, setSameAsRecipient] = useState(false)
  const [note, setNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [completing, setCompleting] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (!isOpen) return null

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    const uploadedUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileName = `${orderId}-${Date.now()}-${i}.${file.name.split('.').pop()}`
      
      const { data, error } = await supabase.storage
        .from('delivery-photos')
        .upload(fileName, file)

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('delivery-photos')
          .getPublicUrl(data.path)
        
        if (urlData) uploadedUrls.push(urlData.publicUrl)
      }
    }

    setPhotos(prev => [...prev, ...uploadedUrls].slice(0, 4))
    setUploading(false)
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

const handleSubmit = async () => {
  console.log('🚀 배송완료 처리 시작')
  console.log('orderId:', orderId)
  console.log('source:', source)
  
  if (!recipientName.trim()) {
    toast.error('인수자 이름을 입력해주세요')
    return
  }
  if (photos.length === 0) {
    toast.error('배송완료 사진을 최소 1장 업로드해주세요')
    return
  }

  setCompleting(true)
  try {
    const completionData = {
      photos,
      recipient_name: recipientName,
      note,
      completed_at: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace(' ', 'T') + '+09:00'
    }
    console.log('completionData:', completionData)

    if (source === 'homepage' || source === 'funeral') {
      console.log('📝 customer_orders 업데이트')
      
      const { data: currentOrder, error: selectError } = await supabase
        .from('customer_orders')
        .select('assigned_store_id, status')
        .eq('id', orderId)
        .single()
      
      if (selectError) {
        console.error('❌ SELECT 실패:', selectError)
        throw selectError
      }
      console.log('현재 주문:', currentOrder)
      
      const updateData: any = {
        status: 'completed',
        completion: completionData,
        updated_at: new Date().toISOString()
      }
      
      if (!currentOrder?.assigned_store_id) {
        // admin 직접 배송은 null 유지
        updateData.assigned_at = new Date().toISOString()
      }
      
      console.log('업데이트할 데이터:', updateData)
      
      const { data: updatedData, error } = await supabase
        .from('customer_orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        
      console.log('업데이트 결과:', { data: updatedData, error })
      
      if (error) {
        console.error('❌ UPDATE 실패:', error)
        throw error
      }
      
      if (!updatedData || updatedData.length === 0) {
        console.error('⚠️ 업데이트된 행이 없음 - RLS 정책 문제!')
        throw new Error('RLS 정책으로 인해 업데이트 실패')
      }
      
console.log('✅ 업데이트 성공:', updatedData[0])

      // SMS 발송
      console.log('📱 SMS 발송 시도:', { orderId, url: `${process.env.NEXT_PUBLIC_HOMEPAGE_URL || 'http://localhost:3000'}/api/send-delivery-sms` })
      const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_HOMEPAGE_URL || 'http://localhost:3000'}/api/send-delivery-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
      const smsResult = await smsResponse.json()
      console.log('📱 SMS 발송 결과:', smsResult)
      
    } else {
      console.log('📝 orders 업데이트')
      
      const { data: currentOrder, error: selectError } = await supabase
        .from('orders')
        .select('receiver_store_id, status')
        .eq('id', orderId)
        .single()
      
      if (selectError) {
        console.error('❌ SELECT 실패:', selectError)
        throw selectError
      }
      console.log('현재 주문:', currentOrder)
      
      const updateData: any = {
        status: 'completed',
        completion: completionData,
        updated_at: new Date().toISOString()
      }
      
      if (!currentOrder?.receiver_store_id) {
        updateData.receiver_store_id = '00000000-0000-0000-0000-000000000000'
      }
      
      console.log('업데이트할 데이터:', updateData)
      
      const { data: updatedData, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        
      console.log('업데이트 결과:', { data: updatedData, error })
      
      if (error) {
        console.error('❌ UPDATE 실패:', error)
        throw error
      }
      
      if (!updatedData || updatedData.length === 0) {
        console.error('⚠️ 업데이트된 행이 없음 - RLS 정책 문제!')
        throw new Error('RLS 정책으로 인해 업데이트 실패')
      }
      
console.log('✅ 업데이트 성공:', updatedData[0])

      // SMS 발송
      console.log('📱 SMS 발송 시도:', { orderId, url: `${process.env.NEXT_PUBLIC_HOMEPAGE_URL || 'http://localhost:3000'}/api/send-delivery-sms` })
      const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_HOMEPAGE_URL || 'http://localhost:3000'}/api/send-delivery-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
      const smsResult = await smsResponse.json()
      console.log('📱 SMS 발송 결과:', smsResult)
    }

    console.log('✅ 완료 처리 성공')
    toast.success('배송완료 처리되었습니다')
    onComplete?.()
    onClose()
  } catch (error: any) {
    console.error('❌ 배송완료 처리 오류:', error)
    toast.error(`처리 실패: ${error.message}`)
  } finally {
    setCompleting(false)
  }
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">배송완료 처리</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* 주문 정보 카드 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm font-medium text-gray-600 mb-2">주문번호: #{orderNumber}</div>
            
            {orderData && (
              <div className="space-y-2 text-sm">
                {/* 상품명 */}
                <div className="font-bold text-lg">{orderData.product?.name}</div>
                
                {/* 주문자 */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">👤</span>
                  <span>주문: {orderData.customer?.name} ({formatPhone(orderData.customer?.phone)})</span>
                </div>
                
                {/* 리본문구 */}
                {orderData.product?.ribbon_text && orderData.product.ribbon_text.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">🎀</span>
                    <span>리본문구: {orderData.product.ribbon_text[0]}</span>
                  </div>
                )}
                
                {/* 받는분 */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">👤</span>
                  <span>받는분: {orderData.recipient?.name}</span>
                </div>
                
                {/* 주소 */}
                <div className="flex items-start gap-2">
                  <span className="text-gray-600">📍</span>
                  <span className="flex-1">
                    {orderData.recipient?.address?.sigungu} {orderData.recipient?.address?.dong} {orderData.recipient?.address?.detail}
                  </span>
                </div>
                
                {/* 배송시간 */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">📅</span>
                  <span>{orderData.delivery?.date} {orderData.delivery?.time}</span>
                </div>
                
                {/* 금액 */}
                <div className="text-lg font-bold pt-2 border-t">
                  ₩{((orderData as any).payment?.total || orderData.pricing?.final_amount || 0).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* 인수자 정보 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                인수자 성함 <span className="text-red-500">*</span>
              </label>
              
              {/* 받는분과 동일 체크박스 */}
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="sameAsRecipient"
                  checked={sameAsRecipient}
                  onChange={(e) => {
                    setSameAsRecipient(e.target.checked)
                    if (e.target.checked && orderData?.recipient?.name) {
                      setRecipientName(orderData.recipient.name)
                    } else if (!e.target.checked) {
                      setRecipientName('')
                    }
                  }}
                  className="w-4 h-4"
                />
                <label htmlFor="sameAsRecipient" className="text-sm text-gray-700 cursor-pointer">
                  받는분과 동일 ({orderData?.recipient?.name})
                </label>
              </div>
              
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value)
                    setSameAsRecipient(false)
                  }}
                  placeholder="홍길동"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                  disabled={sameAsRecipient}
                />
              </div>
            </div>

            {/* 사진 업로드 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                배송완료 사진 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`배송완료 사진 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <label className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                    <Camera className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      {uploading ? '업로드 중...' : '사진 추가'}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">최대 4장까지 업로드 가능</p>
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                메모 (선택)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="배송 관련 특이사항을 입력하세요"
                rows={3}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={completing}
            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {completing ? (
              '처리 중...'
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                배송완료 처리
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}