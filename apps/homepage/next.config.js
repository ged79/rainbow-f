/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA 설정
  headers: async () => [
    {
      source: '/service-worker.js',
      headers: [
        {
          key: 'Service-Worker-Allowed',
          value: '/',
        },
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
      ],
    },
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET,POST,PUT,DELETE,OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type',
        },
      ],
    },
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],
  
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