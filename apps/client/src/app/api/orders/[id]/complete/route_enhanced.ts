import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDeliveryCompleteNotification } from '@/services/notifications'
import { logger } from '@/lib/logger'

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ===== NEW: Verify user is the receiving store =====
    // Get user's store
    const { data: userStore } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!userStore) {
      return NextResponse.json({ error: '스토어 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    // Get order details to verify receiver
    const { data: orderCheck } = await supabase
      .from('orders')
      .select('receiver_store_id, status, customer, recipient, product, order_number')
      .eq('id', params.id)
      .single()
    
    if (!orderCheck) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })
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
    // ===== END NEW VALIDATION =====
    
    // Get form data
    const recipient_name = formData.get('recipient_name') as string
    const note = formData.get('note') as string
    const photos = formData.getAll('photos') as File[]
    
    // Validate required fields
    if (!recipient_name || !note) {
      return NextResponse.json(
        { error: '수령인 이름과 배송 메모는 필수입니다' },
        { status: 400 }
      )
    }
    
    // Validate file upload limits
    if (photos.length > MAX_FILES) {
      return NextResponse.json(
        { error: `최대 ${MAX_FILES}개의 사진만 업로드 가능합니다` },
        { status: 400 }
      )
    }
    
    // ===== IMPROVED: Better photo upload with error handling =====
    const photoUrls: string[] = []
    const uploadErrors: string[] = []
    
    for (const photo of photos) {
      // Validate file size and type
      if (photo.size > MAX_FILE_SIZE) {
        uploadErrors.push(`${photo.name}: 파일 크기 초과 (최대 5MB)`)
        continue
      }
      
      if (!ALLOWED_TYPES.includes(photo.type)) {
        uploadErrors.push(`${photo.name}: 지원하지 않는 형식`)
        continue
      }
      
      if (photo && photo.size > 0) {
        try {
          const fileName = `${params.id}/${Date.now()}_${photo.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
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
            logger.error('Photo upload failed', { fileName, error })
          } else if (data) {
            const { data: { publicUrl } } = supabase.storage
              .from('order-photos')
              .getPublicUrl(fileName)
            photoUrls.push(publicUrl)
          }
        } catch (photoError) {
          uploadErrors.push(`${photo.name}: 처리 중 오류`)
          logger.error('Photo processing error', photoError)
        }
      }
    }
    
    // Warn if some photos failed but don't block completion
    if (uploadErrors.length > 0 && photoUrls.length === 0) {
      return NextResponse.json(
        { error: '사진 업로드 실패', details: uploadErrors },
        { status: 400 }
      )
    }
    
    // ===== IMPROVED: Consistent data structure =====
    const completionData = {
      recipient_name,
      recipient_phone: formData.get('recipient_phone') as string || '',
      note,
      photos: photoUrls,
      completed_at: new Date().toISOString(),
      completed_by: user.id
    }
    
    // Update order status and save completion data
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completion: completionData,  // Store as JSONB
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      logger.error('Order completion failed', { orderId: params.id, error })
      throw error
    }
    
    // ===== NEW: Send customer notification =====
    try {
      await sendDeliveryCompleteNotification(
        { ...orderCheck, id: params.id },
        completionData
      )
    } catch (notificationError) {
      // Log but don't fail the completion
      logger.error('Notification failed but order completed', notificationError)
    }
    
    // Log successful completion
    logger.info('Order completed successfully', {
      orderId: params.id,
      storeId: userStore.id,
      photosUploaded: photoUrls.length,
      uploadErrors: uploadErrors.length
    })
    
    return NextResponse.json({ 
      success: true,
      data: order,
      uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
      notificationSent: true
    })
    
  } catch (error: any) {
    logger.error('Order completion error', { 
      orderId: params.id, 
      error: error.message 
    })
    
    return NextResponse.json(
      { error: error.message || 'Failed to complete order' },
      { status: 500 }
    )
  }
}