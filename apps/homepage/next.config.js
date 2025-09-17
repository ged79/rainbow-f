/** @type {import('next').NextConfig} */
const nextConfig = {
  // 이미지 최적화 설정 (단순화)
  images: {
    // WebP만 사용 (AVIF는 너무 느림)
    formats: ['image/webp'],
    
    // 디바이스 크기 단순화
    deviceSizes: [640, 1080, 1920],
    imageSizes: [64, 128, 256, 384],
    
    // 캐싱 설정 (1년)
    minimumCacheTTL: 60 * 60 * 24 * 365,
    
    // 로컬 이미지 최적화
    unoptimized: false,
    
    // Supabase Storage 도메인 추가
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qvgxqluwumbgslbxaeaq.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // 기타 설정
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig