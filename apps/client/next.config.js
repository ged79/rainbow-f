// Check if next-pwa is installed
let withPWA;
try {
  withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
          }
        }
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-images',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
          }
        }
      },
      {
        urlPattern: /\/api\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-data',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60 // 5 minutes
          }
        }
      }
    ]
  });
} catch (e) {
  // next-pwa not installed, use regular config
  console.log('next-pwa not installed. Run: pnpm add next-pwa');
  withPWA = (config) => config;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['*.supabase.co'],
    unoptimized: true // For PWA offline support
  },
  // PWA metadata
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  }
}

module.exports = withPWA(nextConfig)