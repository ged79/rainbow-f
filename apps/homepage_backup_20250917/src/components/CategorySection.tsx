'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SectionProps {
  title: string
  subtitle: string
  products?: any[]
  bgColor: string
  titleColor?: string
  darkMode?: boolean
}

export default function CategorySection({ 
  title, 
  subtitle, 
  products = [], 
  bgColor, 
  titleColor = 'text-gray-900',
  darkMode = false 
}: SectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  }
  
  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
  }

  return (
    <section className={`py-12 ${bgColor}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : titleColor} mb-2`}>{title}</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{subtitle}</p>
        </div>
        
        <div className="relative">
          <div className="overflow-x-auto scrollbar-hide" ref={scrollRef}>
            <div className="flex gap-4">
              {products && products.length > 0 ? (
                products.map((product) => (
                  <Link key={product.id} href={`/order?id=${product.id}`}>
                    <div className="flex-shrink-0 w-64 bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer">
                      <div className="aspect-square relative overflow-hidden rounded-t-xl">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                        {product.tag && (
                          <span className={`absolute top-3 left-3 px-3 py-1 ${product.tagColor} text-white text-xs rounded-full`}>
                            {product.tag}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            {product.price?.toLocaleString()}원
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              {product.originalPrice.toLocaleString()}원
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 w-full">
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>상품이 없습니다</p>
                </div>
              )}
            </div>
          </div>
          
          {products && products.length > 4 && (
            <>
              <button 
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg rounded-full p-2 hover:shadow-xl transition-all"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button 
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg rounded-full p-2 hover:shadow-xl transition-all"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
