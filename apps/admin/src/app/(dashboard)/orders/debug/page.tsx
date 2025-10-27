'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { formatCurrency, formatDate, formatPhone } from '@/shared/utils'

export default function OrdersDebugPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    checkAuth()
    loadOrders()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await (supabase.auth as any).getUser()
      console.log('Auth check:', { user, error })
      setUser(user)
      if (error) {
        setError(`Auth error: ${error.message}`)
      }
    } catch (err: any) {
      console.error('Auth check failed:', err)
      setError(`Auth check failed: ${err.message}`)
    }
  }

  const loadOrders = async () => {
    try {
      console.log('Starting to load orders...')
      setIsLoading(true)
      
      // Simple query first
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .limit(10)

      console.log('Query result:', { data, error })

      if (error) {
        console.error('Database error:', error)
        setError(`Database error: ${error.message}`)
        return
      }

      if (data) {
        console.log(`Found ${data.length} orders`)
        setOrders(data)
      } else {
        console.log('No data returned')
        setOrders([])
      }
    } catch (err: any) {
      console.error('Load orders failed:', err)
      setError(`Load failed: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testQueries = async () => {
    console.log('Testing different queries...')
    
    // Test 1: Simple count
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    
    console.log('Order count:', count, 'Error:', countError)

    // Test 2: Check stores
    const { data: stores, error: storeError } = await supabase
      .from('stores')
      .select('id, business_name')
      .limit(5)
    
    console.log('Stores:', stores, 'Error:', storeError)

    // Test 3: Orders with joins
    const { data: ordersWithJoins, error: joinError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        created_at,
        sender_store:stores!sender_store_id(business_name),
        receiver_store:stores!receiver_store_id(business_name)
      `)
      .limit(5)
    
    console.log('Orders with joins:', ordersWithJoins, 'Error:', joinError)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Orders Debug Page</h1>
      
      <div className="space-y-4">
        {/* Auth Status */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-2">Authentication Status</h2>
          {user ? (
            <div>
              <p className="text-green-600">✅ Logged in</p>
              <p className="text-sm text-gray-600">User ID: {user.id}</p>
              <p className="text-sm text-gray-600">Email: {user.email}</p>
            </div>
          ) : (
            <p className="text-red-600">❌ Not logged in</p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <h2 className="font-bold text-red-700 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-blue-600">Loading orders...</p>
          </div>
        )}

        {/* Orders Display */}
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Orders ({orders.length})</h2>
            <div className="space-x-2">
              <button 
                onClick={loadOrders}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Reload Orders
              </button>
              <button 
                onClick={testQueries}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Test Queries
              </button>
            </div>
          </div>

          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order #</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Created</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{order.order_number || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">{order.status}</td>
                      <td className="px-4 py-2 text-sm">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-2 text-sm">{order.customer?.name || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">{order.product?.type || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">{formatCurrency(order.payment?.total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No orders found</p>
          )}
        </div>

        {/* Raw Data Display */}
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-bold mb-2">Raw Data (First Order)</h2>
          {orders.length > 0 && (
            <pre className="text-xs overflow-auto">
              {JSON.stringify(orders[0], null, 2)}
            </pre>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-bold text-yellow-800 mb-2">Debug Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Open browser console (F12)</li>
          <li>Click "Reload Orders" button</li>
          <li>Check console for any errors</li>
          <li>Click "Test Queries" to test different query types</li>
          <li>Check if authentication is working</li>
          <li>Check if any orders are returned</li>
        </ol>
      </div>
    </div>
  )
}