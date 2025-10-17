'use client'

import { Heart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, memo } from 'react'

interface ProductCardProps {
  product?: {
    id: string
    name: string
    price: number
    originalPrice?: number
    image: string
    description?: string
  }
  // 개별 props도 지원 (하위 호환성)
  id?: string
  name?: string
  price?: number
  originalPrice?: number
  image?: string
  description?: string
  isWishlisted?: boolean
  onWishlistToggle?: () => void
}

const ProductCard = memo(function ProductCard(props: ProductCardProps) {
  // product 객체가 있으면 그것을 사용, 없으면 개별 props 사용
  const {
    product,
    id: propId,
    name: propName,
    price: propPrice,
    originalPrice: propOriginalPrice,
    image: propImage,
    description: propDescription,
    isWishlisted = false,
    onWishlistToggle
  } = props

  const id = product?.id || propId || ''
  const name = product?.name || propName || '상품명 없음'
  const price = product?.price || propPrice || 0
  const originalPrice = product?.originalPrice || propOriginalPrice
  const image = product?.image || propImage || '/placeholder.jpg'
  const description = product?.description || propDescription
  const [imageLoaded, setImageLoaded] = useState(false)
  const discountRate = originalPrice ? Math.round((1 - price/originalPrice) * 100) : 0

  return (
    <Link href={`/order?id=${id}`}>
      <div className="group relative bg-white overflow-hidden border border-neutral-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1">
        
        <div className="aspect-[4/5] relative bg-gradient-to-br from-neutral-50 to-neutral-100 overflow-hidden">
          
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 animate-pulse" />
          )}
          
          <Image 
            src={image} 
            alt={name}
            width={400}
            height={500}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full ${
              name.includes('영정바구니') ? 'object-contain bg-gray-200' : 'object-cover'
            } object-center transition-all duration-700 ${
              imageLoaded ? 'opacity-100 group-hover:scale-110' : 'opacity-0'
            }`}
            quality={75}
            priority={false}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {discountRate > 0 && (
            <div className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
              {discountRate}%
            </div>
          )}
          
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {onWishlistToggle && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onWishlistToggle()
                }}
                className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all duration-200"
              >
                <Heart 
                  className={`w-5 h-5 transition-all ${
                    isWishlisted 
                      ? 'fill-rose-500 text-rose-500 scale-110' 
                      : 'text-neutral-600 hover:text-rose-500'
                  }`}
                />
              </button>
            )}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-base font-semibold text-neutral-900 mb-1 line-clamp-1 group-hover:text-rose-500 transition-colors">
            {name}
          </h3>
          
          {description && (
            <p className="text-sm text-neutral-500 mb-3 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {originalPrice && originalPrice > 0 && (
                <span className="text-xs text-neutral-400 line-through">
                  {originalPrice.toLocaleString()}원
                </span>
              )}
              <span className="text-xl font-black text-neutral-900">
                {(price || 0).toLocaleString()}
                <span className="text-sm font-medium">원</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
})

export default ProductCard