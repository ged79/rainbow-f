/**
 * Resize image to maximum dimensions while maintaining aspect ratio
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.8
): Promise<string> {
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
        
        // Convert to base64 with compression
        const base64 = canvas.toDataURL('image/jpeg', quality)
        
        // console.log('Original size:', file.size, 'bytes')
        // console.log('Resized base64 length:', base64.length)
        // console.log('Estimated size:', Math.round(base64.length * 0.75 / 1024), 'KB')
        
        resolve(base64)
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Compress image file to target size
 */
export async function compressImage(
  file: File,
  targetSizeKB: number = 500
): Promise<string> {
  let quality = 0.9
  let base64 = ''
  let width = 1200
  let height = 900
  
  // Try different quality levels until we get under target size
  while (quality > 0.1) {
    base64 = await resizeImage(file, width, height, quality)
    const sizeKB = Math.round(base64.length * 0.75 / 1024)
    
    if (sizeKB <= targetSizeKB) {
      // console.log(`Compressed to ${sizeKB}KB with quality ${quality}`)
      break
    }
    
    // Reduce quality or dimensions
    if (quality > 0.5) {
      quality -= 0.1
    } else {
      width = Math.round(width * 0.8)
      height = Math.round(height * 0.8)
      quality = 0.8
    }
  }
  
  return base64
}