// Global type definitions for homepage

export type ProductType = 
  | '근조화환' 
  | '축하화환' 
  | '꽃다발' 
  | '꽃바구니' 
  | '동양란' 
  | '서양란' 
  | '관엽화분' 
  | '쌀화환' 
  | '특수상품'

export interface Address {
  sido: string
  sigungu: string
  dong: string
  detail: string
  postal_code: string
}

export interface CreateOrderInput {
  customer_name: string
  customer_phone: string
  customer_memo?: string
  customer_company?: string
  recipient_name: string
  recipient_phone: string
  recipient_address: Address
  delivery_date: string
  delivery_time: string
  product_type: ProductType
  product_name: string
  product_price: number
  product_quantity: number
  ribbon_text?: string
  special_instructions?: string
  payment_method?: string
  receiver_store_id?: string
  additional_fee?: number
  additional_fee_reason?: string
}

export interface HomepageProduct {
  id: string
  name: string
  price: number
  image: string
  description?: string
  category?: string
  score?: number
}

export interface OrderItem {
  productId: string
  productName: string
  productImage: string
  price: number
  quantity: number
}

export interface OrderRequest {
  customerName: string
  customerPhone: string
  recipientName: string
  recipientPhone: string
  deliveryAddress: Address
  deliveryDate: string
  deliveryTime: string
  ribbonMessage?: string
  message?: string
  referrerPhone?: string
  discountAmount?: number
  totalAmount: number
  items: OrderItem[]
}
