'use client'

import { useState } from 'react'

export default function TestSMS() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const sendSMS = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        body: JSON.stringify({
          to: phone,
          body: message
        })
      })
      
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">NHN Cloud SMS 테스트</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-2">받는사람 번호</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            className="w-full border p-2 rounded"
          />
        </div>
        
        <div>
          <label className="block mb-2">메시지</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="테스트 메시지"
            rows={4}
            className="w-full border p-2 rounded"
          />
        </div>
        
        <button
          onClick={sendSMS}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? '전송중...' : 'SMS 전송'}
        </button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <pre className="text-sm overflow-auto">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
