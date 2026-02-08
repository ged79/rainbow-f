import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/shared/utils'
import { PRODUCT_CATEGORIES } from '@/shared/constants'
import { ArrowLeft, MapPin, Phone, Mail, Plus } from 'lucide-react'

interface PageProps {
  params: { id: string }
}

export default async function FloristDetailPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()
  
  // Load store
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!store) {
    return <div className="p-8">가맹점을 찾을 수 없습니다</div>
  }

  // Load delivery areas
  const { data: deliveryAreas } = await supabase
    .from('store_delivery_areas')
    .select('*')
    .eq('store_id', params.id)
    .order('area_name')

  // Load product pricing
  const { data: productPricing } = await supabase
    .from('store_area_product_pricing')
    .select('*')
    .eq('store_id', params.id)
    .order('area_name, product_name')

  // Load products for display
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('category_1, display_name')

  // Load recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*')
    .or(`sender_store_id.eq.${params.id},receiver_store_id.eq.${params.id}`)
    .order('created_at', { ascending: false })
    .limit(10)

  const areas = Array.from(new Set(deliveryAreas?.map(d => d.area_name) || []))

  return (
    <div>
      <Link href="/florists" className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        뒤로가기
      </Link>

      {/* Store Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{store.business_name}</h1>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">기본 정보</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-gray-600">대표자:</dt>
                <dd>{store.owner_name}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <dd>{store.phone}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <dd>{store.email}</dd>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <dd>{store.address.sido} {store.address.sigungu} {store.address.dong}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-3">사업 실적</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">포인트 잔액:</dt>
                <dd className="font-medium">{formatCurrency(store.points_balance)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">총 발주:</dt>
                <dd className="font-medium">{store.total_orders_sent}건</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">총 수주:</dt>
                <dd className="font-medium">{store.total_orders_received}건</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">수수료율:</dt>
                <dd className="font-medium">{(store.commission_rate * 100).toFixed(0)}%</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Delivery Areas & Pricing */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">지역별 상품 가격</h2>

        {!deliveryAreas || deliveryAreas.length === 0 ? (
          <p className="text-gray-500 text-center py-8">배달 지역이 설정되지 않았습니다</p>
        ) : (
          areas.map((area, index) => {
            const areaInfo = deliveryAreas?.find(d => d.area_name === area)
            const areaPricing = productPricing?.filter(p => p.area_name === area) || []
            
            return (
              <div key={`${area}-${index}`} className="mb-6 border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {String(area)} 
                  <span className="ml-2 text-sm text-gray-500">
                    (최소주문: {formatCurrency(areaInfo?.min_amount || 50000)})
                  </span>
                </h3>
                
                <table className="min-w-full divide-y divide-gray-200 border text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium text-gray-500">상품명</th>
                      <th className="px-2 py-1 text-right font-medium text-gray-500">가격</th>
                      <th className="px-2 py-1 text-center font-medium text-gray-500">상태</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {areaPricing.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-2 py-4 text-center text-gray-500">
                          설정된 상품이 없습니다
                        </td>
                      </tr>
                    ) : (
                      areaPricing.map(item => (
                        <tr key={item.product_id}>
                          <td className="px-2 py-1 font-medium">{item.product_name}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(item.price)}</td>
                          <td className="px-2 py-1 text-center">
                            <span className={`px-1 py-0.5 text-xs rounded ${
                              item.is_available 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.is_available ? '판매중' : '품절'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )
          })
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">최근 주문 내역</h2>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">주문번호</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">구분</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recentOrders?.map((order: any) => (
              <tr key={order.id}>
                <td className="px-4 py-2 text-sm">{order.order_number}</td>
                <td className="px-4 py-2 text-sm">
                  {order.sender_store_id === params.id ? '발주' : '수주'}
                </td>
                <td className="px-4 py-2 text-sm">{formatCurrency(order.payment?.total || 0)}</td>
                <td className="px-4 py-2 text-sm">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">{formatDate(order.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}