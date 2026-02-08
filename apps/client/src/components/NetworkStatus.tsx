'use client'

import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setTimeout(() => setShowBanner(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    // Check initial status
    setIsOnline(navigator.onLine)
    setShowBanner(!navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showBanner) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-white transition-all ${
      isOnline ? 'bg-green-500' : 'bg-red-500'
    }`}>
      <div className="flex items-center justify-center gap-2">
        {!isOnline && <WifiOff size={16} />}
        {isOnline ? '인터넷 연결됨' : '인터넷 연결 끊김'}
      </div>
    </div>
  )
}
