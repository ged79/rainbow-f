/**
 * 최적화된 이미지 컴포넌트
 * WebP + 반응형 + Lazy Loading
 */

'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getOptimizedImageUrl, generateSrcSet, generateSizes, getFallbackImageUrl } from '@/lib/optimized-image'

interface OptimizedImageProps {
  src: string
  alt: string
  size?: 'thumbnail' | 'small' | 'medium' | 'large'
  className?: string
  priority?: boolean
  fill?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  onClick?: () => void
}

export default function OptimizedImage({
  src,
  alt,
  size = 'medium',
  className = '',
  priority = false,
  fill = false,
  objectFit = 'cover',
  onClick
}: OptimizedImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  // 에러 발생시 fallback 이미지 사용
  const imageSrc = error ? '/placeholder.jpg' : getOptimizedImageUrl(src, size)

  const handleLoad = () => {
    setLoading(false)
  }

  const handleError = () => {
    console.error(`Failed to load image: ${src}`)
    setError(true)
    setLoading(false)
  }

  const sizes = {
    thumbnail: 200,
    small: 400,
    medium: 800,
    large: 1200,
  }

  if (fill) {
    return (
      <div className={`relative overflow-hidden ${className}`} onClick={onClick}>
        {loading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <Image
          src={imageSrc}
          alt={alt}
          fill
          style={{ objectFit }}
          quality={85}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          sizes={generateSizes()}
        />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {loading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        width={sizes[size]}
        height={sizes[size]}
        quality={85}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        className="w-full h-auto"
      />
    </div>
  )
}

/**
 * 상품 카드용 이미지 (정사각형)
 */
export function ProductImage({
  src,
  alt,
  size = 'medium',
  className = '',
  onClick
}: Omit<OptimizedImageProps, 'fill' | 'objectFit'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      size={size}
      className={className}
      onClick={onClick}
    />
  )
}

/**
 * 히어로 배너용 이미지 (전체 채움)
 */
export function HeroImage({
  src,
  alt,
  className = '',
  priority = true
}: Omit<OptimizedImageProps, 'size' | 'fill' | 'objectFit'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      size="large"
      fill
      objectFit="cover"
      className={className}
      priority={priority}
    />
  )
}

/**
 * 썸네일 이미지 (작은 크기)
 */
export function ThumbnailImage({
  src,
  alt,
  className = ''
}: Omit<OptimizedImageProps, 'size' | 'priority' | 'fill'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      size="thumbnail"
      className={className}
    />
  )
}
