import { productsByCategory } from './categoryProducts'
// import type { Product } from '../types'

// Get recommended products based on current product - static data version
export const getRecommendedProducts = (currentProduct: any) => {
  // Combine all products from static data
  const allProducts = [
    ...productsByCategory.opening,
    ...productsByCategory.wedding,
    ...productsByCategory.funeral,
    ...productsByCategory.anniversary
  ]
  
  // Determine category from product name
  const getCategory = (name: string) => {
    if (name.includes('개업') || name.includes('행사')) return 'opening'
    if (name.includes('결혼') || name.includes('웨딩')) return 'wedding'
    if (name.includes('장례') || name.includes('근조')) return 'funeral'
    if (name.includes('승진') || name.includes('기념')) return 'anniversary'
    return 'other'
  }
  
  const currentCategory = getCategory(currentProduct.name)
  const priceRange = currentProduct.price * 0.3 // 30% price range
  
  // Score-based recommendation
  const scoredProducts = allProducts
    .filter(p => p.id !== currentProduct.id)
    .map(product => {
      let score = 0
      
      // Same category: +50 points
      if (getCategory(product.name) === currentCategory) score += 50
      
      // Similar price: +30 points
      const priceDiff = Math.abs(product.price - currentProduct.price)
      if (priceDiff < priceRange) {
        score += 30 * (1 - priceDiff / priceRange)
      }
      
      // Has discount: +10 points
      if ((product as any).originalPrice) score += 10
      
      // Random factor for variety: +0-10 points
      score += Math.random() * 10
      
      return { ...product, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
  
  return scoredProducts
}

// Get single product from static data
export const getProduct = (id: string) => {
  const allProducts = {
    ...productsByCategory.opening.reduce((acc: any, product) => {
      acc[product.id] = { ...product, category: '개업·행사', productType: '축하화환' }
      return acc
    }, {} as any),
    ...productsByCategory.wedding.reduce((acc: any, product) => {
      acc[product.id] = { ...product, category: '결혼식', productType: '꽃다발' }
      return acc
    }, {} as any),
    ...productsByCategory.funeral.reduce((acc: any, product) => {
      acc[product.id] = { ...product, category: '장례식', productType: '근조화환' }
      return acc
    }, {} as any),
    ...productsByCategory.anniversary.reduce((acc: any, product) => {
      acc[product.id] = { ...product, category: '승진·기념일', productType: '축하화환' }
      return acc
    }, {} as any)
  }
  
  return allProducts[id] || null
}

// For compatibility with pages trying to import from productService
export const getProductFromDB = getProduct
export const getProductById = getProduct