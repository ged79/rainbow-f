import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk'

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!

export interface TossPaymentRequest {
  amount: number
  orderId: string
  orderName: string
  customerName: string
  customerEmail?: string
  customerMobilePhone?: string
  successUrl: string
  failUrl: string
}

export const requestTossPayment = async (paymentData: TossPaymentRequest) => {
  const paymentWidget = await loadPaymentWidget(clientKey, paymentData.customerMobilePhone || 'ANONYMOUS')
  
  await paymentWidget.requestPayment({
    orderId: paymentData.orderId,
    orderName: paymentData.orderName,
    successUrl: paymentData.successUrl,
    failUrl: paymentData.failUrl,
    customerName: paymentData.customerName,
    customerMobilePhone: paymentData.customerMobilePhone,
  })
}
