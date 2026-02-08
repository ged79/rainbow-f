'use client'

import { useEffect, useState } from 'react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Service Worker 등록
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => console.log('SW registered:', reg))
        .catch((err) => console.error('SW registration failed:', err))
    }

    // PWA 설치 가능 이벤트 감지
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // 설치 프롬프트를 3초 후 표시
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 3000)
    }

    // 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice

    if (result.outcome === 'accepted') {
      console.log('PWA installed')
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleCloseClick = () => {
    setShowInstallPrompt(false)
    // 7일 후 다시 표시
    localStorage.setItem('pwa-install-dismissed', String(Date.now() + 7 * 24 * 60 * 60 * 1000))
  }

  // 이미 설치되었거나 닫기를 눌렀으면 표시하지 않음
  if (isInstalled || !showInstallPrompt) return null

  const dismissedTime = localStorage.getItem('pwa-install-dismissed')
  if (dismissedTime && Date.now() < Number(dismissedTime)) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌸</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900">
              앱으로 설치하기
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              홈 화면에 추가하고 더 빠르게 이용하세요
            </p>
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors"
              >
                설치하기
              </button>
              <button
                onClick={handleCloseClick}
                className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800"
              >
                나중에
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Tailwind 애니메이션 추가 필요 (globals.css에 추가)
// @keyframes slide-up {
//   from { transform: translateY(100%); opacity: 0; }
//   to { transform: translateY(0); opacity: 1; }
// }
// .animate-slide-up {
//   animation: slide-up 0.3s ease-out;
// }