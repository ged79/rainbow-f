// Test script to verify photo storage is working
// Run this in browser console after completing an order with photos

async function testPhotoStorage() {
  try {
    // Get the most recent completed order
    const response = await fetch('/api/orders?type=received&status=completed&limit=1')
    const { data } = await response.json()
    
    if (!data || data.length === 0) {
      console.log('No completed orders found')
      return
    }
    
    const order = data[0]
    console.log('Order ID:', order.id)
    console.log('Order Status:', order.status)
    
    // Check completion data
    if (order.completion) {
      console.log('✅ Completion data exists')
      console.log('Recipient:', order.completion.recipient_name)
      console.log('Note:', order.completion.note)
      
      // Check photos
      if (order.completion.photos && order.completion.photos.length > 0) {
        console.log('✅ Photos saved:', order.completion.photos.length, 'photos')
        console.log('Photo URLs:')
        order.completion.photos.forEach((url, i) => {
          console.log(`  ${i + 1}. ${url}`)
        })
        
        // Test if photos are accessible
        const testUrl = order.completion.photos[0]
        const imgTest = await fetch(testUrl, { method: 'HEAD' })
        if (imgTest.ok) {
          console.log('✅ First photo is accessible')
        } else {
          console.log('❌ First photo is NOT accessible')
        }
      } else {
        console.log('❌ No photos in completion data')
      }
    } else {
      console.log('❌ No completion data found')
    }
    
    // Raw data for debugging
    console.log('\nRaw order data:', order)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testPhotoStorage()
