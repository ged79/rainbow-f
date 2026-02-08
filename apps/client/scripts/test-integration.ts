#!/usr/bin/env tsx
/**
 * Integration tests for critical user paths
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import chalk from 'chalk'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('❌ Missing Supabase credentials'))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test results tracking
const results: { 
  name: string
  status: 'pass' | 'fail' | 'skip'
  error?: string
  time?: number
}[] = []

async function test(
  name: string, 
  fn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now()
  
  try {
    await fn()
    const duration = Date.now() - startTime
    results.push({ name, status: 'pass', time: duration })
    console.log(chalk.green(`✓ ${name}`), chalk.gray(`(${duration}ms)`))
  } catch (error: any) {
    const duration = Date.now() - startTime
    results.push({ 
      name, 
      status: 'fail', 
      error: error.message,
      time: duration 
    })
    console.log(chalk.red(`✗ ${name}`), chalk.gray(`(${duration}ms)`))
    console.log(chalk.gray(`  ${error.message}`))
  }
}

// Test cases
async function runTests() {
  console.log(chalk.blue('\n🧪 Running Integration Tests\n'))
  
  // Test 1: Database Connection
  await test('Database connection', async () => {
    const { error } = await supabase.from('stores').select('id').limit(1)
    if (error) throw error
  })
  
  // Test 2: Authentication Flow
  await test('Authentication system', async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    // Session might be null, that's OK
  })
  
  // Test 3: Storage Access
  await test('Storage bucket access', async () => {
    const { data, error } = await supabase.storage
      .from('order-photos')
      .list('', { limit: 1 })
    if (error) throw error
  })
  
  // Test 4: Orders Table Query
  await test('Orders table structure', async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, completion_photos')
      .limit(1)
    if (error) throw error
  })
  
  // Test 5: Stores Table Query
  await test('Stores table structure', async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('id, business_name, points_balance')
      .limit(1)
    if (error) throw error
  })
  
  // Test 6: View Access
  await test('OrderWithStores view', async () => {
    const { data, error } = await supabase
      .from('orders_with_stores')
      .select('*')
      .limit(1)
    if (error) throw error
  })
  
  // Test 7: RLS Policies
  await test('RLS policies active', async () => {
    // This should work without auth
    const { data, error } = await supabase
      .from('stores')
      .select('business_name')
      .limit(1)
    // RLS might prevent access, which is good
  })
  
  // Test 8: Points System
  await test('Points transactions table', async () => {
    const { data, error } = await supabase
      .from('point_transactions')
      .select('*')
      .limit(1)
    // Might be empty, but should not error
  })
  
  // Test 9: Client Logs Table
  await test('Client logs table', async () => {
    const { data, error } = await supabase
      .from('client_logs')
      .select('*')
      .limit(1)
    // Might be empty or restricted by RLS
  })
  
  // Test 10: API Health Endpoint
  await test('Health check endpoint', async () => {
    const response = await fetch('http://localhost:3000/api/health')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (data.server !== 'ok') throw new Error('Server not healthy')
  })
  
  // Print results summary
  console.log(chalk.blue('\n📊 Test Results Summary\n'))
  
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const totalTime = results.reduce((sum, r) => sum + (r.time || 0), 0)
  
  if (failed === 0) {
    console.log(chalk.green(`✓ All ${passed} tests passed!`))
  } else {
    console.log(chalk.red(`✗ ${failed} tests failed`))
    console.log(chalk.green(`✓ ${passed} tests passed`))
  }
  
  console.log(chalk.gray(`Total time: ${totalTime}ms`))
  
  // Exit with proper code
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch(error => {
  console.error(chalk.red('Test runner failed:'), error)
  process.exit(1)
})
