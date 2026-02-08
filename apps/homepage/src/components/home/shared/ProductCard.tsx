'use client'

import Link from 'next/link'
import { useState } from 'react'

interface ProductCardProps {
  id: string
  name: string
  price: number
  image: string
  category: string
  description?: string
  isDesktop?: boolean
  isMobile?: boolean
}

export default function ProductCard({ 
  id, 
  name, 
  price, 
  image, 
  category, 
  description,
  isDesktop = false,
  isMobile = false 
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  const formattedPrice = price.toLocaleString('ko-KR')

  // Mobile Card Layout
  if (isMobile) {
    return (
      <Link href={`/order?product=${id}`}>
        <div className="bg-white rounded-lg shadow-sm active:shadow-md transition-shadow">
          <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-100">
            <img 
              src={imageError ? '/꽃.avif' : image} 
              alt={name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Quick Action Button - Mobile Only */}
            <button 
              className="absolute top-2 right-2 bg-white/90 rounded-full p-2 shadow-sm"
              onClick={(e) => {
                e.preventDefault()
                // Add to cart logic
              }}
            >
              <span className="text-lg">🛒</span>
            </button>
          </div>
          <div className="p-3">
            <h3 className="font-medium text-base text-gray-900 line-clamp-1">{name}</h3>
            <p className="text-xl font-bold text-pink-600 mt-1">{formattedPrice}원</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">당일배송</span>
              <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded">인기</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Desktop Card Layout
  return (
    <Link href={`/order?product=${id}`}>
      <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
        <div className="aspect-[4/5] relative overflow-hidden bg-gray-100">
          <img 
            src={imageError ? '/꽃.avif' : image} 
            alt={name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
          {/* Overlay on hover - Desktop */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <p className="text-sm line-clamp-2">{description || '아름다운 꽃으로 마음을 전하세요'}</p>
            </div>
          </div>
          
          {/* Quick Actions - Desktop */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
              onClick={(e) => {
                e.preventDefault()
                // Add to wishlist
              }}
            >
              <span className="text-lg">❤️</span>
            </button>
            <button 
              className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
              onClick={(e) => {
                e.preventDefault()
                // Quick view
              }}
            >
              <span className="text-lg">👁️</span>
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded">
              {category}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-xs text-gray-600">4.8</span>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-pink-600 transition-colors">
            {name}
          </h3>
          
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-gray-900">{formattedPrice}원</p>
            <span className="text-xs text-gray-500">당일배송 가능</span>
          </div>
          
          {/* Desktop Only - Add to Cart Button */}
          {isDesktop && (
            <button 
              className="w-full mt-3 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
              onClick={(e) => {
                e.preventDefault()
                // Add to cart
              }}
            >
              장바구니 담기
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
