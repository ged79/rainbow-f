'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Sparkles, Heart, Flower, Gift } from 'lucide-react'
import Button from '../components/ui/Button'

const categories = [
  { 
    id: 'wedding', 
    name: '결혼식', 
    icon: Heart,
    image: '/백장미.jpg',
    description: '영원한 사랑을 약속합니다',
    bgColor: 'from-pink-50 to-rose-50',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-700',
    hoverBg: 'hover:from-pink-100 hover:to-rose-100'
  },
  { 
    id: 'funeral', 
    name: '장례식', 
    icon: Flower,
    image: '/근조_기본.png',
    description: '깊은 애도를 전합니다',
    bgColor: 'from-gray-100 to-slate-100',
    iconBg: 'bg-gray-200',
    iconColor: 'text-gray-700',
    hoverBg: 'hover:from-gray-200 hover:to-slate-200'
  },
  { 
    id: 'opening', 
    name: '개업·행사', 
    icon: Sparkles,
    image: '/꽃상자.jpg',
    description: '새로운 시작을 축하합니다',
    bgColor: 'from-emerald-50 to-teal-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    hoverBg: 'hover:from-emerald-100 hover:to-teal-100'
  },
  { 
    id: 'celebration', 
    name: '승진·기념일', 
    icon: Gift,
    image: '/호접란.jpg',
    description: '특별한 날을 기념합니다',
    bgColor: 'from-purple-50 to-violet-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-700',
    hoverBg: 'hover:from-purple-100 hover:to-violet-100'
  }
]

const heroSlides = [
  { 
    image: '/믹스부케.jpg', 
    title: '마음을 전하는',
    subtitle: '특별한 순간',
    description: '당신의 진심을 꽃으로 전달합니다'
  },
  { 
    image: '/코스모스.jpg', 
    title: '사랑과 감사를',
    subtitle: '꽃으로 표현하세요',
    description: '최고의 품질로 마음을 전합니다'
  },
  { 
    image: '/프리미엄 꽃다발.jpg', 
    title: '인생의 모든',
    subtitle: '아름다운 순간에',
    description: '특별한 날을 더욱 특별하게'
  }
]

export default function ModernHero() {
  const [mounted, setMounted] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    setMounted(true)
    setIsDesktop(window.innerWidth >= 1024)
    
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 11000)
    return () => clearInterval(timer)
  }, [isPaused])

  // 초기 로딩 시 데이지 이미지 표시
  if (!mounted) {
    return (
      <section className="relative overflow-hidden bg-white">
        <div className="relative w-full h-[85vh] min-h-[550px]">
          <Image 
            src="/데이지.jpg"
            alt="Loading"
            fill
            sizes="100vw"
            className="object-cover opacity-80"
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-pulse">
              <h2 className="text-3xl font-light text-white mb-2">BLOOM</h2>
              <p className="text-white/80">로딩 중...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // PC 버전
  if (isDesktop) {
    return (
      <section className="relative overflow-hidden bg-white">
        <div 
          className="relative w-full h-[70vh] min-h-[500px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1500 ease-in-out ${
                index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            >
              <Image 
                src={slide.image}
                alt={slide.title}
                fill
                sizes="100vw"
                className="object-cover"
                priority={index === 0}
                quality={90}
              />
              {index === 0 && (
                <div className="absolute inset-0 bg-black/20"></div>
              )}
            </div>
          ))}
          
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-8 w-full">
              <div className="max-w-2xl">
                <h1 className="text-4xl lg:text-5xl text-white mb-4 tracking-tight">
                <span className="font-light leading-tight">{heroSlides[currentSlide].title}</span><br/>
                <span className="font-bold">{heroSlides[currentSlide].subtitle}</span>
                </h1>
                <p className="text-lg text-white/90 mb-8 font-light">
                {heroSlides[currentSlide].description}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-white w-12' 
                    : 'bg-white/40 w-8 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative -mt-32 z-10 pb-20">
          <div className="max-w-7xl mx-auto px-8">
            <h3 className="text-center text-2xl font-light text-white mb-6 drop-shadow-lg">
              어떤 마음을 전하고 싶으신가요?
            </h3>
            
            <div className="grid grid-cols-4 gap-6">
              {categories.map((category, index) => {
                const IconComponent = category.icon
                return (
                  <Link key={category.id} href={`/category/${category.id}`}>
                    <div 
                      className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-500"
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden transform hover:-translate-y-1">
                        <div className={`h-32 bg-gradient-to-br ${category.bgColor} ${category.hoverBg} transition-all duration-300 flex items-center justify-center relative overflow-hidden`}>
                          <IconComponent className={`w-12 h-12 ${category.iconColor} transition-transform duration-300 group-hover:scale-110`} strokeWidth={1} />
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
                          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-neutral-900 mb-1 group-hover:text-rose-500 transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-sm text-neutral-600">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // 모바일 버전
  return (
    <section className="relative overflow-hidden bg-white">
      {/* 히어로 이미지 - 확대 */}
      <div className="relative w-full h-[85vh] min-h-[550px]">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img 
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {index === 0 && (
              <div className="absolute inset-0 bg-black/20"></div>
            )}
          </div>
        ))}
        
        <div className="absolute inset-0 flex items-end pb-12">
          <div className="px-4 w-full">
            <h1 className="text-2xl text-white mb-2 font-light">
              {heroSlides[currentSlide].title}<br/>
              <span className="font-bold">{heroSlides[currentSlide].subtitle}</span>
            </h1>
            <p className="text-white/90 mb-3 text-sm">
              {heroSlides[currentSlide].description}
            </p>
          </div>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-white w-8' 
                  : 'bg-white/40 w-6'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 카테고리 섹션 - 한줄 배치 */}
      <div className="px-4 py-3 bg-white">
        <h3 className="text-center text-sm font-medium text-neutral-900 mb-2">
          어떤 마음을 전하고 싶으신가요?
        </h3>
        
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <Link key={category.id} href={`/category/${category.id}`} className="flex-shrink-0">
                <div className="bg-white border border-neutral-200 rounded-lg p-2 hover:border-rose-300 hover:shadow-md transition-all w-[80px]">
                  <div className={`w-9 h-9 rounded-full ${category.iconBg} flex items-center justify-center mx-auto mb-1`}>
                    <IconComponent className={`w-5 h-5 ${category.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <h4 className="font-medium text-xs text-neutral-900 text-center">
                    {category.name}
                  </h4>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}