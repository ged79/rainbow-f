import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

async function initStorage() {
  console.log('🚀 Initializing Supabase Storage bucket...')
  console.log('📍 Using Supabase URL:', supabaseUrl.substring(0, 30) + '...')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError)
      process.exit(1)
    }
    
    const bucketName = 'order-photos'
    const bucketExists = buckets?.some(b => b.name === bucketName)
    
    if (bucketExists) {
      console.log('✅ Storage bucket "order-photos" already exists!')
      console.log('✨ You can now upload photos with orders!')
      return
    }
    
    // Create bucket with public access
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    })
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Storage bucket "order-photos" already exists!')
      } else {
        console.error('❌ Failed to create bucket:', error)
        process.exit(1)
      }
    } else {
      console.log('✅ Storage bucket "order-photos" created successfully!')
    }
    
    console.log('📝 Configuration:')
    console.log('  - Public read access: Yes')
    console.log('  - Max file size: 5MB')
    console.log('  - Allowed types: JPEG, PNG, WebP')
    console.log('  - Compression: Auto (files > 500KB)')
    console.log('\n✨ You can now upload photos with orders!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run initialization
initStorage().catch(console.error)