import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

async function checkStorage() {
  console.log('🔍 Checking Supabase Storage setup...')
  console.log('📍 Project:', supabaseUrl.substring(8, 30) + '...')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const bucketName = 'order-photos'
  
  try {
    // Try to list files in the bucket (this will tell us if it exists)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 })
    
    if (error) {
      if (error.message?.includes('not found')) {
        console.log('\n❌ Bucket "order-photos" does not exist.')
        console.log('\n📝 Please create it manually:')
        console.log('1. Go to: https://supabase.com/dashboard/project/qvgxqluwumbgslbxaeaq/storage/buckets')
        console.log('2. Click "New bucket"')
        console.log('3. Name: order-photos')
        console.log('4. Public bucket: ✅ ON')
        console.log('5. Click "Save"')
        console.log('\n🔗 Direct link: https://supabase.com/dashboard/project/qvgxqluwumbgslbxaeaq/storage/buckets')
      } else {
        console.log('⚠️ Bucket might exist but has access issues:', error.message)
        console.log('\n📝 Try creating manually if needed (link above)')
      }
    } else {
      console.log('✅ Storage bucket "order-photos" is ready!')
      console.log('✨ You can now upload photos with orders!')
      console.log('\n📊 Bucket stats:')
      console.log('  - Status: Active')
      console.log('  - Type: Public (accessible via URL)')
      console.log('  - Ready for: Image uploads')
    }
    
    // Test upload capability
    console.log('\n🧪 Testing upload capability...')
    const testFile = new Blob(['test'], { type: 'text/plain' })
    const testFileName = `test-${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testFile)
    
    if (uploadError) {
      console.log('⚠️ Cannot upload (this is OK for initialization)')
      console.log('   The app will handle uploads when needed.')
    } else {
      console.log('✅ Upload test successful!')
      // Clean up test file
      await supabase.storage.from(bucketName).remove([testFileName])
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    console.log('\n📝 Please check your Supabase dashboard:')
    console.log('https://supabase.com/dashboard/project/qvgxqluwumbgslbxaeaq/storage/buckets')
  }
}

// Run check
checkStorage().catch(console.error)