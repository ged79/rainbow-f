import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { sendDeliveryCompleteNotification } from '@/services/notifications'
// File upload limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILES = 3; // Maximum 3 photos
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const supabase = createClient()
    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }
    
    // Verify user is the receiving store
    const { data: userStore } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!userStore) {
      return NextResponse.json(
        { error: '스토어 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    // Get order to verify receiver and get notification data
    const { data: orderCheck } = await supabase
      .from('orders')
      .select('receiver_store_id, status, customer, recipient, product, order_number')
      .eq('id', params.id)
      .single()
    
    if (!orderCheck) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    // Verify this store is the receiver
    if (orderCheck.receiver_store_id !== userStore.id) {
      logger.warn('Unauthorized completion attempt', {
        orderId: params.id,
        attemptedBy: userStore.id,
        actualReceiver: orderCheck.receiver_store_id
      })
      return NextResponse.json(
        { error: '이 주문을 완료할 권한이 없습니다' },
        { status: 403 }
      )
    }
    
    // Verify order status
    if (orderCheck.status === 'completed') {
      return NextResponse.json(
        { error: '이미 완료된 주문입니다' },
        { status: 400 }
      )
    }
    
    if (orderCheck.status === 'cancelled') {
      return NextResponse.json(
        { error: '취소된 주문은 완료할 수 없습니다' },
        { status: 400 }
      )
    }
    
    // Get form data
    const recipient_name = formData.get('recipient_name') as string
    const note = formData.get('note') as string
    const photos = formData.getAll('photos') as File[]
    
    // Validate required fields
    if (!recipient_name || photos.length === 0) {
      return NextResponse.json(
        { error: '수령인 이름과 배송 사진(최소 1장)은 필수입니다' },
        { status: 400 }
      )
    }
    // Validate file upload limits
    if (photos.length > MAX_FILES) {
      throw new Error(
        `최대 ${MAX_FILES}개의 사진만 업로드 가능합니다`
      )
    }
    // Process photos
    const photoUrls: string[] = []
    const uploadErrors: string[] = []
    
    // Return photo count in response for debugging
    const debugInfo = {
      photosReceived: photos.length,
      photosProcessed: 0,
      urls: [] as string[],
      errors: [] as string[]
    }
    for (const photo of photos) {
      // Validate file size and type
      if (photo.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB 이하여야 합니다` },
          { status: 400 }
        )
      }
      if (!ALLOWED_TYPES.includes(photo.type)) {
        return NextResponse.json(
          { error: '지원하지 않는 파일 형식입니다. JPG, PNG, WEBP만 가능합니다' },
          { status: 400 }
        )
      }
      if (photo && photo.size > 0) {
        try {
          // Sanitize filename
          const safeFileName = photo.name.replace(/[^a-zA-Z0-9.-]/g, '_')
          const fileName = `${params.id}/${Date.now()}_${safeFileName}`
          const bytes = await photo.arrayBuffer()
          const buffer = Buffer.from(bytes)
          
          const { data, error } = await supabase.storage
            .from('order-photos')
            .upload(fileName, buffer, {
              contentType: photo.type || 'image/jpeg',
              upsert: false
            })
            
          if (error) {
            uploadErrors.push(`${photo.name}: 업로드 실패`)
            debugInfo.errors.push(error.message)
          } else if (data) {
            const { data: { publicUrl } } = supabase.storage
              .from('order-photos')
              .getPublicUrl(fileName)
            photoUrls.push(publicUrl)
            debugInfo.photosProcessed++
            debugInfo.urls.push(publicUrl)
          }
        } catch (photoError: any) {
          uploadErrors.push(`${photo.name}: 처리 중 오류`)
          debugInfo.errors.push(photoError.message || 'Unknown error')
        }
      }
    }
    
    // Check if all photos failed
    if (uploadErrors.length > 0 && photoUrls.length === 0 && photos.length > 0) {
      return NextResponse.json(
        { error: '사진 업로드 실패', details: uploadErrors },
        { status: 400 }
      )
    }
    
    // Prepare completion data in consistent format
    const completionData = {
      recipient_name,
      recipient_phone: formData.get('recipient_phone') as string || '',
      note: note || '',  // 메모가 없으면 빈 문자열로 처리
      photos: photoUrls,
      completed_at: new Date().toISOString(),
      completed_by: user.id
    }
    
    // Update order status and save completion data
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completion: completionData,  // Store as JSONB in consistent format
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    if (error) {
      throw error
    }
    
    // Log successful completion
    logger.info('Order completed successfully', {
      orderId: params.id,
      storeId: userStore.id,
      photosUploaded: photoUrls.length,
      uploadErrors: uploadErrors.length
    })
    
    // Send customer notification (don't wait for it)
    sendDeliveryCompleteNotification(
      { ...orderCheck, id: params.id },
      completionData
    ).catch(error => {
      logger.error('Notification failed but order completed', error)
    })
    
    return NextResponse.json({ 
      success: true,
      data: order, 
      uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
      debug: process.env.NODE_ENV === 'development' ? debugInfo : undefined
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to complete order' },
      { status: 500 }
    )
  }
}
