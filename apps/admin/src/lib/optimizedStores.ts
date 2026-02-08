// Optimized getEligibleStores function for admin
// Add this to admin/src/app/(dashboard)/customer-orders/page.tsx

export const getEligibleStoresOptimized = async (
  supabase: any,
  order: any,
  fallbackFunction?: Function
) => {
  if (!order.recipient_address?.sigungu) return []

  const address = order.recipient_address
  const areaName = `${address.sido} ${address.sigungu}`
  
  try {
    // Single optimized query instead of N queries
    const { data: eligibleStores, error } = await supabase
      .from('store_service_coverage')
      .select('store_id, business_name, owner_name, store_phone, price_basic')
      .eq('area_name', areaName)
      .eq('product_type', order.mapped_category)
      .eq('is_available', true)
      .lte('price_basic', order.mapped_price)
      .order('business_name')
    
    if (error) {
      console.error('Coverage view error, using fallback:', error)
      // Fallback to original method if view doesn't exist
      if (fallbackFunction) {
        return fallbackFunction(order)
      }
      throw error
    }
    
    // Transform to match expected format
    return (eligibleStores || []).map(store => ({
      id: store.store_id,
      business_name: store.business_name,
      owner_name: store.owner_name,
      phone: store.store_phone,
      min_price: store.price_basic
    }))
    
  } catch (error) {
    console.error('Error fetching eligible stores:', error)
    
    // If view doesn't exist, fallback to original N+1 method
    if (fallbackFunction) {
      return fallbackFunction(order)
    }
    
    return []
  }
}

// Usage in openAssignModal:
/*
const eligible = await getEligibleStoresOptimized(
  supabase, 
  order,
  () => getEligibleStores(order) // Original function as fallback
)
*/
