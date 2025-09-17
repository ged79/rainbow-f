'use client'
import { getFloristProducts, getProductsByCategory } from '@/lib/services/productService'
import { loadClientUICategories } from '@/lib/services/orderProductHelper'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore, useAppStore } from '@/stores/useStore'
import { apiService } from '@/services/api'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { 
  MapPin, 
  Calendar, 
  User, 
  Phone, 
  Package,
  CreditCard,
  Search,
  Building,
  Clock,
  Plus,
  FileText
} from 'lucide-react'
import type { 
  CreateOrderInput, 
  Store, 
  ProductType
} from '@flower/shared/types'
import { PRODUCT_CATEGORIES } from '@flower/shared/constants'
declare global {
  interface Window {
    daum: any
  }
}
// Client UI 카테고리 정의 - 화원가 기준 (화환은 등급별, 나머지는 실제 상품명)
const CLIENT_UI_CATEGORIES = {
  '근조화환': {
    displayName: '근조화환',
    backendCategory: '장례식 화환',
    icon: '🏵️',
    products: [
      // 화환 4등급 (프리미엄 제거)
      { id: 'FW-E', name: '근조화환 실속형', price: 45000, grade: '실속', description: '' },
      { id: 'FW-B', name: '근조화환 기본형', price: 60000, grade: '기본', description: '' },
      { id: 'FW-S', name: '근조화환 대형', price: 70000, grade: '대', description: '' },
      { id: 'FW-P', name: '근조화환 특대형', price: 80000, grade: '특대', description: '' },
      // 기타 상품
      { id: 'FB-S', name: '근조꽃바구니', price: 38500, grade: null, description: '' },
      { id: 'FS-1', name: '근조장구 1단', price: 70000, grade: null, description: '' },
      { id: 'FS-2', name: '근조장구 2단', price: 84000, grade: null, description: '' }
    ],
    ribbonTemplates: ['삼가 고인의 명복을 빕니다', '그리운 당신을 추모합니다', '삼가 조의를 표합니다']
  },
  '축하화환': {
    displayName: '축하화환',
    backendCategory: '개업.행사',
    icon: '🎊',
    products: [
      // 화환 4등급 (프리미엄 제거)
      { id: 'CW-E', name: '축하화환 실속형', price: 45000, grade: '실속', description: '' },
      { id: 'CW-B', name: '축하화환 기본형', price: 60000, grade: '기본', description: '' },
      { id: 'CW-S', name: '축하화환 대형', price: 70000, grade: '대', description: '' },
      { id: 'CW-P', name: '축하화환 특대형', price: 80000, grade: '특대', description: '' }
    ],
    ribbonTemplates: ['개업을 축하합니다', '번창하세요', '대박나세요', '축하합니다', '결혼을 축하합니다']
  },
  '화분·난': {
    displayName: '화분·난',
    backendCategory: '개업.행사',
    icon: '🪴',
    products: [
      // 실제 상품명과 화원가
      { id: 'PL-1', name: '탁상용 금전수', price: 40600, grade: null, description: '' },
      { id: 'PL-6', name: '백만장자의 금전수', price: 67900, grade: null, description: '' },
      { id: 'PL-3', name: '대형 해피트리', price: 76300, grade: null, description: '' },
      { id: 'PL-4', name: '아레카야자', price: 67900, grade: null, description: '' },
      { id: 'PL-5', name: '초대형 벵갈고무나무', price: 103600, grade: null, description: '' },
      { id: 'OR-6', name: '황금 호접란 (금공주)', price: 60200, grade: null, description: '' },
      { id: 'OR-4', name: '만천홍', price: 60200, grade: null, description: '' },
      { id: 'OR-5', name: '그라데이션 호접란', price: 60200, grade: null, description: '' }
    ],
    ribbonTemplates: ['개업을 축하합니다', '번창하세요', '승진을 축하합니다', '무궁한 발전을 빕니다']
  },
  '꽃상품': {
    displayName: '꽃상품',
    backendCategory: '승진.기념일',
    icon: '💐',
    products: [
      // 실제 상품명과 화원가
      { id: 'FL-1', name: '꽃다발', price: 42000, grade: null, description: '' },
      { id: 'FL-2', name: '대형꽃다발', price: 105000, grade: null, description: '' },
      { id: 'FL-3', name: '꽃바구니', price: 56000, grade: null, description: '' }
    ],
    ribbonTemplates: ['축하합니다', '사랑합니다', '감사합니다', '생일 축하합니다']
  }
} as const

// Removed - will use dynamic categories

// 스마트 매핑 함수 (임시 - shared package 빌드 후 제거)
function smartMapToBackendCategory(
  clientCategory: string, 
  productName: string,
  ribbonText?: string
): string {
  // 기본 매핑
  const categoryMap: Record<string, string> = {
    '근조화환': '장례식 화환',
    '축하화환': '개업.행사',
    '화분·난': '개업.행사',
    '꽃상품': '승진.기념일'
  }
  
  // 리본 문구로 용도 파악
  const isWedding = ribbonText?.includes('결혼') || productName.includes('결혼')
  const isFuneral = ribbonText?.includes('명복') || ribbonText?.includes('조의') || productName.includes('근조')
  const isPromotion = ribbonText?.includes('승진') || productName.includes('승진')
  
  // 근조 상품은 무조건 장례식
  if (clientCategory === '근조화환' || isFuneral) {
    return '장례식 화환'
  }
  
  // 축하화환 - 용도별 분류
  if (clientCategory === '축하화환') {
    if (isWedding) return '결혼식 화환'
    return '개업.행사' // 기본적으로 개업/행사용
  }
  
  // 화분·난 - 용도별 분류
  if (clientCategory === '화분·난') {
    if (isPromotion) return '승진.기념일'
    return '개업.행사' // 기본적으로 개업용
  }
  
  // 꽃상품 - 용도별 분류
  if (clientCategory === '꽃상품') {
    if (isWedding) return '결혼식 화환'
    if (isPromotion) return '승진.기념일'
    return '승진.기념일' // 기본적으로 기념일용
  }
  
  return categoryMap[clientCategory] || '개업.행사'
}
// 보내는 분 직함 옵션
const SENDER_TITLES = [
  '회장', '대표', '대표이사', '사장', '부사장', '전무', '상무', '이사', '부장', '과장', '팀장',
  '의원', '시장', '구청장', '회원일동', '직원일동', '임직원일동'
]
export default function NewOrderPage() {
  const router = useRouter()
  const { currentStore } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [uiCategories, setUiCategories] = useState(CLIENT_UI_CATEGORIES) // DB 또는 하드코딩
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
  const [searchingStores, setSearchingStores] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [availableStores, setAvailableStores] = useState<Store[]>([])
  const [detailAddress, setDetailAddress] = useState('')
  const [showChargeModal, setShowChargeModal] = useState(false)
  const [chargeAmount, setChargeAmount] = useState(100000)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editOrderId, setEditOrderId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>('근조화환')
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [selectedRibbonText, setSelectedRibbonText] = useState('')
  const [selectedSenderTitle, setSelectedSenderTitle] = useState('')
  const [senderCompany, setSenderCompany] = useState('')
  const [customRibbonText, setCustomRibbonText] = useState('')
  const [selectedStorePricing, setSelectedStorePricing] = useState<any[]>([])
  const [orderData, setOrderData] = useState<Partial<CreateOrderInput>>({
    customer_name: '',
    customer_phone: '',
    customer_memo: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_address: {
      sido: '',
      sigungu: '',
      dong: '',
      detail: '',
      postal_code: ''
    },
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_time: '즉시배송',
    product_type: '장례식 화환' as ProductType,
    product_name: CLIENT_UI_CATEGORIES['근조화환'].products[0].name,
    product_price: CLIENT_UI_CATEGORIES['근조화환'].products[0].price,
    product_quantity: 1,
    ribbon_text: [],
    special_instructions: '',
    receiver_store_id: undefined,
    additional_fee: 0,
    additional_fee_reason: ''
  })
  // DB에서 카테고리 로드
  useEffect(() => {
    loadCategoriesFromDB()
  }, [])

  const loadCategoriesFromDB = async () => {
    try {
      const dbCategories = await loadClientUICategories()
      setUiCategories(dbCategories as any)
      setCategoriesLoaded(true)
      console.log('Categories loaded from DB')
    } catch (error) {
      console.error('Using hardcoded categories:', error)
      setCategoriesLoaded(true)
    }
  }

  useEffect(() => {
    // Check if we're editing an existing order
    const editData = sessionStorage.getItem('editOrderData')
    if (editData) {
      try {
        const parsedData = JSON.parse(editData)
        setOrderData(parsedData)
        setIsEditMode(true)
        if (parsedData.order_id) {
          setEditOrderId(parsedData.order_id)
        }
        // 회사명 설정
        if (parsedData.customer_company) {
          setSenderCompany(parsedData.customer_company)
        }
        // Search for stores if address exists
        if (parsedData.recipient_address?.sido && parsedData.recipient_address?.sigungu) {
          searchStores(parsedData.recipient_address.sido, parsedData.recipient_address.sigungu)
        }
        // Clear the sessionStorage after loading
        sessionStorage.removeItem('editOrderData')
      } catch (error) {
      }
    }
  }, [])
  useEffect(() => {
    // Load Daum Postcode script
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    document.body.appendChild(script)
    script.onload = () => {
      setScriptLoaded(true)
    }
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])
  const openAddressSearch = () => {
    if (!scriptLoaded || !window.daum || !window.daum.Postcode) {
      toast.error('주소 검색 서비스를 로드중입니다. 잠시 후 다시 시도해주세요.')
      return
    }
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        const fullAddr = data.roadAddress || data.jibunAddress
        const sido = data.sido
        const sigungu = data.sigungu
        const dong = data.bname
        const detail = fullAddr
        const postal_code = data.zonecode
        setOrderData({
          ...orderData,
          recipient_address: {
            sido,
            sigungu,
            dong,
            detail,
            postal_code
          }
        })
        searchStores(sido, sigungu)
      }
    }).open()
  }
  const searchStores = async (sido: string, sigungu: string, dong?: string) => {
    setSearchingStores(true)
    try {
      // Use normalizeAreaName to ensure consistent format
      const { normalizeAreaName } = await import('@flower/shared/utils')
      const normalizedSido = normalizeAreaName({ sido, sigungu: '', dong: undefined }).split(' ')[0]
      const normalizedSigungu = normalizeAreaName({ sido: '', sigungu, dong: undefined }).split(' ').pop() || sigungu
      
      const result = await apiService.searchStores(normalizedSido, normalizedSigungu)
      if (result.data) {
        setAvailableStores(result.data)
        if (result.data.length === 0) {
          toast(`${normalizedSido} ${normalizedSigungu} 지역에 서비스 가능한 화원이 없습니다`, { icon: 'ℹ️' })
        }
      }
    } catch (error) {
      toast.error('화원 검색 실패')
    } finally {
      setSearchingStores(false)
    }
  }
  // 리본 문구 자동 생성
  const generateRibbonText = () => {
    if (!selectedRibbonText) return ''
    let fullText = selectedRibbonText
    // 보내는 분 정보 추가
    if (orderData.customer_name || senderCompany || selectedSenderTitle) {
      const company = senderCompany ? `${senderCompany} ` : ''
      const name = orderData.customer_name || ''
      const title = selectedSenderTitle ? ` ${selectedSenderTitle}` : ''
      fullText = `${selectedRibbonText} ${company}${name}${title}`
    }
    return fullText.trim()
  }
  // 리본 문구 업데이트
  useEffect(() => {
    const ribbonText = generateRibbonText()
    if (ribbonText && !customRibbonText) {
      setOrderData(prev => ({
        ...prev,
        ribbon_text: [ribbonText]
      }))
    }
  }, [orderData.customer_name, selectedSenderTitle, senderCompany, selectedRibbonText])
  const calculateTotal = () => {
    const subtotal = (orderData.product_price || 0) * (orderData.product_quantity || 1)
    const additionalFee = orderData.additional_fee || 0
    // NO COMMISSION for sender (발주화원) - commission will be deducted from receiver
    const commission = 0  // 발주화원은 수수료 없음
    return {
      subtotal,
      additionalFee,
      commission,
      total: subtotal + additionalFee  // 원가 + 추가비용
    }
  }
  const handleSubmit = async () => {
    if (!currentStore) return
    if (!orderData.customer_name || !orderData.customer_phone) {
      toast.error('주문자 정보를 입력하세요')
      document.getElementById('delivery-section')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (!orderData.recipient_name || !orderData.recipient_phone) {
      toast.error('수령인 정보를 입력하세요')
      document.getElementById('delivery-section')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    const address = orderData.recipient_address;
    if (!address || (typeof address === 'object' && !address.detail) || (typeof address === 'string' && !address)) {
      toast.error('배송 주소를 입력하세요')
      document.getElementById('delivery-section')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    
    // 상세주소 필수 체크
    if (!detailAddress || detailAddress.trim() === '') {
      toast.error('상세주소를 입력해주세요. (예: 101동 202호, 2층, ○○아파트 등)')
      document.getElementById('delivery-section')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    // 수정 모드가 아닐 때만 포인트 체크
    if (!isEditMode) {
      const totals = calculateTotal()
      if ((currentStore?.points_balance || 0) < totals.total) {
        toast.error('포인트가 부족합니다. 충전 후 다시 시도하세요.')
        setShowChargeModal(true)
        return
      }
    }
    setIsLoading(true)
    try {
      const recipientAddress = orderData.recipient_address;
      const fullAddress = typeof recipientAddress === 'string' 
        ? recipientAddress + (detailAddress ? ' ' + detailAddress : '')
        : recipientAddress?.detail + (detailAddress ? ' ' + detailAddress : '');
      let result
      if (isEditMode && editOrderId) {
        // 수정 모드일 때는 기존 주문을 업데이트
        result = await apiService.updateOrder(editOrderId, {
          customer: {
            name: orderData.customer_name || '',
            phone: orderData.customer_phone || '',
            company: senderCompany || '', // 회사명 추가
            memo: orderData.customer_memo || ''
          },
          recipient: {
            name: orderData.recipient_name || '',
            phone: orderData.recipient_phone || '',
            address: typeof orderData.recipient_address === 'string'
              ? {
                  sido: '',
                  sigungu: '',
                  dong: '',
                  detail: fullAddress
                }
              : {
                  ...orderData.recipient_address!,
                  detail: fullAddress
                }
          },
          delivery_date: orderData.delivery_date || '',
          delivery_time: orderData.delivery_time || '',
          product: {
            type: orderData.product_type || '근조화환', // Default to a valid ProductType
            name: orderData.product_name || '',
            price: orderData.product_price || 0,
            quantity: orderData.product_quantity || 1,
            ribbon_text: Array.isArray(orderData.ribbon_text) 
              ? orderData.ribbon_text 
              : orderData.ribbon_text 
              ? [orderData.ribbon_text]
              : [],
            special_instructions: orderData.special_instructions || ''
          },
          receiver_store_id: orderData.receiver_store_id || null
        })
      } else {
        // 새 주문 생성
        // delivery_time을 HH:MM 형식으로 변환
        let formattedDeliveryTime = orderData.delivery_time || '14:00'
        if (formattedDeliveryTime === '즉시배송') {
          // 즉시배송의 경우 현재 시간 + 3시간으로 설정
          const now = new Date()
          now.setHours(now.getHours() + 3)
          formattedDeliveryTime = `${String(now.getHours()).padStart(2, '0')}:00`
        }
        
        // ribbon_text를 문자열로 변환 (배열이 아닌 문자열로)
        const ribbonTextString = Array.isArray(orderData.ribbon_text) 
          ? orderData.ribbon_text[0] || '' 
          : orderData.ribbon_text || ''
        
        result = await apiService.createOrder({
          customer_name: orderData.customer_name || '',
          customer_phone: orderData.customer_phone || '',
          customer_memo: orderData.customer_memo || '',
          customer_company: senderCompany || '', // 회사명 추가
          recipient_name: orderData.recipient_name || '',
          recipient_phone: orderData.recipient_phone || '',
          recipient_address: typeof orderData.recipient_address === 'string'
            ? orderData.recipient_address
            : {
                ...orderData.recipient_address!,
                detail: fullAddress
              },
          delivery_date: orderData.delivery_date || new Date().toISOString().split('T')[0],
          delivery_time: formattedDeliveryTime, // HH:MM 형식
          product_type: orderData.product_type || '근조화환' as ProductType,
          product_name: orderData.product_name || '근조화환',
          product_price: orderData.product_price || 60000,
          product_quantity: orderData.product_quantity || 1,
          ribbon_text: orderData.ribbon_text || [],
          special_instructions: orderData.special_instructions || '',
          receiver_store_id: orderData.receiver_store_id,
          additional_fee: orderData.additional_fee || 0,
          additional_fee_reason: orderData.additional_fee_reason || ''
        } as CreateOrderInput)
      }
      if (result.data) {
        toast.success(isEditMode ? '주문이 수정되었습니다' : '주문이 생성되었습니다')
        // 포인트가 변경되었을 수 있으므로 store 정보 새로고침
        if (!isEditMode) {
          const supabase = createClient()
          const { data: updatedStore } = await supabase
            .from('stores')
            .select('*')
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .single()
          if (updatedStore) {
            // store 정보 업데이트
            useAppStore.getState().setCurrentStore(updatedStore)
          }
        }
        router.push('/orders')
      }
    } catch (error: any) {
      toast.error(error.message || (isEditMode ? '주문 수정 실패' : '주문 생성 실패'))
    } finally {
      setIsLoading(false)
    }
  }
  const handleCharge = async () => {
    try {
      const supabase = createClient()
      const currentBalance = currentStore?.points_balance || 0
      const newBalance = currentBalance + chargeAmount
      const { error } = await supabase
        .from('point_transactions')
        .insert({
          store_id: currentStore?.id,
          type: 'charge',
          amount: chargeAmount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: '포인트 충전'
        })
      if (error) throw error
      // Update store balance
      const { error: updateError } = await supabase
        .from('stores')
        .update({ points_balance: newBalance })
        .eq('id', currentStore?.id)
      if (updateError) throw updateError
      toast.success('포인트 충전 완료')
      setShowChargeModal(false)
      router.refresh()
    } catch (error) {
      toast.error('충전 실패')
    }
  }
  const totals = calculateTotal()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-3 border-b">
            <h1 className="text-lg font-bold text-gray-900">
              {isEditMode ? '주문 수정' : '주문'}
            </h1>
          </div>
          <div className="p-6 space-y-8">
            {/* 1. 상품 정보 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gray-700">상품:</span>
                <span className="text-sm text-gray-900">
                  {selectedProduct ? 
                    `${selectedProduct.name} ${orderData.product_quantity || 1}개 = ${((selectedProduct.price || 0) * (orderData.product_quantity || 1)).toLocaleString()}원` : 
                    '카테고리 선택'}
                </span>
                <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setSelectedProduct(null)
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  변경
                </button>
              </div>
              
              {/* 카테고리 선택 버튼 - 항상 표시 */}
              <div className="flex gap-2 flex-wrap mb-3">
                {Object.keys(uiCategories).map((categoryKey) => (
                  <button
                    key={categoryKey}
                    onClick={() => {
                      setSelectedCategory(categoryKey)
                      setSelectedProduct(null)
                    }}
                    className={`px-3 py-1.5 rounded text-sm border transition ${
                      selectedCategory === categoryKey
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                  >
                    {uiCategories[categoryKey]?.displayName || categoryKey}
                  </button>
                ))}
              </div>
              
              {/* 상품 선택 - 카테고리 선택시 표시 */}
              {selectedCategory && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">상품 선택:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(uiCategories[selectedCategory]?.products || []).map(product => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setSelectedProduct(product)
                          const backendCategory = smartMapToBackendCategory(
                            selectedCategory, 
                            product.name,
                            orderData.ribbon_text?.[0]
                          )
                          setOrderData({
                            ...orderData,
                            product_type: backendCategory as ProductType,
                            product_name: product.name,
                            product_price: product.price,
                            florist_price: product.price,
                            price_grade: product.grade
                          })
                        }}
                        className={`px-3 py-2 text-left rounded border transition text-sm ${
                          selectedProduct?.id === product.id
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50'
                        }`}
                      >
                        <div>{product.name}</div>
                        <div className="text-xs text-gray-600">{product.price.toLocaleString()}원</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 수량 조절 (상품 선택 후) */}
              {selectedProduct && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-700">수량:</span>
                  <button
                    onClick={() => setOrderData({
                      ...orderData, 
                      product_quantity: Math.max(1, (orderData.product_quantity || 1) - 1)
                    })}
                    className="w-6 h-6 rounded border border-gray-300 hover:bg-gray-50 transition text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="w-12 px-1 py-0.5 border border-gray-300 rounded text-center text-sm"
                    value={orderData.product_quantity}
                    onChange={(e) => setOrderData({...orderData, product_quantity: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                  <button
                    onClick={() => setOrderData({
                      ...orderData, 
                      product_quantity: (orderData.product_quantity || 1) + 1
                    })}
                    className="w-6 h-6 rounded border border-gray-300 hover:bg-gray-50 transition text-sm"
                  >
                    +
                  </button>
                </div>
              )}
              {/* 리본 문구 선택 (카테고리 선택시 표시) */}
              {selectedCategory && uiCategories[selectedCategory]?.ribbonTemplates && uiCategories[selectedCategory].ribbonTemplates.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">리본 문구 선택</label>
                    <div className="flex flex-wrap gap-2">
                      {(uiCategories[selectedCategory]?.ribbonTemplates || []).map((text) => (
                        <button
                          key={text}
                          onClick={() => setSelectedRibbonText(text)}
                          className={`px-3 py-1 rounded-full text-sm transition-all ${
                            selectedRibbonText === text
                              ? 'bg-pink-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {text}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 직접 입력 */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">또는 직접 입력</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      placeholder="리볰 문구를 직접 입력하세요"
                      value={customRibbonText}
                      onChange={(e) => {
                        setCustomRibbonText(e.target.value)
                        setOrderData({
                          ...orderData,
                          ribbon_text: e.target.value ? [e.target.value] : []
                        })
                      }}
                    />
                  </div>
                  
                  {/* 리본 문구 미리보기 */}
                  {(selectedRibbonText || customRibbonText) && (
                    <div className="p-2 bg-yellow-50 border border-yellow-300 rounded text-sm">
                      <span className="font-semibold">리볰 문구: </span>
                      <span className="text-pink-600">
                        {customRibbonText || generateRibbonText()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </section>
            {/* 2. 배송 정보 */}
            <section id="delivery-section">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="text-pink-500" size={20} />
                배송 정보
              </h2>
              <div className="space-y-4">
                {/* 수령인 및 주문자 정보 */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800">수령인 정보</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        수령인명 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={orderData.recipient_name}
                        onChange={(e) => setOrderData({...orderData, recipient_name: e.target.value})}
                        placeholder="수령인 이름"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        연락처 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        className="input"
                        value={orderData.recipient_phone}
                        onChange={(e) => setOrderData({...orderData, recipient_phone: e.target.value})}
                        placeholder="010-5678-1234"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800">주문자 정보</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        이름 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={orderData.customer_name}
                        onChange={(e) => setOrderData({...orderData, customer_name: e.target.value})}
                        placeholder="홍길동"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        연락처 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        className="input"
                        value={orderData.customer_phone}
                        onChange={(e) => setOrderData({...orderData, customer_phone: e.target.value})}
                        placeholder="010-1234-5678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        회사/단체명 (선택)
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={senderCompany}
                        onChange={(e) => setSenderCompany(e.target.value)}
                        placeholder="예: (주)한국플라워"
                      />
                    </div>
                    {selectedCategory && uiCategories[selectedCategory]?.ribbonTemplates && uiCategories[selectedCategory].ribbonTemplates.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          직함 (선택)
                        </label>
                        <select
                          className="input"
                          value={selectedSenderTitle}
                          onChange={(e) => setSelectedSenderTitle(e.target.value)}
                        >
                          <option value="">직함 없음</option>
                          {SENDER_TITLES.map((title) => (
                            <option key={title} value={title}>{title}</option>
                          ))}
                        </select>
                        {(selectedSenderTitle || senderCompany) && selectedRibbonText && (
                          <p className="text-xs text-blue-600 mt-1 font-medium">
                            리본문구: {selectedRibbonText} {senderCompany && `${senderCompany} `}{orderData.customer_name} {selectedSenderTitle}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    배송 주소 <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={openAddressSearch}
                    disabled={!scriptLoaded}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    <Search size={16} />
                    {scriptLoaded ? '주소 검색' : '로딩중...'}
                  </button>
                  {typeof orderData.recipient_address === 'object' && orderData.recipient_address?.detail && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">
                        [{orderData.recipient_address.postal_code}]
                      </p>
                      <p className="font-medium">{orderData.recipient_address.detail}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {orderData.recipient_address.sido} {orderData.recipient_address.sigungu} {orderData.recipient_address.dong}
                      </p>
                    </div>
                  )}
                  {typeof orderData.recipient_address === 'object' && orderData.recipient_address?.detail && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        상세 주소
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="동/호수 등 상세 주소 입력"
                        value={detailAddress}
                        onChange={(e) => setDetailAddress(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">배송일</label>
                    <input
                      type="date"
                      className="input"
                      value={orderData.delivery_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setOrderData({...orderData, delivery_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">배송시간</label>
                    <select
                      className="input"
                      value={orderData.delivery_time}
                      onChange={(e) => setOrderData({...orderData, delivery_time: e.target.value})}
                    >
                      <option value="즉시배송">즉시 배송 (3시간 내)</option>
                      <option value="09:00">오전 9시</option>
                      <option value="10:00">오전 10시</option>
                      <option value="11:00">오전 11시</option>
                      <option value="12:00">오후 12시</option>
                      <option value="13:00">오후 1시</option>
                      <option value="14:00">오후 2시</option>
                      <option value="15:00">오후 3시</option>
                      <option value="16:00">오후 4시</option>
                      <option value="17:00">오후 5시</option>
                      <option value="18:00">오후 6시</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
            {/* 3. 수주 화원 */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building className="text-pink-500" size={20} />
                수주 화원 선택
              </h2>
              {searchingStores ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">화원 검색중...</p>
                </div>
              ) : typeof orderData.recipient_address === 'object' && orderData.recipient_address?.detail ? (
                <div className="space-y-3">
                  <div
                    onClick={() => {
                      setOrderData({...orderData, receiver_store_id: undefined})
                      setSelectedStorePricing([]) // Reset pricing when selecting 본사 발주
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                      !orderData.receiver_store_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="text-blue-500" size={24} />
                      <div>
                        <h3 className="font-semibold">본사 발주</h3>
                        <p className="text-sm text-gray-600">30분 내 최적 화원 자동 배정</p>
                      </div>
                    </div>
                  </div>
                  {availableStores.map((store: any) => (
                    <div
                      key={store.id}
                      onClick={() => {
                        setOrderData({...orderData, receiver_store_id: store.id})
                        setSelectedStorePricing(store.area_pricing || [])
                        // Update price if product is already selected
                        if (selectedProduct && store.area_pricing) {
                          const productPricing = store.area_pricing.find(
                            (p: any) => p.product_type === selectedProduct.type
                          )
                          if (productPricing) {
                            // Use basic price as default
                            setOrderData(prev => ({...prev, product_price: productPricing.price_basic}))
                          }
                        }
                      }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        orderData.receiver_store_id === store.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{store.business_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {store.address.sido} {store.address.sigungu} {store.address.dong}
                          </p>
                          {store.delivery_area?.min_amount && (
                            <p className="text-xs text-blue-600 mt-1">
                              최소주문: {(store.delivery_area.min_amount/10000).toFixed(0)}만원
                            </p>
                          )}
                        </div>
                        {store.is_open ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            영업중
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            영업종료
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {availableStores.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      해당 지역에 배송 가능한 화원이 없습니다
                    </div>
                  )}
                  {availableStores.length > 0 && orderData.receiver_store_id && selectedStorePricing.length === 0 && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800">
                      ⚠️ 선택한 화원의 지역별 가격이 설정되지 않아 기본 가격이 표시됩니다
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  배송 주소를 먼저 입력하세요
                </div>
              )}
            </section>
            {/* 4. 추가 비용 */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="text-pink-500" size={20} />
                추가 비용 (선택)
              </h2>
              <div className="space-y-3">
                {/* 첫 번째 줄: 빠른 선택 버튼들 */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '긴급배송', value: 10000 },
                    { label: '야간배송', value: 15000 },
                    { label: '원거리배송', value: 20000 }
                  ].map((option) => (
                    <button
                      key={option.label}
                      onClick={() => {
                        if (orderData.additional_fee === option.value) {
                          setOrderData({ 
                            ...orderData, 
                            additional_fee: 0,
                            additional_fee_reason: ''
                          })
                        } else {
                          setOrderData({ 
                            ...orderData, 
                            additional_fee: option.value,
                            additional_fee_reason: option.label
                          })
                        }
                      }}
                      className={`px-3 py-2 rounded-lg border-2 transition text-center ${
                        orderData.additional_fee === option.value
                          ? 'border-pink-500 bg-pink-50 font-semibold'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm">{option.label}</div>
                      <div className="text-xs text-gray-600">
                        +{(option.value/1000)}천원
                      </div>
                    </button>
                  ))}
                </div>
                {/* 두 번째 줄: 직접 입력 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">직접입력:</span>
                  <input
                    type="number"
                    className="w-24 px-2 py-1.5 border rounded text-sm"
                    placeholder="금액"
                    value={orderData.additional_fee || ''}
                    onChange={(e) => setOrderData({
                      ...orderData,
                      additional_fee: parseInt(e.target.value) || 0
                    })}
                    step="1000"
                  />
                  <input
                    type="text"
                    className="w-40 px-2 py-1.5 border rounded text-sm"
                    placeholder="추가 비용 사유"
                    value={orderData.additional_fee_reason || ''}
                    onChange={(e) => setOrderData({
                      ...orderData,
                      additional_fee_reason: e.target.value
                    })}
                  />
                </div>
              </div>
            </section>
            {/* 5. 주문 요약 */}
            <section className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-300">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="text-yellow-600" size={20} />
                주문 요약
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p><span className="text-gray-600">📦 상품:</span> <span className="font-bold">{orderData.product_name || '-'}</span> x {orderData.product_quantity || 1}개</p>
                  <p><span className="text-gray-600">🎀 리본:</span> <span className="font-bold text-pink-600">{orderData.ribbon_text?.[0] || generateRibbonText() || '-'}</span></p>
                </div>
                <div className="space-y-1">
                  <p><span className="text-gray-600">📦 수령인:</span> <span className="font-bold">{orderData.recipient_name || '-'}</span></p>
                  <p><span className="text-gray-600">📍 배송지:</span> <span className="font-bold">{typeof orderData.recipient_address === 'object' ? orderData.recipient_address?.detail : ''} {detailAddress ? '(' + detailAddress + ')' : ''}</span></p>
                  <p><span className="text-gray-600">🕰️ 배송시간:</span> <span className="font-bold text-green-600">{orderData.delivery_date} {orderData.delivery_time}</span></p>
                  {orderData.receiver_store_id ? (
                    <p><span className="text-gray-600">🏪 수주화원:</span> <span className="font-bold">{availableStores.find(s => s.id === orderData.receiver_store_id)?.business_name || '지정됨'}</span></p>
                  ) : (
                    <p><span className="text-gray-600">🏪 수주화원:</span> <span className="font-bold text-blue-600">본사 자동배정</span></p>
                  )}
                </div>
              </div>
            </section>
            {/* 6. 결제 정보 */}
            <section className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="text-pink-500" size={20} />
                {isEditMode ? '주문 금액' : '결제 정보'}
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>상품 금액</span>
                  <span>{totals.subtotal.toLocaleString()}원</span>
                </div>
                {totals.additionalFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>추가 비용 ({orderData.additional_fee_reason || '기타'})</span>
                    <span className="text-orange-600">+{totals.additionalFee.toLocaleString()}원</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>총 {isEditMode ? '주문' : '결제'} 금액</span>
                  <span className="text-pink-600">{totals.total.toLocaleString()}원</span>
                </div>
              </div>
              {!isEditMode && (
                <p className="text-xs text-gray-600 mt-3">
                  포인트 잔액: {(currentStore?.points_balance || 0).toLocaleString()}원 → {((currentStore?.points_balance || 0) - totals.total).toLocaleString()}원
                </p>
              )}
              {isEditMode && (
                <p className="text-xs text-orange-600 mt-3">
                  * 주문 수정 시 추가 포인트는 차감되지 않습니다
                </p>
              )}
            </section>
          </div>
          {/* Submit Buttons */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <button
                onClick={() => router.back()}
                className="btn-secondary"
              >
                취소
              </button>
              <div className="flex gap-2">
                {!isEditMode && (currentStore?.points_balance || 0) < totals.total && (
                  <button
                    onClick={() => setShowChargeModal(true)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Plus size={16} />
                    포인트 충전
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? '처리중...' : (isEditMode ? '주문 수정하기' : '주문하기')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 포인트 충전 모달 */}
      {showChargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">포인트 충전</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">충전 금액</label>
                <div className="grid grid-cols-3 gap-2">
                  {[100000, 200000, 500000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setChargeAmount(amount)}
                      className={`py-2 px-3 rounded ${
                        chargeAmount === amount
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {(amount / 10000)}만원
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  className="input mt-2"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(parseInt(e.target.value))}
                  min="100000"
                  step="10000"
                />
                <p className="text-xs text-gray-500 mt-1">최소 충전 금액: 100,000원</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowChargeModal(false)}
                  className="btn-secondary flex-1"
                >
                  취소
                </button>
                <button
                  onClick={handleCharge}
                  className="btn-primary flex-1"
                >
                  충전하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
