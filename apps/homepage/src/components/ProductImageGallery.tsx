'use client'

import { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { placeholderImage } from '@/lib/placeholderImage'

interface ProductImageGalleryProps {
  images?: {
    main?: string
    left45?: string
    right45?: string
  }
  image?: string
  productName: string
  isMobile?: boolean
}

export default function ProductImageGallery({ images, image, productName, isMobile }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [mobileZoom, setMobileZoom] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // 이미지 소스 결정
  const defaultImage = placeholderImage
  
  // 이미지 리스트 생성 - 실제 이미지가 있는 것만 포함
  const imageList = []
  
  if (images?.main) {
    imageList.push({ src: images.main, label: '정면' })
  }
  if (images?.left45 && images.left45 !== images.main) {
    imageList.push({ src: images.left45, label: '좌측 45°' })
  }
  if (images?.right45 && images.right45 !== images.main) {
    imageList.push({ src: images.right45, label: '우측 45°' })
  }
  
  // 이미지 리스트가 비어있으면 단일 이미지 또는 기본 이미지 사용
  if (imageList.length === 0) {
    const singleImage = image || images?.main || defaultImage
    imageList.push({ src: singleImage, label: '정면' })
  }

  // 현재 표시할 이미지
  const currentImage = imageList[Math.min(selectedImage, imageList.length - 1)].src

  // 데스크톱 마우스 줌
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isZooming) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setZoomPosition({ x, y })
  }

  // 모바일 터치 줌
  useEffect(() => {
    if (!imageRef.current) return

    let initialDistance = 0
    let currentScale = 1

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance > 0) {
        e.preventDefault()
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        
        currentScale = Math.min(3, Math.max(1, (currentDistance / initialDistance) * mobileZoom))
        setMobileZoom(currentScale)
      }
    }

    const element = imageRef.current
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
    }
  }, [mobileZoom])

  return (
    <div>
      {/* 메인 이미지 컨테이너 */}
      <div className="relative mb-4">
        {/* 데스크톱 줌 */}
        <div 
          ref={containerRef}
          className="hidden lg:block relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-50 cursor-zoom-in"
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={handleMouseMove}
        >
          <img 
            src={currentImage}
            alt={productName}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = defaultImage
            }}
          />
          
          {/* 줌된 이미지 (데스크톱) */}
          {isZooming && currentImage && currentImage !== defaultImage && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url("${currentImage}")`,
                backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                backgroundSize: '250%',
                backgroundRepeat: 'no-repeat'
              }}
            />
          )}
        </div>

        {/* 모바일 이미지 */}
        <div className="lg:hidden relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-50">
          <img 
            ref={imageRef}
            src={currentImage}
            alt={productName}
            className="w-full h-full object-cover touch-none"
            style={{ 
              transform: `scale(${mobileZoom})`,
              transition: 'transform 0.3s ease'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = defaultImage
            }}
          />
          
          {/* 모바일 줌 인디케이터 */}
          {mobileZoom > 1 && (
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {mobileZoom.toFixed(1)}x
            </div>
          )}
        </div>

        {/* 데스크톱 줌 힌트 */}
        {currentImage && currentImage !== defaultImage && (
          <div className="hidden lg:block absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
            마우스를 올려 확대
          </div>
        )}
      </div>

      {/* 썸네일 이미지 - 여러 이미지가 있을 때만 표시 */}
      {imageList.length > 1 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {imageList.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-[4/5] rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === index 
                  ? 'border-neutral-900 ring-2 ring-neutral-900 ring-offset-2' 
                  : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <img 
                src={img.src}
                alt={`${productName} ${img.label}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = defaultImage
                }}
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <span className="text-white text-xs font-medium">{img.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}


    </div>
  )
}
