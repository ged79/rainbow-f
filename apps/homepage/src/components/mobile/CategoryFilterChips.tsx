'use client'

import { useState, useRef, useEffect } from 'react'
import { SlidersHorizontal, TrendingUp, Clock, DollarSign, Star } from 'lucide-react'

interface FilterChipsProps {
  onFilterChange?: (filters: any) => void
  onSortChange?: (sort: string) => void
}

export default function CategoryFilterChips({ onFilterChange, onSortChange }: FilterChipsProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSort, setSelectedSort] = useState('popular')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const categories = [
    { id: 'all', label: '전체', emoji: '🌸' },
    { id: 'opening', label: '개업·행사', emoji: '🎊' },
    { id: 'wedding', label: '결혼식', emoji: '💐' },
    { id: 'funeral', label: '장례식', emoji: '🤍' },
    { id: 'celebration', label: '기념일', emoji: '🎉' },
    { id: 'birthday', label: '생일', emoji: '🎂' },
    { id: 'love', label: '사랑·고백', emoji: '❤️' },
  ]

  const sortOptions = [
    { id: 'popular', label: '인기순', icon: TrendingUp },
    { id: 'newest', label: '최신순', icon: Clock },
    { id: 'price_low', label: '낮은가격', icon: DollarSign },
    { id: 'price_high', label: '높은가격', icon: DollarSign },
    { id: 'rating', label: '평점순', icon: Star },
  ]

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    onFilterChange?.({ category: categoryId })
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10)
  }

  const handleSortSelect = (sortId: string) => {
    setSelectedSort(sortId)
    setShowSortMenu(false)
    onSortChange?.(sortId)
  }

  if (!mounted) return null
  
  return (
    <div className="sticky top-16 z-30 bg-white border-b border-neutral-100">
      {/* Filter Chips */}
      <div className="relative">
        <div 
          ref={scrollRef}
          className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`
                flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium
                whitespace-nowrap transition-all duration-200 active:scale-95
                ${selectedCategory === category.id 
                  ? 'bg-rose-500 text-white shadow-md' 
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }
              `}
            >
              <span>{category.emoji}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
        
        {/* Sort Button */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center shadow-sm active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Sort Dropdown */}
      {showSortMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowSortMenu(false)}
          />
          <div className="absolute right-4 top-14 z-50 bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden">
            {sortOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.id}
                  onClick={() => handleSortSelect(option.id)}
                  className={`
                    w-36 px-4 py-2.5 flex items-center gap-2 text-sm
                    ${selectedSort === option.id 
                      ? 'bg-rose-50 text-rose-600 font-medium' 
                      : 'text-neutral-700 hover:bg-neutral-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}