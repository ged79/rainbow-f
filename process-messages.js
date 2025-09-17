// Message Queue Worker - Run this as a separate process or cron job
// Usage: node process-messages.js

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function sendToAligo(phone, message) {
  if (!process.env.ALIGO_API_KEY || !process.env.ALIGO_USER_ID) {
    console.log('Test mode - would send:', phone, message)
    return { success: true, test: true }
  }

  try {
    const response = await fetch('https://api.aligo.in/send/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        key: process.env.ALIGO_API_KEY,
        user_id: process.env.ALIGO_USER_ID,
        sender: process.env.BUSINESS_PHONE || '02-1234-5678',
        receiver: phone,
        msg: message,
        msg_type: 'LMS'
      })
    })
    
    const result = await response.json()
    return { success: result.result_code === '1', data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function processMessages() {
  console.log('Processing message queue...')
  
  // Get pending messages (max 10 at a time)
  const { data: messages, error } = await supabase
    .from('message_queue')
    .select('*')
    .eq('status', 'pending')
    .lt('attempts', 3)
    .order('created_at', { ascending: true })
    .limit(10)
  
  if (error) {
    console.error('Error fetching messages:', error)
    return
  }
  
  if (!messages || messages.length === 0) {
    console.log('No pending messages')
    return
  }
  
  console.log(`Found ${messages.length} messages to process`)
  
  for (const msg of messages) {
    console.log(`Processing message ${msg.id} to ${msg.phone}`)
    
    // Send message
    const result = await sendToAligo(msg.phone, msg.message)
    
    if (result.success) {
      // Mark as sent
      await supabase
        .from('message_queue')
        .update({
          status: 'sent',
          processed_at: new Date().toISOString()
        })
        .eq('id', msg.id)
      
      console.log(`✓ Message ${msg.id} sent successfully`)
    } else {
      // Increment attempts
      await supabase
        .from('message_queue')
        .update({
          attempts: msg.attempts + 1,
          error_message: result.error || 'Send failed',
          status: msg.attempts >= 2 ? 'failed' : 'pending'
        })
        .eq('id', msg.id)
      
      console.log(`✗ Message ${msg.id} failed: ${result.error}`)
    }
    
    // Rate limit: wait 1 second between messages
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

// Run every 30 seconds
async function startWorker() {
  while (true) {
    await processMessages()
    await new Promise(resolve => setTimeout(resolve, 30000))
  }
}

// Start the worker
if (require.main === module) {
  console.log('Starting message queue worker...')
  startWorker().catch(console.error)
}

module.exports = { processMessages }
