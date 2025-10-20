/**
 * 최적화된 이미지 로딩 유틸리티
 * WebP + 반응형 사이즈 지원
 */

export interface OptimizedImageProps {
  src: string
  alt: string
  sizes?: 'thumbnail' | 'small' | 'medium' | 'large'
  className?: string
  priority?: boolean
}

/**
 * 이미지 경로를 최적화된 경로로 변환
 */
export function getOptimizedImageUrl(
  originalSrc: string, 
  size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'
): string {
  // 이미 최적화된 이미지거나 외부 URL이면 그대로 반환
  if (
    originalSrc.startsWith('http') || 
    originalSrc.startsWith('//') ||
    originalSrc.includes('/optimized/') ||
    originalSrc.startsWith('/icon-') ||
    originalSrc === '/placeholder.jpg'
  ) {
    return originalSrc
  }

  // /public/ 경로에서 파일명 추출
  const filename = originalSrc.split('/').pop() || ''
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png)$/i, '')
  
  // 최적화된 이미지 경로 반환
  return `/optimized/${nameWithoutExt}-${size}.webp`
}

/**
 * 반응형 srcset 생성
 */
export function generateSrcSet(originalSrc: string): string {
  const filename = originalSrc.split('/').pop() || ''
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png)$/i, '')
  
  return [
    `/optimized/${nameWithoutExt}-small.webp 400w`,
    `/optimized/${nameWithoutExt}-medium.webp 800w`,
    `/optimized/${nameWithoutExt}-large.webp 1200w`,
  ].join(', ')
}

/**
 * sizes 속성 생성 (반응형)
 */
export function generateSizes(): string {
  return '(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px'
}

/**
 * Fallback 이미지 경로 (WebP 미지원 브라우저용)
 */
export function getFallbackImageUrl(originalSrc: string): string {
  const filename = originalSrc.split('/').pop() || ''
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png)$/i, '')
  
  return `/optimized/${nameWithoutExt}-fallback.jpg`
}

/**
 * 이미지 프리로드 (LCP 개선)
 */
export function preloadImage(src: string) {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = src
  link.type = 'image/webp'
  
  document.head.appendChild(link)
}

/**
 * 레이지 로딩 체크
 */
export function shouldLazyLoad(priority?: boolean): 'lazy' | 'eager' {
  return priority ? 'eager' : 'lazy'
}

/**
 * 이미지 크기별 픽셀 너비
 */
export const IMAGE_WIDTHS = {
  thumbnail: 200,
  small: 400,
  medium: 800,
  large: 1200,
} as const

/**
 * Next.js Image 컴포넌트용 props 생성
 */
export function getNextImageProps(
  src: string,
  size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium',
  priority = false
) {
  return {
    src: getOptimizedImageUrl(src, size),
    width: IMAGE_WIDTHS[size],
    height: IMAGE_WIDTHS[size], // 1:1 비율 가정
    quality: 85,
    loading: shouldLazyLoad(priority),
    placeholder: 'blur' as const,
    blurDataURL: '/placeholder.jpg',
  }
}
