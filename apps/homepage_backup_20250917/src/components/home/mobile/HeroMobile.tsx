'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const categories = [
  { id: 'opening', name: '개업·행사', icon: '🎊', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop' },
  { id: 'wedding', name: '결혼식', icon: '💐', image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=300&h=300&fit=crop' },
  { id: 'funeral', name: '장례식', icon: '🕊️', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300&h=300&fit=crop' },
  { id: 'celebration', name: '승진·기념일', icon: '🎁', image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=300&h=300&fit=crop' }
]

const heroSlides = [
  { 
    image: '/코스모스.jpg', 
    title: '마음을 전하는 특별한 순간'
  },
  { 
    image: '/프리미엄 꽃다발.jpg', 
    title: '사랑과 감사를 꽃으로'
  },
  { 
    image: '/믹스부케.jpg', 
    title: '인생의 아름다운 순간'
  }
]

export default function HeroMobile() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative bg-white">
      {/* Mobile Hero - Smaller height */}
      <div className="relative w-full h-[50vh]">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img 
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        ))}
        
        {/* Mobile Hero Text - Simplified */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-2xl font-light leading-tight">
            {heroSlides[currentSlide].title}
          </h1>
        </div>

        {/* Slide Dots - Centered */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-white w-6' 
                  : 'bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Mobile Categories - Optimized for touch */}
      <div className="bg-white p-4">
        <h3 className="text-center text-sm font-medium text-gray-700 mb-4">
          어떤 마음을 전하고 싶으신가요?
        </h3>
        
        {/* 2x2 Grid for mobile */}
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <Link key={category.id} href={`/category/${category.id}`}>
              <div className="group cursor-pointer bg-gray-50 rounded-xl p-3 active:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl flex-shrink-0">{category.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {category.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.id === 'opening' && '개업, 이전, 전시회'}
                      {category.id === 'wedding' && '결혼, 약혼, 프로포즈'}
                      {category.id === 'funeral' && '근조, 애도, 위로'}
                      {category.id === 'celebration' && '승진, 생일, 기념일'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions - Mobile only */}
      <div className="bg-gray-50 p-4 border-t">
        <div className="flex justify-around">
          <button className="flex flex-col items-center space-y-1 p-2">
            <span className="text-2xl">📞</span>
            <span className="text-xs text-gray-600">전화주문</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2">
            <span className="text-2xl">⏱️</span>
            <span className="text-xs text-gray-600">당일배송</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2">
            <span className="text-2xl">💬</span>
            <span className="text-xs text-gray-600">카톡상담</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2">
            <span className="text-2xl">🎁</span>
            <span className="text-xs text-gray-600">이벤트</span>
          </button>
        </div>
      </div>
    </section>
  )
}