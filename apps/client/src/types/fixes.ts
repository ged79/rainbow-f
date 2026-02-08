/**
 * Common TypeScript Error Fixes
 * 
 * This file documents common TypeScript errors and their fixes
 * Run: npm run type-check to see current errors
 */

// ===== Common Error Patterns =====

// 1. Missing type imports
// Error: Cannot find name 'Order'
// Fix: import type { Order } from '@flower/shared/types'

// 2. Wrong import paths
// Error: Module '@flower/shared' has no exported member 'formatCurrency'
// Fix: import { formatCurrency } from '@flower/shared/utils'

// 3. Type mismatches
// Error: Type 'Order' is not assignable to type 'OrderWithStores'
// Fix: Use correct type: OrderWithStores

// 4. Optional chaining needed
// Error: Object is possibly 'null' or 'undefined'
// Fix: Use optional chaining: currentStore?.id

// 5. Async function issues
// Error: Promise returned in function argument where a void return was expected
// Fix: Wrap in void operator or handle properly

// ===== Quick Fix Commands =====
// npm run fix:imports     - Fix all import paths
// npm run type-check      - Check for TypeScript errors
// npm run build           - Build the project (will fail if TS errors)

export {}
