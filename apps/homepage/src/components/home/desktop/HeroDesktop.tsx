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
    title: '마음을 전하는',
    subtitle: '특별한 순간'
  },
  { 
    image: '/프리미엄 꽃다발.jpg', 
    title: '사랑과 감사를',
    subtitle: '꽃으로 표현하세요'
  },
  { 
    image: '/믹스부케.jpg', 
    title: '인생의 모든',
    subtitle: '아름다운 순간에'
  }
]

export default function HeroDesktop() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Main Hero Image Slider */}
      <div className="relative w-full h-[75vh]">
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
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90"></div>
        
        {/* Hero Text Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end items-start text-left px-16 pb-32">
          <h1 className="text-6xl font-light text-white mb-4 tracking-tight drop-shadow-lg">
            <span className="font-normal">{heroSlides[currentSlide].title}</span><br/>
            <span className="font-light">{heroSlides[currentSlide].subtitle}</span>
          </h1>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-10 left-16 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-white w-8' 
                  : 'bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Category Section - Desktop Optimized */}
      <div className="relative -mt-10 z-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="bg-white rounded-xl shadow-lg p-12">
            <h3 className="text-center text-xl font-light text-gray-700 mb-10">
              어떤 마음을 전하고 싶으신가요?
            </h3>
            
            {/* Desktop Grid - 4 columns */}
            <div className="grid grid-cols-4 gap-8">
              {categories.map((category) => (
                <Link key={category.id} href={`/category/${category.id}`}>
                  <div className="group text-center cursor-pointer">
                    <div className="relative overflow-hidden rounded-2xl mb-4 aspect-square bg-gray-100">
                      <img 
                        src={category.image} 
                        alt={category.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                      <div className="absolute top-3 left-3 text-3xl">{category.icon}</div>
                    </div>
                    <p className="text-base font-medium text-gray-700 group-hover:text-pink-600 transition-colors duration-300">
                      {category.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}