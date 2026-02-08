import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { getAreaVariations, normalizeAreaName } from '@flower/shared/utils'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const searchParams = request.nextUrl.searchParams
    const sido = searchParams.get('sido')
    const sigungu = searchParams.get('sigungu') 
    const dong = searchParams.get('dong')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 최소 하나의 검색 조건 필요
    if (!sido && !sigungu && !dong) {
      return NextResponse.json(
        { error: '최소 하나의 검색 조건(시/도, 시/군/구)이 필요합니다' },
        { status: 400 }
      )
    }

    // Get current user's store to exclude from results
    const { data: currentUserStore } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single()

    // Create location string for area matching with variations
    const areaComponents = { sido: sido || '', sigungu: sigungu || '', dong: dong || undefined }
    const areaVariations = getAreaVariations(areaComponents)
    const normalizedArea = normalizeAreaName(areaComponents)

    // First try to get stores that have delivery areas set up
    // Use IN operator to match any variation
    const { data: deliveryAreas, error: areaError } = await supabase
      .from('store_delivery_areas')
      .select('store_id, area_name, min_amount')
      .in('area_name', areaVariations)

    if (areaError) {
      logger.error('Delivery area search error', areaError)
      throw areaError
    }

    // Get stores that have delivery areas for this location
    const storeIdsWithDeliveryArea = deliveryAreas ? deliveryAreas.map(da => da.store_id) : []
    
    // Get ALL stores with delivery areas (not just by address)
    let allStoresQuery = supabase
      .from('stores')
      .select('*')
      .eq('status', 'active')
    
    if (currentUserStore?.id) {
      allStoresQuery = allStoresQuery.neq('id', currentUserStore.id)
    }
    
    // Include stores that have delivery areas for this location
    if (storeIdsWithDeliveryArea.length > 0) {
      allStoresQuery = allStoresQuery.in('id', storeIdsWithDeliveryArea)
    } else {
      // Fallback: if no delivery areas, get stores by their location
      if (sido) {
        allStoresQuery = allStoresQuery.eq('address->>sido', sido)
      }
      if (sigungu) {
        allStoresQuery = allStoresQuery.eq('address->>sigungu', sigungu)
      }
    }
    
    const { data: allStores, error: storeError } = await allStoresQuery
      .order('business_name')
    
    if (storeError) {
      logger.error('Store search error', storeError)
      throw storeError
    }
    
    // Get pricing for stores with delivery areas
    let pricing = null
    if (storeIdsWithDeliveryArea.length > 0) {
      const { data: pricingData, error: pricingError } = await supabase
        .from('store_area_product_pricing')
        .select('*')
        .in('store_id', storeIdsWithDeliveryArea)
        .in('area_name', areaVariations)

      if (pricingError) {
        logger.error('Pricing search error', pricingError)
      }
      pricing = pricingData
    }

    // Combine data - include all stores from address search
    const storesWithPricing = allStores?.map(store => {
      const areaInfo = deliveryAreas?.find(da => da.store_id === store.id)
      const storePricing = pricing?.filter(p => p.store_id === store.id) || []
      return {
        ...store,
        delivery_area: areaInfo ? {
          area_name: areaInfo.area_name,
          min_amount: areaInfo.min_amount
        } : null,
        area_pricing: storePricing
      }
    }) || []

    return NextResponse.json({
      data: storesWithPricing,
      count: storesWithPricing.length
    })

  } catch (error: any) {
    logger.error('Store search error', error)
    return NextResponse.json(
      { error: '가게 검색 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}