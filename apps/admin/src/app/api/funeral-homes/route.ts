import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 랜덤 login_id 생성
function generateLoginId(name: string): string {
  const sanitized = name.replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase();
  const random = Math.random().toString(36).substring(2, 6);
  return `${sanitized.substring(0, 8)}_${random}`;
}

// 랜덤 비밀번호 생성 (8자리)
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, phone, email, room_count, contact_person, status } = body;

    // 필수 필드 검증
    if (!name || !address || !phone || !contact_person) {
      return NextResponse.json(
        { error: '필수 정보(장례식장명, 주소, 전화번호, 담당자명)를 입력해주세요.' },
        { status: 400 }
      );
    }

    // login_id와 비밀번호 자동 생성
    const loginId = generateLoginId(name);
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    // funeral_homes 생성
    const { data: funeralHome, error: insertError } = await supabase
      .from('funeral_homes')
      .insert({
        name,
        address,
        phone,
        email: email || null,
        room_count: room_count || 6,
        contact_person,
        status: status || 'active',
        login_id: loginId,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // 생성된 계정 정보 반환 (비밀번호는 한 번만 표시)
    return NextResponse.json({
      success: true,
      data: {
        funeral_home: funeralHome,
        credentials: {
          login_id: loginId,
          password: password, // 평문 비밀번호 (최초 1회만)
        }
      }
    });

  } catch (error: any) {
    console.error('Failed to create funeral home:', error);
    return NextResponse.json(
      { error: error.message || '장례식장 등록에 실패했습니다.' },
      { status: 500 }
    );
  }
}
