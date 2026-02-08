'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Coins } from 'lucide-react'

const heroSlides = [
  { 
    image: '/코스모스.jpg', 
    title: '전국 3시간 당일배송'
  },
  { 
    image: '/프리미엄 꽃다발.jpg', 
    title: '구매금액 최대 5% 포인트 적립'
  },
  { 
    image: '/믹스부케.jpg', 
    title: '추천인도 3% 포인트 적립'
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
      <div className="relative w-full h-[45vh]">
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
        
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-2xl font-light leading-tight max-w-[70%]">
            {currentSlide === 1 || currentSlide === 2 ? (
              <Link href="/points-guide" className="underline underline-offset-2">
                {heroSlides[currentSlide].title}
              </Link>
            ) : (
              heroSlides[currentSlide].title
            )}
          </h1>
        </div>

        <div className="absolute bottom-16 left-6 flex gap-2">
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

      {/* 포인트 혜택 플로팅 버튼 - 오른쪽 하단 */}
      <Link 
        href="/points-guide" 
        className="fixed bottom-6 right-6 z-50 bg-rose-500 hover:bg-rose-600 transition-all duration-300 rounded-full w-14 h-14 flex items-center justify-center shadow-xl"
      >
        <span className="text-white text-xl font-bold">P</span>
      </Link>
    </section>
  )
}