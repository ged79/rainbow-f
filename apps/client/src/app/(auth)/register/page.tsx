'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { AREA_OPTIONS } from '@/lib/constants/areas'
import { getFloristProducts } from '@/lib/services/productService'
import { 
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  Store,
  ChevronDown,
  Settings,
  Package
} from 'lucide-react'

declare global {
  interface Window {
    daum: any
  }
}

interface ProductPricing {
  product_id: string
  product_name: string
  price: number
  is_available: boolean
}

interface DeliveryAreaWithMinAmount {
  area: string
  minAmount: number
  productPricing: ProductPricing[]
}

interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  business_name: string
  business_license: string
  owner_name: string
  phone: string
  address: {
    sido: string
    sigungu: string
    dong: string
    detail: string
    postal_code: string
  }
  bank_name: string
  account_number: string
  account_holder: string
  service_areas_with_amounts: DeliveryAreaWithMinAmount[]
  agree_terms: boolean
}

const STEPS = [
  { title: '계정 정보', icon: Mail },
  { title: '사업자 정보', icon: Building },
  { title: '주소 정보', icon: MapPin },
  { title: '정산 정보', icon: CreditCard }
]

const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', 
  '농협은행', '기업은행', 'SC제일은행', '카카오뱅크'
]

const DEFAULT_MIN_AMOUNT = 30000

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [existingStores, setExistingStores] = useState<any[]>([])
  const [detailAddress, setDetailAddress] = useState('')
  const [selectedAreasWithAmounts, setSelectedAreasWithAmounts] = useState<DeliveryAreaWithMinAmount[]>([])
  const [showAreaModal, setShowAreaModal] = useState(false)
  const [tempSelectedArea, setTempSelectedArea] = useState<string>('')
  const [tempMinAmount, setTempMinAmount] = useState(DEFAULT_MIN_AMOUNT)
  const [tempProductPricing, setTempProductPricing] = useState<ProductPricing[]>([])
  const [dbProducts, setDbProducts] = useState<any[]>([])

  const [data, setData] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    business_name: '',
    business_license: '',
    owner_name: '',
    phone: '',
    address: {
      sido: '',
      sigungu: '',
      dong: '',
      detail: '',
      postal_code: ''
    },
    bank_name: '',
    account_number: '',
    account_holder: '',
    service_areas_with_amounts: [],
    agree_terms: false
  })

  useEffect(() => {
    loadProducts()
    checkExistingStores()
    
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const loadProducts = async () => {
    const products = await getFloristProducts()
    setDbProducts(products)
    if (products.length > 0) {
      setTempProductPricing(
        products.map(p => ({
          product_id: p.id,
          product_name: p.floristName,
          price: p.floristPrice,
          is_available: true
        }))
      )
    }
  }

  useEffect(() => {
    const areas = selectedAreasWithAmounts.map(item => item.area)
    if (areas.length > 0) {
      searchStoresInArea(areas)
    } else {
      setExistingStores([])
    }
  }, [selectedAreasWithAmounts])

  const openAddressSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      toast.error('주소 검색 서비스를 로드중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    new window.daum.Postcode({
      oncomplete: (result: any) => {
        const fullAddr = result.roadAddress || result.jibunAddress
        const sido = result.sido
        const sigungu = result.sigungu
        const dong = result.bname
        const postal_code = result.zonecode

        setData({
          ...data,
          address: {
            sido,
            sigungu,
            dong,
            detail: fullAddr,
            postal_code
          }
        })
      }
    }).open()
  }

  const searchStoresInArea = async (areas: string[]) => {
    if (areas.length === 0) return

    try {
      const supabase = createClient()
      const { data: stores, error } = await supabase
        .from('stores')
        .select('*')
        .overlaps('service_areas', areas)
        .eq('status', 'active')
        .limit(20)

      if (stores && stores.length > 0) {
        setExistingStores(stores)
      } else {
        setExistingStores([])
      }
    } catch (error) {
      console.error('Failed to search stores:', error)
    }
  }

  const handleAreaSelection = (area: string) => {
    const existingArea = selectedAreasWithAmounts.find(a => a.area === area)
    
    if (existingArea) {
      // 이미 선택된 지역이면 수정 모달 오픈
      setTempSelectedArea(area)
      setTempMinAmount(existingArea.minAmount)
      setTempProductPricing([...existingArea.productPricing])
      setShowAreaModal(true)
    } else {
      // 새로운 지역 추가
      setTempSelectedArea(area)
      setTempMinAmount(DEFAULT_MIN_AMOUNT)
      setTempProductPricing(
        dbProducts.map(p => ({
          product_id: p.id,
          product_name: p.floristName,
          price: p.floristPrice,
          is_available: true
        }))
      )
      setShowAreaModal(true)
    }
  }

  const handleSaveArea = () => {
    if (tempMinAmount < 10000) {
      toast.error('최소 주문금액은 10,000원 이상이어야 합니다')
      return
    }

    const newArea: DeliveryAreaWithMinAmount = {
      area: tempSelectedArea,
      minAmount: tempMinAmount,
      productPricing: [...tempProductPricing]
    }

    const existingIndex = selectedAreasWithAmounts.findIndex(a => a.area === tempSelectedArea)
    let newAreas: DeliveryAreaWithMinAmount[]

    if (existingIndex >= 0) {
      // 기존 지역 수정
      newAreas = [...selectedAreasWithAmounts]
      newAreas[existingIndex] = newArea
    } else {
      // 새 지역 추가
      newAreas = [...selectedAreasWithAmounts, newArea]
    }

    setSelectedAreasWithAmounts(newAreas)
    setData({ ...data, service_areas_with_amounts: newAreas })
    setShowAreaModal(false)
    setTempSelectedArea('')
  }

  const handleDeleteArea = (area: string) => {
    const newAreas = selectedAreasWithAmounts.filter(a => a.area !== area)
    setSelectedAreasWithAmounts(newAreas)
    setData({ ...data, service_areas_with_amounts: newAreas })
  }

  const validateStep = () => {
    const newErrors: Record<string, string> = {}

    switch(step) {
      case 1:
        if (!data.email) newErrors.email = '이메일을 입력하세요'
        if (!data.password) newErrors.password = '비밀번호를 입력하세요'
        if (data.password && data.password.length < 6) newErrors.password = '비밀번호는 6자 이상이어야 합니다'
        if (data.password !== data.confirmPassword) newErrors.confirmPassword = '비밀번호가 일치하지 않습니다'
        break
      case 2:
        if (!data.business_name) newErrors.business_name = '사업자명을 입력하세요'
        if (!data.business_license) newErrors.business_license = '사업자번호를 입력하세요'
        if (!data.owner_name) newErrors.owner_name = '대표자명을 입력하세요'
        if (!data.phone) newErrors.phone = '연락처를 입력하세요'
        break
      case 3:
        if (!data.address.detail) newErrors.address = '주소를 입력하세요'
        if (selectedAreasWithAmounts.length === 0) newErrors.service_areas = '서비스 지역을 선택하세요'
        break
      case 4:
        if (!data.bank_name) newErrors.bank_name = '은행을 선택하세요'
        if (!data.account_number) newErrors.account_number = '계좌번호를 입력하세요'
        if (!data.account_holder) newErrors.account_holder = '예금주를 입력하세요'
        if (!data.agree_terms) newErrors.agree_terms = '약관에 동의해주세요'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    setIsLoading(true)
    try {
      const supabase = createClient()

      // 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password
      })

      if (authError) throw authError

      const fullAddress = data.address.detail + (detailAddress ? ' ' + detailAddress : '')
      const service_areas = selectedAreasWithAmounts.map(item => item.area)

      // 스토어 생성
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .insert({
          user_id: authData.user?.id,
          store_code: `ST${Date.now()}`,
          business_name: data.business_name,
          business_license: data.business_license,
          owner_name: data.owner_name,
          phone: data.phone,
          email: data.email,
          address: {
            ...data.address,
            detail: fullAddress
          },
          service_areas: service_areas,
          bank_name: data.bank_name,
          account_number: data.account_number,
          account_holder: data.account_holder,
          status: 'pending',
          is_open: true,
          points_balance: 0
        })
        .select()
        .single()

      if (storeError) throw storeError

      // 배송 지역 생성
      const deliveryAreasData = selectedAreasWithAmounts.map(item => ({
        store_id: storeData.id,
        area_name: item.area,
        min_amount: item.minAmount,
        is_active: true
      }))

      const { error: deliveryAreasError } = await supabase
        .from('store_delivery_areas')
        .insert(deliveryAreasData)

      if (deliveryAreasError) {
        console.error('Failed to save delivery areas:', deliveryAreasError)
      }

      // 지역별 상품 가격 생성
      const areaPricingData: any[] = []
      selectedAreasWithAmounts.forEach(area => {
        area.productPricing.forEach(product => {
          areaPricingData.push({
            store_id: storeData.id,
            area_name: area.area,
            product_id: product.product_id,
            product_name: product.product_name,
            price: product.price,
            is_available: product.is_available
          })
        })
      })

      if (areaPricingData.length > 0) {
        const { error: areaPricingError } = await supabase
          .from('store_area_product_pricing')
          .insert(areaPricingData)

        if (areaPricingError) {
          console.error('Failed to save area pricing:', areaPricingError)
        }
      }

      // store_service_areas 테이블 생성 (기존 호환성)
      const serviceAreasData = service_areas.map(area => ({
        store_id: storeData.id,
        area_name: area
      }))

      const { error: serviceAreasError } = await supabase
        .from('store_service_areas')
        .insert(serviceAreasData)

      if (serviceAreasError) {
        console.error('Failed to save service areas:', serviceAreasError)
      }

      toast.success('회원가입이 완료되었습니다')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || '회원가입 실패')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">계정 정보</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className="input"
                value={data.email}
                onChange={(e) => setData({...data, email: e.target.value})}
                placeholder="example@email.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="input"
                value={data.password}
                onChange={(e) => setData({...data, password: e.target.value})}
                placeholder="6자 이상"
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="input"
                value={data.confirmPassword}
                onChange={(e) => setData({...data, confirmPassword: e.target.value})}
              />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">사업자 정보</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업자명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                value={data.business_name}
                onChange={(e) => setData({...data, business_name: e.target.value})}
                placeholder="OO꽃집"
              />
              {errors.business_name && <p className="text-xs text-red-500 mt-1">{errors.business_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업자번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                value={data.business_license}
                onChange={(e) => setData({...data, business_license: e.target.value})}
                placeholder="000-00-00000"
              />
              {errors.business_license && <p className="text-xs text-red-500 mt-1">{errors.business_license}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                대표자명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                value={data.owner_name}
                onChange={(e) => setData({...data, owner_name: e.target.value})}
              />
              {errors.owner_name && <p className="text-xs text-red-500 mt-1">{errors.owner_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className="input"
                value={data.phone}
                onChange={(e) => setData({...data, phone: e.target.value})}
                placeholder="010-0000-0000"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">주소 및 서비스 지역</h2>
            
            {/* 사업장 주소 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업장 주소 <span className="text-red-500">*</span>
              </label>
              <button
                onClick={openAddressSearch}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <Search size={16} />
                주소 검색
              </button>
              {data.address.detail && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">[{data.address.postal_code}]</p>
                  <p className="font-medium">{data.address.detail}</p>
                  <input
                    type="text"
                    className="input mt-2"
                    placeholder="상세 주소 (동/호수 등)"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                  />
                </div>
              )}
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
            </div>

            {/* 서비스 지역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                서비스 가능 지역 <span className="text-red-500">*</span>
              </label>

              {/* 선택된 지역 */}
              {selectedAreasWithAmounts.length > 0 && (
                <div className="mb-3 p-3 bg-pink-50 rounded">
                  <p className="text-sm font-medium text-pink-700 mb-2">
                    선택된 지역 ({selectedAreasWithAmounts.length}개)
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedAreasWithAmounts.map((item) => (
                      <div key={item.area} className="flex items-center justify-between bg-white p-2 rounded">
                        <div>
                          <span className="font-medium">{item.area}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            (최소: {item.minAmount.toLocaleString()}원)
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAreaSelection(item.area)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteArea(item.area)}
                            className="text-sm text-red-500 hover:text-red-700"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 지역 선택 드롭다운 */}
              <select
                className="w-full px-3 py-2 border rounded-lg"
                onChange={(e) => e.target.value && handleAreaSelection(e.target.value)}
                value=""
              >
                <option value="">지역을 선택하세요</option>
                {AREA_OPTIONS.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              {errors.service_areas && <p className="text-xs text-red-500 mt-1">{errors.service_areas}</p>}
            </div>

            {/* 기존 화원 표시 */}
            {existingStores.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  선택 지역 기존 화원 ({existingStores.length}개)
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {existingStores.map((store) => (
                    <div key={store.id} className="flex items-center gap-2 text-sm">
                      <Store size={14} className="text-blue-600" />
                      <span className="font-medium">{store.business_name}</span>
                      <span className="text-gray-600">
                        ({store.address.sido} {store.address.sigungu})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">정산 정보</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                은행명 <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={data.bank_name}
                onChange={(e) => setData({...data, bank_name: e.target.value})}
              >
                <option value="">선택하세요</option>
                {BANKS.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
              {errors.bank_name && <p className="text-xs text-red-500 mt-1">{errors.bank_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                계좌번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                value={data.account_number}
                onChange={(e) => setData({...data, account_number: e.target.value})}
                placeholder="'-' 없이 입력"
              />
              {errors.account_number && <p className="text-xs text-red-500 mt-1">{errors.account_number}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                예금주 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                value={data.account_holder}
                onChange={(e) => setData({...data, account_holder: e.target.value})}
              />
              {errors.account_holder && <p className="text-xs text-red-500 mt-1">{errors.account_holder}</p>}
            </div>
            <div className="pt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.agree_terms}
                  onChange={(e) => setData({...data, agree_terms: e.target.checked})}
                />
                <span className="text-sm">이용약관 및 개인정보처리방침에 동의합니다</span>
              </label>
              {errors.agree_terms && <p className="text-xs text-red-500 mt-1">{errors.agree_terms}</p>}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🌸 화원 회원가입
            </h1>
            <p className="text-gray-600">
              전국 꽃배달 네트워크에 참여하세요
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between">
              {STEPS.map((s, i) => {
                const Icon = s.icon
                const isActive = i + 1 <= step
                const isCompleted = i + 1 < step
                return (
                  <div key={i} className="flex-1 text-center">
                    <div className="relative">
                      {i > 0 && (
                        <div className={`absolute top-5 -left-1/2 right-1/2 h-0.5 ${
                          isActive ? 'bg-pink-500' : 'bg-gray-300'
                        }`} />
                      )}
                      <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                        isActive ? 'bg-pink-500 text-white' : 'bg-gray-300 text-gray-500'
                      }`}>
                        {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                      </div>
                    </div>
                    <p className="text-xs mt-2">{s.title}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {renderStep()}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => step > 1 ? setStep(step - 1) : router.push('/login')}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft size={16} />
                {step === 1 ? '취소' : '이전'}
              </button>
              {step < 4 ? (
                <button
                  onClick={() => validateStep() && setStep(step + 1)}
                  className="btn-primary flex items-center gap-2"
                >
                  다음
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? '가입중...' : '가입완료'}
                </button>
              )}
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              이미 계정이 있으신가요?{' '}
              <a href="/login" className="text-pink-500 font-semibold hover:underline">
                로그인
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* 지역별 상품 설정 모달 */}
      {showAreaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">{tempSelectedArea} 지역 설정</h3>
              <button
                onClick={() => setShowAreaModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 주문금액
              </label>
              <input
                type="number"
                value={tempMinAmount}
                onChange={(e) => setTempMinAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
                step="1000"
              />
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">상품별 가격 설정</h4>
              
              {/* 근조화환 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">근조화환</h5>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={tempProductPricing.filter(p => p.product_name.includes('근조')).every(p => p.is_available)}
                      onChange={(e) => {
                        const newPricing = [...tempProductPricing]
                        newPricing.forEach(p => {
                          if (p.product_name.includes('근조')) {
                            p.is_available = e.target.checked
                          }
                        })
                        setTempProductPricing(newPricing)
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    전체 선택
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tempProductPricing
                    .filter(p => p.product_name.includes('근조'))
                    .map((product) => (
                      <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={product.is_available}
                            onChange={(e) => {
                              const newPricing = [...tempProductPricing]
                              const index = newPricing.findIndex(p => p.product_id === product.product_id)
                              newPricing[index].is_available = e.target.checked
                              setTempProductPricing(newPricing)
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className={`text-sm ${!product.is_available ? 'text-gray-400 line-through' : ''}`}>
                            {product.product_name}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => {
                            const newPricing = [...tempProductPricing]
                            const index = newPricing.findIndex(p => p.product_id === product.product_id)
                            newPricing[index].price = Number(e.target.value)
                            setTempProductPricing(newPricing)
                          }}
                          disabled={!product.is_available}
                          className={`w-20 sm:w-24 px-2 py-1 border rounded text-sm ${!product.is_available ? 'bg-gray-100' : ''}`}
                          step="1000"
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* 축하화환 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">축하화환</h5>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={tempProductPricing.filter(p => p.product_name.includes('축하')).every(p => p.is_available)}
                      onChange={(e) => {
                        const newPricing = [...tempProductPricing]
                        newPricing.forEach(p => {
                          if (p.product_name.includes('축하')) {
                            p.is_available = e.target.checked
                          }
                        })
                        setTempProductPricing(newPricing)
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    전체 선택
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tempProductPricing
                    .filter(p => p.product_name.includes('축하'))
                    .map((product) => (
                      <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={product.is_available}
                            onChange={(e) => {
                              const newPricing = [...tempProductPricing]
                              const index = newPricing.findIndex(p => p.product_id === product.product_id)
                              newPricing[index].is_available = e.target.checked
                              setTempProductPricing(newPricing)
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className={`text-sm ${!product.is_available ? 'text-gray-400 line-through' : ''}`}>
                            {product.product_name}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => {
                            const newPricing = [...tempProductPricing]
                            const index = newPricing.findIndex(p => p.product_id === product.product_id)
                            newPricing[index].price = Number(e.target.value)
                            setTempProductPricing(newPricing)
                          }}
                          disabled={!product.is_available}
                          className={`w-20 sm:w-24 px-2 py-1 border rounded text-sm ${!product.is_available ? 'bg-gray-100' : ''}`}
                          step="1000"
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* 화분·난 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">화분·난</h5>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={tempProductPricing.filter(p => ['금전수', '해피트리', '아레카', '벵갈', '호접란', '만천홍'].some(name => p.product_name.includes(name))).every(p => p.is_available)}
                      onChange={(e) => {
                        const newPricing = [...tempProductPricing]
                        newPricing.forEach(p => {
                          if (['금전수', '해피트리', '아레카', '벵갈', '호접란', '만천홍'].some(name => p.product_name.includes(name))) {
                            p.is_available = e.target.checked
                          }
                        })
                        setTempProductPricing(newPricing)
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    전체 선택
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tempProductPricing
                    .filter(p => ['금전수', '해피트리', '아레카', '벵갈', '호접란', '만천홍'].some(name => p.product_name.includes(name)))
                    .map((product) => (
                      <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={product.is_available}
                            onChange={(e) => {
                              const newPricing = [...tempProductPricing]
                              const index = newPricing.findIndex(p => p.product_id === product.product_id)
                              newPricing[index].is_available = e.target.checked
                              setTempProductPricing(newPricing)
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className={`text-sm ${!product.is_available ? 'text-gray-400 line-through' : ''}`}>
                            {product.product_name}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => {
                            const newPricing = [...tempProductPricing]
                            const index = newPricing.findIndex(p => p.product_id === product.product_id)
                            newPricing[index].price = Number(e.target.value)
                            setTempProductPricing(newPricing)
                          }}
                          disabled={!product.is_available}
                          className={`w-20 sm:w-24 px-2 py-1 border rounded text-sm ${!product.is_available ? 'bg-gray-100' : ''}`}
                          step="1000"
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* 꽃상품 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">꽃상품</h5>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={tempProductPricing.filter(p => ['꽃다발', '꽃바구니'].some(name => p.product_name.includes(name))).every(p => p.is_available)}
                      onChange={(e) => {
                        const newPricing = [...tempProductPricing]
                        newPricing.forEach(p => {
                          if (['꽃다발', '꽃바구니'].some(name => p.product_name.includes(name))) {
                            p.is_available = e.target.checked
                          }
                        })
                        setTempProductPricing(newPricing)
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    전체 선택
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tempProductPricing
                    .filter(p => ['꽃다발', '꽃바구니'].some(name => p.product_name.includes(name)))
                    .map((product) => (
                      <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={product.is_available}
                            onChange={(e) => {
                              const newPricing = [...tempProductPricing]
                              const index = newPricing.findIndex(p => p.product_id === product.product_id)
                              newPricing[index].is_available = e.target.checked
                              setTempProductPricing(newPricing)
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className={`text-sm ${!product.is_available ? 'text-gray-400 line-through' : ''}`}>
                            {product.product_name}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => {
                            const newPricing = [...tempProductPricing]
                            const index = newPricing.findIndex(p => p.product_id === product.product_id)
                            newPricing[index].price = Number(e.target.value)
                            setTempProductPricing(newPricing)
                          }}
                          disabled={!product.is_available}
                          className={`w-20 sm:w-24 px-2 py-1 border rounded text-sm ${!product.is_available ? 'bg-gray-100' : ''}`}
                          step="1000"
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAreaModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleSaveArea}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
