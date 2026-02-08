'use client'

import { Suspense } from 'react'
import CartPageContent from './CartPageContent'

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    }>
      <CartPageContent />
    </Suspense>
  )
}