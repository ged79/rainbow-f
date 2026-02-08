// SMS 발송 유틸리티
export async function sendOrderConfirmationSMS(phoneNumber: string, orderNumber: string, productName: string) {
  const message = `[무지개꽃배달] 주문이 접수되었습니다.\n주문번호: ${orderNumber}\n상품: ${productName}\n감사합니다.`
  
  return sendSMS(phoneNumber, message)
}

export async function sendDeliveryCompleteSMS(phoneNumber: string, orderNumber: string, recipientName: string) {
  const message = `[무지개꽃배달] 배송이 완료되었습니다.\n주문번호: ${orderNumber}\n받으신 분: ${recipientName}\n감사합니다.`
  
  return sendSMS(phoneNumber, message)
}

async function sendSMS(to: string, body: string) {
  try {
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, body })
    })
    
    return await response.json()
  } catch (error) {
    console.error('SMS 발송 실패:', error)
    return null
  }
}
