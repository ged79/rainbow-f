exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  try {
    const { to, body: message } = JSON.parse(event.body || '{}')
    
    console.log('Sending SMS:', { to, message })
    
    const response = await fetch(
      `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${process.env.NHN_SMS_APP_KEY}/sender/sms`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Secret-Key': process.env.NHN_SMS_SECRET_KEY
        },
        body: JSON.stringify({
          body: message,
          sendNo: process.env.NHN_SMS_SENDER,
          recipientList: [{ recipientNo: to }]
        })
      }
    )

    const data = await response.json()
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('SMS Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}