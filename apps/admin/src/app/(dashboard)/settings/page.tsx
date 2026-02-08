'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { 
  Settings, 
  Database, 
  Key, 
  Link, 
  FileText,
  Save,
  Shield,
  DollarSign,
  Bell
} from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('business')
  
  const [settings, setSettings] = useState({
    // Business
    defaultCommissionRate: 0.25,
    minSettlementAmount: 100000,
    settlementSchedule: 'weekly',
    autoApproveNewMembers: false,
    requireBusinessLicense: true,
    requireBankVerification: true,
    
    // System
    backupSchedule: 'daily',
    backupTime: '02:00',
    backupRetention: 30,
    logRetention: 90,
    sessionTimeout: 60,
    
    // API & Webhooks
    apiKeys: [
      { id: '1', name: 'Production API', key: 'sk_live_...', created: '2025-01-01', lastUsed: '2025-08-31' }
    ],
    webhooks: [
      { id: '1', url: 'https://example.com/webhook', events: ['order.created', 'order.completed'], active: true }
    ]
  })

  const handleSave = async () => {
    try {
      // TODO: Save to database
      toast.success('설정이 저장되었습니다')
    } catch (error) {
      toast.error('설정 저장 실패')
    }
  }

  const generateApiKey = () => {
    const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}`
    toast.success('새 API 키가 생성되었습니다')
    return newKey
  }

  const tabs = [
    { id: 'business', label: '비즈니스', icon: DollarSign },
    { id: 'system', label: '시스템', icon: Database },
    { id: 'api', label: 'API & 웹훅', icon: Key },
    { id: 'notifications', label: '알림', icon: Bell }
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">설정</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {/* Business Tab */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  기본 수수료율 (%)
                </label>
                <input
                  type="number"
                  value={settings.defaultCommissionRate * 100}
                  onChange={(e) => setSettings({...settings, defaultCommissionRate: Number(e.target.value) / 100})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  최소 정산 금액
                </label>
                <input
                  type="number"
                  value={settings.minSettlementAmount}
                  onChange={(e) => setSettings({...settings, minSettlementAmount: Number(e.target.value)})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                정산 주기
              </label>
              <select
                value={settings.settlementSchedule}
                onChange={(e) => setSettings({...settings, settlementSchedule: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
                <option value="monthly">매월</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoApproveNewMembers}
                  onChange={(e) => setSettings({...settings, autoApproveNewMembers: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">신규 가맹점 자동 승인</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.requireBusinessLicense}
                  onChange={(e) => setSettings({...settings, requireBusinessLicense: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">사업자등록증 필수</span>
              </label>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">백업 설정</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">백업 주기</label>
                  <select
                    value={settings.backupSchedule}
                    onChange={(e) => setSettings({...settings, backupSchedule: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="hourly">매시간</option>
                    <option value="daily">매일</option>
                    <option value="weekly">매주</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">백업 시간</label>
                  <input
                    type="time"
                    value={settings.backupTime}
                    onChange={(e) => setSettings({...settings, backupTime: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">백업 보관 기간 (일)</label>
                  <input
                    type="number"
                    value={settings.backupRetention}
                    onChange={(e) => setSettings({...settings, backupRetention: Number(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">로그 설정</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">로그 보관 기간 (일)</label>
                  <input
                    type="number"
                    value={settings.logRetention}
                    onChange={(e) => setSettings({...settings, logRetention: Number(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">세션 타임아웃 (분)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: Number(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API & Webhooks Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">API 키 관리</h3>
                <button
                  onClick={() => generateApiKey()}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  새 API 키 생성
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="text-left">이름</th>
                      <th className="text-left">키</th>
                      <th className="text-left">생성일</th>
                      <th className="text-left">마지막 사용</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {settings.apiKeys.map(key => (
                      <tr key={key.id} className="border-t">
                        <td className="py-2">{key.name}</td>
                        <td className="py-2 font-mono text-xs">{key.key}</td>
                        <td className="py-2">{key.created}</td>
                        <td className="py-2">{key.lastUsed}</td>
                        <td className="py-2">
                          <button className="text-red-600 hover:text-red-800 text-sm">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">웹훅 설정</h3>
                <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                  웹훅 추가
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="text-left">URL</th>
                      <th className="text-left">이벤트</th>
                      <th className="text-left">상태</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {settings.webhooks.map(webhook => (
                      <tr key={webhook.id} className="border-t">
                        <td className="py-2 font-mono text-xs">{webhook.url}</td>
                        <td className="py-2">{webhook.events.join(', ')}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${webhook.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {webhook.active ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="py-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm mr-2">수정</button>
                          <button className="text-red-600 hover:text-red-800 text-sm">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 pt-6 border-t">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            설정 저장
          </button>
        </div>
      </div>
    </div>
  )
}