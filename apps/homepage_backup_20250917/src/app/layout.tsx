import type { Metadata } from 'next'
import './globals.css'
import ErrorBoundary from '../components/ErrorBoundary'
import Footer from '../components/Footer'

export const metadata: Metadata = {
  title: 'BLOOM - 프리미엄 꽃배달 서비스',
  description: '신선한 꽃으로 마음을 전하세요. 전국 당일배송 가능한 꽃배달 서비스',
  keywords: '꽃배달, 꽃집, 생일꽃, 축하꽃, 당일배송, BLOOM',
  openGraph: {
    title: 'BLOOM - 프리미엄 꽃배달',
    description: '신선한 꽃으로 마음을 전하세요',
    url: 'https://bloom.co.kr',
    siteName: 'BLOOM',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BLOOM',
    description: '프리미엄 꽃배달 서비스',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Noto+Serif+KR:wght@400;500;600;700;900&display=swap" 
          rel="stylesheet" 
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        {/* Kakao SDK */}
        <script src="https://developers.kakao.com/sdk/js/kakao.min.js" async></script>
      </head>
      <body className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-serif antialiased">
        <ErrorBoundary>
          {children}
          <Footer />
        </ErrorBoundary>
      </body>
    </html>
  )
}