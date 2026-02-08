import { NextResponse } from 'next/server'
import ImageStorageService from '@/services/imageStorage'
import { createServerSupabaseClient } from '@/lib/supabase/server'
export async function GET() {
  try {
    // Initialize bucket without auth check - this is a system operation
    // The bucket creation uses service role internally
    await ImageStorageService.initializeBucket()
    return NextResponse.json({ success: true, message: 'Storage bucket initialized' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
// Alternative: POST with simple key for initialization
export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Simple key check for development
    if (body.key !== 'init-storage-2025') {
      return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
    }
    await ImageStorageService.initializeBucket()
    return NextResponse.json({ success: true, message: 'Storage bucket initialized' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
