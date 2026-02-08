import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    // Get form data
    const recipient_name = formData.get('recipient_name') as string
    const note = formData.get('note') as string
    const photos = formData.getAll('photos') as File[]
    // Validate file upload limits
    if (photos.length > MAX_FILES) {
      throw new Error(
        `최대 ${MAX_FILES}개의 사진만 업로드 가능합니다`
      )
    }
    // Process photos
    const photoUrls: string[] = []
    // Return photo count in response for debugging
    const debugInfo = {
      photosReceived: photos.length,
      photosProcessed: 0,
      urls: [] as string[]
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
          const fileName = `${params.id}/${Date.now()}_${photo.name}`
          const bytes = await photo.arrayBuffer()
          const buffer = Buffer.from(bytes)
          const { data, error } = await supabase.storage
            .from('order-photos')
            .upload(fileName, buffer, {
              contentType: photo.type || 'image/jpeg',
            })
          if (data) {
            const { data: { publicUrl } } = supabase.storage
              .from('order-photos')
              .getPublicUrl(fileName)
            photoUrls.push(publicUrl)
            debugInfo.photosProcessed++
            debugInfo.urls.push(publicUrl)
          }
        } catch (photoError) {
        }
      }
    }
    // Update order status and save photo URLs
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completion_photos: photoUrls,  // Save photo URLs
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    if (error) {
      throw error
    }
    return NextResponse.json({ data: order, debug: debugInfo })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to complete order' },
      { status: 500 }
    )
  }
}