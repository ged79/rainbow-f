'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/stores/useStore'
import toast from 'react-hot-toast'
import { Power, Store } from 'lucide-react'

export default function StoreStatusToggle() {
  const { currentStore, setCurrentStore } = useStore()
  const [isUpdating, setIsUpdating] = useState(false)
  
  const toggleStatus = async () => {
    if (!currentStore) return
    
    setIsUpdating(true)
    try {
      const supabase = createClient()
      const newStatus = !currentStore.is_open
      
      const { error } = await supabase
        .from('stores')
        .update({ is_open: newStatus })
        .eq('id', currentStore.id)
      
      if (error) throw error
      
      // Store 상태 업데이트
      const { data: updatedStore } = await supabase
        .from('stores')
        .select('*')
        .eq('id', currentStore.id)
        .single()
      
      if (updatedStore) {
        setCurrentStore(updatedStore)
      }
      
      toast.success(newStatus ? '영업을 시작했습니다' : '영업을 종료했습니다')
    } catch (error) {
      toast.error('상태 변경 실패')
    } finally {
      setIsUpdating(false)
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className={currentStore?.is_open ? 'text-green-500' : 'text-gray-400'} />
          <div>
            <h3 className="font-semibold">영업 상태</h3>
            <p className="text-sm text-gray-600">
              현재: {currentStore?.is_open ? '영업중' : '휴업중'}
            </p>
          </div>
        </div>
        
        <button
          onClick={toggleStatus}
          disabled={isUpdating}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            currentStore?.is_open 
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          <Power size={16} />
          {currentStore?.is_open ? '휴업하기' : '영업시작'}
        </button>
      </div>
      
      {currentStore?.status === 'pending' && (
        <div className="mt-4 p-3 bg-yellow-50 rounded text-sm text-yellow-800">
          ⚠️ 관리자 승인 대기중입니다. 승인 후 주문 수주가 가능합니다.
        </div>
      )}
    </div>
  )
}
