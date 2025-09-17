// src/services/imageStorage.ts
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
export interface UploadResult {
  url: string
  path: string
  size: number
}
export class ImageStorageService {
  private static BUCKET_NAME = 'order-photos'
  private static MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  private static ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  /**
   * Initialize storage bucket (run once on app startup)
   * Note: This requires admin privileges or needs to be done via Supabase dashboard
   */
  static async initializeBucket() {
    const supabase = createClient()
    try {
      // Try to check if bucket exists by getting its details
      const { data: files } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('', { limit: 1 })
      // If we can list files, bucket exists and is accessible
      return true
    } catch (error) {
      // Bucket might exist but we can't access it, or it doesn't exist
      // For production, create bucket via Supabase dashboard
      return false
    }
  }
  /**
   * Compress image before upload
   */
  private static async compressImage(
    file: File,
    maxWidth: number = 1200,
    maxHeight: number = 1200,
    quality: number = 0.85
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Calculate new dimensions
          let width = img.width
          let height = img.height
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height
            if (width > height) {
              width = maxWidth
              height = width / aspectRatio
            } else {
              height = maxHeight
              width = height * aspectRatio
            }
          }
          // Create canvas and resize
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }
          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height)
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to compress image'))
              }
            },
            'image/jpeg',
            quality
          )
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }
  /**
   * Upload image to Supabase Storage
   */
  static async uploadImage(
    file: File,
    orderId: string,
    compress: boolean = true
  ): Promise<UploadResult> {
    const supabase = createClient()
    // Validate file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${this.ALLOWED_TYPES.join(', ')}`)
    }
    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`)
    }
    // Compress image if needed
    let uploadFile: Blob = file
    if (compress && file.size > 500 * 1024) { // Compress if > 500KB
      uploadFile = await this.compressImage(file)
    }
    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${orderId}/${uuidv4()}.${fileExt}`
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, uploadFile, {
        cacheControl: '31536000', // 1 year cache
        upsert: false
      })
    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`)
    }
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName)
    return {
      url: publicUrl,
      path: data.path,
      size: uploadFile.size
    }
  }
  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(
    files: File[],
    orderId: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []
    for (let i = 0; i < files.length; i++) {
      if (onProgress) {
        onProgress(i + 1, files.length)
      }
      try {
        const result = await this.uploadImage(files[i], orderId)
        results.push(result)
      } catch (error) {
        // Continue with other uploads
      }
    }
    return results
  }
  /**
   * Delete image from storage
   */
  static async deleteImage(path: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([path])
    if (error) {
      throw new Error(`Failed to delete image: ${error.message}`)
    }
  }
  /**
   * Get signed URL for private access (if needed in future)
   */
  static async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(path, expiresIn)
    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }
    return data.signedUrl
  }
  /**
   * Migrate Base64 image to Storage
   */
  static async migrateBase64ToStorage(
    base64String: string,
    orderId: string
  ): Promise<UploadResult> {
    // Convert base64 to blob
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '')
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/jpeg' })
    // Create File object
    const file = new File([blob], `migrated-${Date.now()}.jpg`, { type: 'image/jpeg' })
    // Upload to storage
    return await this.uploadImage(file, orderId, false) // Don't compress again
  }
}
// Export as default for easier imports
export default ImageStorageService