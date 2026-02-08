/**
 * Completion Types - Order completion data structures
 */

export interface CompletionData {
  receiverName: string      
  receiverPhone?: string    
  deliveryPhoto?: File      
  deliveryMemo: string      
}

export interface CompletionFormData {
  recipient_name: string
  recipient_phone?: string
  note: string
  photos: File[]
}

export interface CompletionResponse {
  photos: string[]
  recipient_name: string
  recipient_phone?: string
  note?: string
  completed_at: string
}
