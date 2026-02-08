import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Diagnostic function to check database categories
export async function checkDatabaseCategories() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category_1, category_2')
      .eq('is_active', true)
    
    if (error) {
      console.error('Database check error:', error)
      return
    }
    
    // Get unique category_1 values
    const uniqueCategory1 = Array.from(new Set(data?.map(p => p.category_1) || []))
    console.log('Unique category_1 values in database:', uniqueCategory1)
    
    // Count products per category_1
    const category1Counts: Record<string, number> = {}
    data?.forEach(p => {
      category1Counts[p.category_1] = (category1Counts[p.category_1] || 0) + 1
    })
    
    console.log('Products per category_1:')
    Object.entries(category1Counts).forEach(([cat, count]) => {
      console.log(`  "${cat}": ${count} products`)
    })
    
    // Show some actual character codes to debug encoding
    uniqueCategory1.forEach(cat => {
      console.log(`Category: "${cat}", Character codes:`, 
        Array.from(cat).map((c: any) => `${c}(${c.charCodeAt(0)})`).join(' ')
      )
    })
    
    return uniqueCategory1
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Call this on page load to debug
if (typeof window !== 'undefined') {
  checkDatabaseCategories()
}
