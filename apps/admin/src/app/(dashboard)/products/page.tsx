'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Edit, Trash2, Upload, X, Check, Image as ImageIcon } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

// 카테고리 정의
const CATEGORIES = {
  '개업·행사': ['축하화환', '개업화분', '공기정화식물'],
  '결혼식': ['축하화환', '꽃다발', '꽃바구니'],
  '장례식': ['근조화환', '근조장구', '근조꽃바구니'],
  '승진·기념일': ['호접란', '탁상용화분', '특별한선물']
}

const GRADES = ['실속', '기본', '대', '특대']

interface Product {
  id: string
  base_name: string
  display_name: string
  grade?: string
  flower_count?: number
  price: number
  category_1: string
  category_2: string
  image_url?: string
  image_left45?: string
  image_right45?: string
  description?: string
  sort_order: number
  is_active: boolean
}

export default function ProductsPage() {
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedCategory1, setSelectedCategory1] = useState('')
  const [selectedCategory2, setSelectedCategory2] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // 3개 이미지 관리 (메인, 좌측45도, 우측45도)
  const [imageFiles, setImageFiles] = useState<{
    main: File | null
    left45: File | null
    right45: File | null
  }>({ main: null, left45: null, right45: null })
  
  const [imagePreviews, setImagePreviews] = useState<{
    main: string
    left45: string
    right45: string
  }>({ main: '', left45: '', right45: '' })
  
  const [formData, setFormData] = useState({
    base_name: '',
    display_name: '',
    florist_name: '',
    grade: '',
    flower_count: '',
    customer_price: '',
    florist_price: '',
    description: '',
    sort_order: 999,
    auto_calc: true
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 폼 초기화
  const resetForm = () => {
    setShowModal(false)
    setEditingProduct(null)
    setSelectedCategory1('')
    setSelectedCategory2('')
    setFormData({
      base_name: '',
      display_name: '',
      florist_name: '',
      grade: '',
      flower_count: '',
      customer_price: '',
      florist_price: '',
      description: '',
      sort_order: 999,
      auto_calc: true
    })
    setImageFiles({ main: null, left45: null, right45: null })
    setImagePreviews({ main: '', left45: '', right45: '' })
  }

  // 수정 모드
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setSelectedCategory1(product.category_1)
    setSelectedCategory2(product.category_2)
    setFormData({
      base_name: product.base_name,
      display_name: product.display_name,
      florist_name: (product as any).florist_name || product.display_name,
      grade: product.grade || '',
      flower_count: product.flower_count?.toString() || '',
      customer_price: ((product as any).customer_price || product.price).toString(),
      florist_price: ((product as any).florist_price || Math.floor(product.price * 0.7)).toString(),
      description: product.description || '',
      sort_order: product.sort_order,
      auto_calc: false  // 수정시는 자동계산 OFF
    })
    setImagePreviews({
      main: product.image_url || '',
      left45: product.image_left45 || '',
      right45: product.image_right45 || ''
    })
    setShowModal(true)
  }

  // 삭제
  const handleDelete = async (product: Product) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        const { error } = await supabase
          .from('products')
          .update({ is_active: false })
          .eq('id', product.id)

        if (error) throw error
        toast.success('상품이 삭제되었습니다')
        await loadProducts()
      } catch (error: any) {
        toast.error('삭제 실패: ' + error.message)
      }
    }
  }

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setMounted(true)
  }, [])

  // 상품 목록 로드
  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('category_1')
        .order('category_2')
        .order('sort_order')

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      toast.error('상품 목록 로드 실패: ' + error.message)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) {
      loadProducts()
    }
  }, [mounted])

  // 이미지 미리보기 생성
  const handleImageSelect = (file: File, type: 'main' | 'left45' | 'right45') => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreviews(prev => ({ ...prev, [type]: reader.result as string }))
    }
    reader.readAsDataURL(file)
    setImageFiles(prev => ({ ...prev, [type]: file }))
  }

  // 이미지 업로드
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('이미지 업로드 실패')
      return null
    }
  }

  // 상품 저장
  const handleSave = async () => {
    // 유효성 검사
    if (!selectedCategory1 || !selectedCategory2) {
      toast.error('카테고리를 선택하세요')
      return
    }

    if (!formData.display_name || !formData.customer_price) {
      toast.error('상품명과 고객가는 필수입니다')
      return
    }

    setUploading(true)

    try {
      let imageUrl = editingProduct?.image_url || null
      let imageLeft45 = editingProduct?.image_left45 || null
      let imageRight45 = editingProduct?.image_right45 || null
      
      // 메인 이미지 업로드
      if (imageFiles.main) {
        const uploadedUrl = await uploadImage(imageFiles.main)
        if (uploadedUrl) imageUrl = uploadedUrl
      }
      
      // 좌측 45도 이미지 업로드
      if (imageFiles.left45) {
        const uploadedUrl = await uploadImage(imageFiles.left45)
        if (uploadedUrl) imageLeft45 = uploadedUrl
      }
      
      // 우측 45도 이미지 업로드
      if (imageFiles.right45) {
        const uploadedUrl = await uploadImage(imageFiles.right45)
        if (uploadedUrl) imageRight45 = uploadedUrl
      }

      // 화환 가격 - 수동 설정 가능
      let calculatedFloristPrice = parseInt(formData.florist_price)

      // 상품 데이터 - 신규 컬럼 포함
      const productData: any = {
        base_name: formData.base_name || formData.display_name,
        display_name: formData.display_name,
        florist_name: formData.florist_name || formData.display_name,
        grade: formData.grade || null,
        flower_count: formData.flower_count ? parseInt(formData.flower_count) : null,
        price: parseInt(formData.customer_price), // 기존 호환성 유지
        customer_price: parseInt(formData.customer_price),
        florist_price: parseInt(formData.florist_price),
        category_1: selectedCategory1,
        category_2: selectedCategory2,
        image_url: imageUrl,
        image_left45: imageLeft45,
        image_right45: imageRight45,
        description: formData.description,
        sort_order: formData.sort_order,
        is_active: true
      }

      if (editingProduct) {
        // 수정
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
        toast.success('상품이 수정되었습니다')
      } else {
        // 신규 등록
        const { error } = await supabase
          .from('products')
          .insert([productData])

        if (error) throw error
        toast.success('상품이 등록되었습니다')
      }

      resetForm()
      await loadProducts()
    } catch (error: any) {
      toast.error('저장 실패: ' + error.message)
      console.error(error)
    } finally {
      setUploading(false)
    }
  }



  // 카테고리별 그룹화
  const groupedProducts = products.reduce((acc, product) => {
    const key = `${product.category_1}-${product.category_2}`
    if (!acc[key]) acc[key] = []
    acc[key].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  // 서버 사이드 렌더링 방지
  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">상품 관리</h1>
        <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            상품 등록
          </button>
      </div>

      {/* 상품 목록 */}
      <div className="space-y-8">
        {Object.entries(CATEGORIES).map(([cat1, cat2List]) => (
          <div key={cat1} className="bg-white rounded-lg shadow">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">{cat1}</h2>
            </div>
            <div className="p-4">
              {cat2List.map(cat2 => {
                const key = `${cat1}-${cat2}`
                const categoryProducts = groupedProducts[key] || []
                
                return (
                  <div key={cat2} className="mb-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">{cat2}</h3>
                    {categoryProducts.length === 0 ? (
                      <p className="text-gray-400 text-sm">등록된 상품이 없습니다</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryProducts.map(product => (
                          <div key={product.id} className="border rounded-lg p-3">
                            <div className="flex gap-3">
                              {/* 이미지 미리보기 */}
                              {product.image_url && (
                                <img 
                                  src={product.image_url} 
                                  alt={product.display_name}
                                  className="w-16 h-16 object-cover rounded border"
                                />
                              )}
                              
                              <div className="flex-1">
                                <h4 className="font-medium">{product.display_name}</h4>
                                {product.flower_count && (
                                  <p className="text-xs text-gray-500">{product.flower_count}송이</p>
                                )}
                                <p className="text-sm font-semibold text-blue-600">
                                  {product.price.toLocaleString()}원
                                </p>
                                {product.description && (
                                  <p className="text-xs text-gray-500">{product.description}</p>
                                )}
                              </div>
                              
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(product)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 등록/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">
                {editingProduct ? '상품 수정' : '상품 등록'}
              </h2>
              <button
                onClick={resetForm}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 카테고리 선택 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">1차 카테고리 *</label>
                  <select
                    value={selectedCategory1}
                    onChange={(e) => {
                      setSelectedCategory1(e.target.value)
                      setSelectedCategory2('')
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">선택하세요</option>
                    {Object.keys(CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">2차 카테고리 *</label>
                  <select
                    value={selectedCategory2}
                    onChange={(e) => setSelectedCategory2(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!selectedCategory1}
                  >
                    <option value="">선택하세요</option>
                    {selectedCategory1 && CATEGORIES[selectedCategory1 as keyof typeof CATEGORIES]?.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 상품명 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">홈페이지 표시명 *</label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="예: 100송이 축하화환"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">화원 표시명</label>
                  <input
                    type="text"
                    value={formData.florist_name}
                    onChange={(e) => setFormData({...formData, florist_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="예: 축하환환 특대형"
                  />
                </div>
              </div>

              {/* 가격 설정 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">고객가 (홈페이지) *</label>
                  <input
                    type="number"
                    value={formData.customer_price}
                    onChange={(e) => {
                      const customerPrice = e.target.value;
                      setFormData(prev => ({
                        ...prev, 
                        customer_price: customerPrice,
                        // 고객가 입력시 자동으로 30% 마진 (70% 화원가) 설정
                        florist_price: prev.auto_calc 
                          ? String(Math.floor(parseInt(customerPrice || '0') * 0.7)) 
                          : prev.florist_price
                      }))
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="95000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    화원가 *
                    <span className="text-xs text-gray-500 ml-2">(기본: 고객가의 70%)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.florist_price}
                    onChange={(e) => setFormData({...formData, florist_price: e.target.value, auto_calc: false})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="자동계산 또는 직접입력"
                  />
                  {formData.customer_price && formData.florist_price && (
                    <div className="text-xs mt-1 space-y-1">
                      <p className="text-gray-600">
                        마진: {(parseInt(formData.customer_price) - parseInt(formData.florist_price)).toLocaleString()}원
                        ({Math.round((parseInt(formData.customer_price) - parseInt(formData.florist_price)) / parseInt(formData.customer_price) * 100)}%)
                      </p>
                      {!formData.auto_calc && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              florist_price: String(Math.floor(parseInt(prev.customer_price || '0') * 0.7)),
                              auto_calc: true
                            }))
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          자동계산으로 재설정 (70%)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 화환 관련 옵션 */}
              {selectedCategory2?.includes('화환') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">등급</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({...formData, grade: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">선택</option>
                      {GRADES.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">송이수</label>
                    <input
                      type="number"
                      value={formData.flower_count}
                      onChange={(e) => setFormData({...formData, flower_count: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="100"
                    />
                  </div>
                </div>
              )}

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium mb-1">상품 설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="상품에 대한 간단한 설명"
                />
              </div>

              {/* 3개 이미지 업로드 (메인, 좌측 45도, 우측 45도) */}
              <div>
                <label className="block text-sm font-medium mb-2">상품 이미지 (3개 각도)</label>
                <div className="grid grid-cols-3 gap-4">
                  {/* 메인 이미지 */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1 text-center">정면 (메인) *</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 h-32 relative">
                      {imagePreviews.main ? (
                        <div className="relative h-full">
                          <img 
                            src={imagePreviews.main} 
                            alt="메인 미리보기" 
                            className="w-full h-full object-cover rounded"
                          />
                          <button
                            onClick={() => {
                              setImageFiles(prev => ({ ...prev, main: null }))
                              setImagePreviews(prev => ({ ...prev, main: '' }))
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer h-full flex flex-col items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageSelect(file, 'main')
                            }}
                            className="hidden"
                          />
                          <ImageIcon size={24} className="text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">클릭</p>
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mt-1 text-center">리스트용</p>
                  </div>
                  
                  {/* 좌측 45도 이미지 */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1 text-center">좌측 45°</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 h-32 relative">
                      {imagePreviews.left45 ? (
                        <div className="relative h-full">
                          <img 
                            src={imagePreviews.left45} 
                            alt="좌측 미리보기" 
                            className="w-full h-full object-cover rounded"
                          />
                          <button
                            onClick={() => {
                              setImageFiles(prev => ({ ...prev, left45: null }))
                              setImagePreviews(prev => ({ ...prev, left45: '' }))
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer h-full flex flex-col items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageSelect(file, 'left45')
                            }}
                            className="hidden"
                          />
                          <ImageIcon size={24} className="text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">클릭</p>
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">상세페이지</p>
                  </div>
                  
                  {/* 우측 45도 이미지 */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1 text-center">우측 45°</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 h-32 relative">
                      {imagePreviews.right45 ? (
                        <div className="relative h-full">
                          <img 
                            src={imagePreviews.right45} 
                            alt="우측 미리보기" 
                            className="w-full h-full object-cover rounded"
                          />
                          <button
                            onClick={() => {
                              setImageFiles(prev => ({ ...prev, right45: null }))
                              setImagePreviews(prev => ({ ...prev, right45: '' }))
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer h-full flex flex-col items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageSelect(file, 'right45')
                            }}
                            className="hidden"
                          />
                          <ImageIcon size={24} className="text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">클릭</p>
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">상세페이지</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG (최대 5MB) - 정면 이미지는 필수</p>
              </div>

              {/* 정렬 순서 */}
              <div>
                <label className="block text-sm font-medium mb-1">정렬 순서</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 999})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="999"
                />
                <p className="text-xs text-gray-500 mt-1">숫자가 작을수록 먼저 표시됩니다</p>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-2">
              <button
                onClick={resetForm}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
