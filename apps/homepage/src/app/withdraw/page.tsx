'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EmotionalNavbar from '../../components/EmotionalNavbar'
import { ArrowLeft, Wallet, AlertCircle, CheckCircle } from 'lucide-react'

export default function WithdrawPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [totalPoints, setTotalPoints] = useState(0)
  const [withdrawableAmount, setWithdrawableAmount] = useState(0)
  const [selectedAmount, setSelectedAmount] = useState(0)
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const memberSession = localStorage.getItem('flower-member')
    if (!memberSession) {
      router.push('/login')
      return
    }
    
    const member = JSON.parse(memberSession)
    setPhone(member.phone)
    checkWithdrawable(member.phone)
  }, [])

  const checkWithdrawable = async (phone: string) => {
    try {
      const res = await fetch(`/api/withdraw?phone=${phone}`)
      const data = await res.json()
      setTotalPoints(data.totalPoints)
      setWithdrawableAmount(data.withdrawableAmount)
    } catch (error) {
      console.error('Failed to check withdrawable amount:', error)
    }
  }

  const handleWithdraw = async () => {
    if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) {
      setError('은행 정보를 모두 입력해주세요')
      return
    }

    if (selectedAmount === 0) {
      setError('출금 금액을 선택해주세요')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          amount: selectedAmount,
          bankInfo
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/points')
        }, 2000)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('출금 신청 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const amountOptions = []
  for (let i = 5000; i <= withdrawableAmount; i += 5000) {
    amountOptions.push(i)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">출금 신청 완료</h2>
          <p className="text-gray-600">1-2 영업일 이내 처리됩니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmotionalNavbar fixed />
      
      <div className="pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>뒤로가기</span>
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">포인트 출금</h1>
            <p className="text-gray-600">5,000원 단위로 출금 가능합니다</p>
          </div>

          {/* 포인트 현황 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">보유 포인트</p>
                <p className="text-2xl font-bold text-gray-900">{totalPoints.toLocaleString()}원</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">출금 가능</p>
                <p className="text-2xl font-bold text-blue-600">{withdrawableAmount.toLocaleString()}원</p>
              </div>
            </div>
          </div>

          {withdrawableAmount < 5000 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">출금 불가</p>
                <p className="text-sm text-yellow-700">최소 5,000원 이상 보유 시 출금 가능합니다</p>
              </div>
            </div>
          ) : (
            <>
              {/* 출금 금액 선택 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">출금 금액</h3>
                <div className="grid grid-cols-2 gap-3">
                  {amountOptions.map(amount => (
                    <button
                      key={amount}
                      onClick={() => setSelectedAmount(amount)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedAmount === amount
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {amount.toLocaleString()}원
                    </button>
                  ))}
                </div>
              </div>

              {/* 은행 정보 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">입금 계좌</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">은행</label>
                    <select
                      value={bankInfo.bankName}
                      onChange={(e) => setBankInfo({...bankInfo, bankName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">선택하세요</option>
                      <option value="KB국민">KB국민</option>
                      <option value="신한">신한</option>
                      <option value="우리">우리</option>
                      <option value="하나">하나</option>
                      <option value="농협">농협</option>
                      <option value="기업">기업</option>
                      <option value="카카오뱅크">카카오뱅크</option>
                      <option value="토스뱅크">토스뱅크</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                    <input
                      type="text"
                      value={bankInfo.accountNumber}
                      onChange={(e) => setBankInfo({...bankInfo, accountNumber: e.target.value})}
                      placeholder="- 없이 입력"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">예금주</label>
                    <input
                      type="text"
                      value={bankInfo.accountHolder}
                      onChange={(e) => setBankInfo({...bankInfo, accountHolder: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleWithdraw}
                disabled={isLoading || selectedAmount === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold"
              >
                {isLoading ? '처리중...' : `${selectedAmount.toLocaleString()}원 출금 신청`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
