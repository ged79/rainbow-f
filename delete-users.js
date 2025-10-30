// Supabase 사용자 삭제 스크립트
// admin@flower.com을 제외한 모든 사용자 삭제

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수가 설정되지 않았습니다')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '설정됨' : '없음')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '없음')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function deleteAllUsersExceptAdmin() {
  console.log('🔍 사용자 목록 조회 중...\n')

  try {
    // 1. auth.users에서 모든 사용자 조회
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Auth 사용자 조회 실패:', authError)
      return
    }

    console.log(`📊 총 ${authUsers.users.length}명의 사용자 발견\n`)

    // 2. admin@flower.com 제외
    const usersToDelete = authUsers.users.filter(user => user.email !== 'admin@flower.com')
    const adminUser = authUsers.users.find(user => user.email === 'admin@flower.com')

    if (adminUser) {
      console.log('✅ Admin 사용자 보존:', adminUser.email, '(ID:', adminUser.id, ')\n')
    } else {
      console.log('⚠️  Admin 사용자를 찾을 수 없습니다\n')
    }

    if (usersToDelete.length === 0) {
      console.log('✨ 삭제할 사용자가 없습니다')
      return
    }

    console.log(`🗑️  ${usersToDelete.length}명의 사용자를 삭제합니다:\n`)
    usersToDelete.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || '(이메일 없음)'} - ID: ${user.id}`)
    })
    console.log('')

    // 3. 사용자 삭제
    let successCount = 0
    let failCount = 0

    for (const user of usersToDelete) {
      try {
        // Auth 사용자 삭제 (Cascade로 users 테이블도 자동 삭제됨)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
        
        if (deleteError) {
          console.error(`  ❌ ${user.email} 삭제 실패:`, deleteError.message)
          failCount++
        } else {
          console.log(`  ✅ ${user.email} 삭제 완료`)
          successCount++
        }
      } catch (error) {
        console.error(`  ❌ ${user.email} 삭제 중 오류:`, error.message)
        failCount++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 삭제 완료 통계')
    console.log('='.repeat(50))
    console.log(`✅ 성공: ${successCount}명`)
    console.log(`❌ 실패: ${failCount}명`)
    console.log(`🔒 보존: 1명 (admin@flower.com)`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ 작업 중 오류 발생:', error)
  }
}

// 실행
console.log('🚀 Supabase 사용자 삭제 시작')
console.log('=' .repeat(50))
deleteAllUsersExceptAdmin()
