/**
 * Notification Service
 * Handles SMS and Email notifications for order events
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// SMS Provider Configuration (replace with your provider)
const SMS_API_KEY = process.env.SMS_API_KEY
const SMS_API_URL = process.env.SMS_API_URL || 'https://api.aligo.in/send/'
const SMS_SENDER = process.env.SMS_SENDER || '1234-5678'

interface NotificationOptions {
  orderId: string
  type: 'delivery_complete' | 'order_accepted' | 'order_cancelled'
  recipient: {
    name: string
    phone: string
    email?: string
  }
  data: Record<string, any>
}

/**
 * Send SMS notification
 */
async function sendSMS(phone: string, message: string): Promise<boolean> {
  try {
    // Remove dashes from phone number
    const cleanPhone = phone.replace(/-/g, '')
    
    // Korean SMS providers (Aligo example)
    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        key: SMS_API_KEY || '',
        user_id: process.env.SMS_USER_ID || '',
        sender: SMS_SENDER,
        receiver: cleanPhone,
        msg: message,
        testmode_yn: process.env.NODE_ENV === 'development' ? 'Y' : 'N'
      })
    })

    const result = await response.json()
    
    if (result.result_code !== 1) {
      logger.error('SMS send failed', { phone, error: result.message })
      return false
    }

    logger.info('SMS sent successfully', { phone })
    return true
  } catch (error) {
    logger.error('SMS send error', error)
    return false
  }
}

/**
 * Send Email notification (using Supabase Auth email or external service)
 */
async function sendEmail(email: string, subject: string, html: string): Promise<boolean> {
  try {
    // Option 1: Use Supabase Edge Functions for email
    // Option 2: Use SendGrid, AWS SES, etc.
    
    // For now, we'll just log it
    logger.info('Email would be sent', { email, subject })
    
    // TODO: Implement actual email sending
    // const response = await fetch('/api/email/send', {
    //   method: 'POST',
    //   body: JSON.stringify({ to: email, subject, html })
    // })
    
    return true
  } catch (error) {
    logger.error('Email send error', error)
    return false
  }
}

/**
 * Send delivery completion notification
 */
export async function sendDeliveryCompleteNotification(
  order: any,
  completionData: {
    recipient_name: string
    photos?: string[]
    note: string
  }
): Promise<void> {
  try {
    const supabase = createClient()
    
    // Build SMS message
    const smsMessage = `[꽃배달 완료]
주문번호: ${order.order_number}
상품: ${order.product?.name}
수령인: ${completionData.recipient_name}

배송이 완료되었습니다.
${completionData.photos?.length ? '배송 사진이 촬영되었습니다.' : ''}

문의: ${SMS_SENDER}`

    // Send SMS to customer
    if (order.customer?.phone) {
      await sendSMS(order.customer.phone, smsMessage)
    }

    // Send SMS to recipient if different
    if (order.recipient?.phone && order.recipient.phone !== order.customer?.phone) {
      await sendSMS(order.recipient.phone, smsMessage)
    }

    // Log notification
    await supabase.from('notification_logs').insert({
      order_id: order.id,
      type: 'delivery_complete',
      recipient_phone: order.customer?.phone,
      message: smsMessage,
      status: 'sent',
      created_at: new Date().toISOString()
    })

    // Send email if available
    if (order.customer?.email) {
      const emailHtml = `
        <h2>배송 완료 안내</h2>
        <p>안녕하세요, ${order.customer.name}님</p>
        <p>주문하신 상품이 배송 완료되었습니다.</p>
        <hr>
        <p><strong>주문번호:</strong> ${order.order_number}</p>
        <p><strong>상품:</strong> ${order.product?.name}</p>
        <p><strong>수령인:</strong> ${completionData.recipient_name}</p>
        <p><strong>배송 메모:</strong> ${completionData.note}</p>
        ${completionData.photos?.length ? '<p>배송 증빙 사진이 첨부되었습니다.</p>' : ''}
        <hr>
        <p>감사합니다.</p>
      `
      
      await sendEmail(
        order.customer.email,
        '배송 완료 안내',
        emailHtml
      )
    }

  } catch (error) {
    logger.error('Failed to send delivery notification', error)
    // Don't throw - notification failure shouldn't block order completion
  }
}

/**
 * Send order accepted notification
 */
export async function sendOrderAcceptedNotification(order: any): Promise<void> {
  try {
    const smsMessage = `[주문 접수]
주문번호: ${order.order_number}
${order.product?.name}

화원에서 주문을 접수했습니다.
배송 예정: ${order.recipient?.delivery_date} ${order.recipient?.delivery_time}

문의: ${SMS_SENDER}`

    if (order.customer?.phone) {
      await sendSMS(order.customer.phone, smsMessage)
    }
  } catch (error) {
    logger.error('Failed to send order accepted notification', error)
  }
}

/**
 * Test notification system
 */
export async function testNotification(phone: string): Promise<boolean> {
  try {
    const testMessage = `[테스트] 꽃배달 플랫폼 알림 테스트입니다. 
이 메시지를 받으셨다면 알림 시스템이 정상 작동중입니다.`
    
    return await sendSMS(phone, testMessage)
  } catch (error) {
    logger.error('Notification test failed', error)
    return false
  }
}