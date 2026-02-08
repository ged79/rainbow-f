import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, handleApiError } from '@/lib/supabase/server'
import * as bcrypt from 'bcryptjs'

// Development-only test endpoint
export async function GET(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const supabase = createServiceClient()

    // Test data
    const testPhone = '010-9999-9999'
    const testPassword = 'test123'
    const testName = 'Test User'
    const testEmail = 'test@example.com'

    const hashedPassword = await bcrypt.hash(testPassword, 10)
    const cleanPhone = testPhone.replace(/-/g, '')

    // Check existing
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        message: 'Test user already exists',
        userId: existing.id
      })
    }

    // Create test user
    const { data: newUser, error } = await supabase
      .from('members')
      .insert({
        phone: cleanPhone,
        password: hashedPassword,
        name: testName,
        email: testEmail,
        points: 0
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      message: 'Test user created',
      user: { ...newUser, password: undefined }
    })

  } catch (error) {
    return handleApiError(error)
  }
}
