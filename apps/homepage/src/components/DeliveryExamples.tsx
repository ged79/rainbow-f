'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface DeliveryExampleProps {
  category?: string
}

export default function DeliveryExamples({ category }: DeliveryExampleProps) {
  const [examples, setExamples] = useState<any[]>([])
  
  useEffect(() => {
    loadDeliveryExamples()
  }, [category])
  
const loadDeliveryExamples = async () => {
  try {
    console.log('Loading examples for category:', category)
    const response = await fetch(`/api/delivery-examples${category ? `?category=${category}` : ''}`)
    const data = await response.json()
    console.log('Loaded examples:', data)
    setExamples(data)
  } catch (error) {
    console.error('Failed to load:', error)
  }
}
  
  if (examples.length === 0) return null
  
  return (
    <div className="mt-16 border-t pt-16">
      <h2 className="text-2xl font-bold mb-2">상품 갤러리</h2>
      <p className="text-gray-600 mb-8">실제 제작된 상품입니다</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {examples.map((example) => (
          <div key={example.id} className="bg-white rounded-lg overflow-hidden border">
            <div className="aspect-[4/5] relative group">
              <Image 
                src={example.image_url} 
                alt={example.product_name}
                fill
                className="object-cover"
              />
              {/* 리본 부분 블러 오버레이 */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/90 via-white/60 to-transparent backdrop-blur-sm">
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-medium text-gray-800">
                  {example.product_name}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}