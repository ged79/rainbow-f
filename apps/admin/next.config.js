/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  // output: 'standalone', // Windows symlink 에러로 인해 비활성화
  swcMinify: true,
  poweredByHeader: false,
  
  // Skip static generation for error pages
  generateBuildId: async () => {
    return 'admin-build'
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qvgxqluwumbgslbxaeaq.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  env: {
    NEXT_PUBLIC_APP_NAME: '전국꽃배달 관리자',
    NEXT_PUBLIC_APP_VERSION: '2.0.0',
  },
  
  webpack: (config, { isServer }) => {
    // Fix 'self is not defined' error
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        encoding: false,
      }
    }
    
    if (!isServer) {
      config.optimization.minimize = true;
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      };
    }
    
    return config;
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ]
      }
    ];
  },
  
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      }
    ];
  },
}

module.exports = nextConfig
