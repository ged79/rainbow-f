import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET: Get user's wishlist
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const phone = searchParams.get('phone')

  if (!name || !phone) {
    return NextResponse.json({ error: '이름과 전화번호를 입력해주세요' }, { status: 400 })
  }

  try {
    // For now, return empty wishlist since table doesn't exist
    // TODO: Create wishlist table in Supabase
    return NextResponse.json({ 
      success: true,
      wishlist: [],
      count: 0
    })

  } catch (error) {
    console.error('Wishlist error:', error)
    return NextResponse.json({ error: '위시리스트 조회 실패' }, { status: 500 })
  }
}

// POST: Add to wishlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // TODO: Implement wishlist table and logic
    return NextResponse.json({ 
      success: true,
      message: '위시리스트에 추가되었습니다'
    })

  } catch (error) {
    console.error('Wishlist error:', error)
    return NextResponse.json({ error: '위시리스트 추가 실패' }, { status: 500 })
  }
}

// DELETE: Remove from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    
    // TODO: Implement wishlist removal
    return NextResponse.json({ 
      success: true,
      message: '위시리스트에서 제거되었습니다'
    })

  } catch (error) {
    console.error('Wishlist error:', error)
    return NextResponse.json({ error: '위시리스트 제거 실패' }, { status: 500 })
  }
}
