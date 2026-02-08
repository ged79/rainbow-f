'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false)
  
  const threshold = 80
  const maxPull = 120

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].pageY)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === 0 || isRefreshing) return
      
      const currentY = e.touches[0].pageY
      const diff = currentY - startY
      
      if (diff > 0 && window.scrollY === 0) {
        e.preventDefault()
        const distance = Math.min(diff * 0.5, maxPull)
        setPullDistance(distance)
        setShowRefreshIndicator(distance > 20)
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance > threshold && !isRefreshing) {
        setIsRefreshing(true)
        
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(20)
        
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }
      
      setPullDistance(0)
      setStartY(0)
      setShowRefreshIndicator(false)
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [startY, pullDistance, isRefreshing, onRefresh])

  return (
    <div className="relative">
      {/* Refresh Indicator */}
      {showRefreshIndicator && (
        <div 
          className="absolute top-0 left-0 right-0 flex justify-center transition-all duration-200 z-50"
          style={{ 
            transform: `translateY(${pullDistance - 40}px)`,
            opacity: Math.min(pullDistance / threshold, 1)
          }}
        >
          <div className={`
            w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center
            ${isRefreshing ? 'animate-spin' : ''}
          `}>
            <RefreshCw 
              className={`w-5 h-5 transition-colors ${
                pullDistance > threshold ? 'text-rose-500' : 'text-neutral-400'
              }`}
            />
          </div>
        </div>
      )}
      
      {/* Content */}
      <div 
        style={{ 
          transform: showRefreshIndicator ? `translateY(${pullDistance}px)` : 'none',
          transition: !startY ? 'transform 0.2s' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  )
}