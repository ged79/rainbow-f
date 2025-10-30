# ORDER PAGE STABILIZATION ACTION PLAN

## IMMEDIATE FIXES (Today)

### 1. Clean Duplicate Files
```bash
cd apps/homepage/src/app/api/orders
mkdir _archive
mv route.backup.ts route.BACKUP_ORIGINAL.ts route.MIGRATED.ts route.ts.backup _archive/
# Keep only route.ts and route.secure.ts
```

### 2. Fix Race Condition in Points
```sql
-- Create atomic point deduction function
CREATE OR REPLACE FUNCTION deduct_points_atomic(
  p_customer_phone TEXT,
  p_amount INTEGER,
  p_order_id UUID
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_coupon_ids UUID[];
BEGIN
  -- Lock coupons for update
  WITH locked_coupons AS (
    SELECT id, amount
    FROM coupons
    WHERE customer_phone = p_customer_phone
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY expires_at ASC
    FOR UPDATE
  ),
  used_coupons AS (
    SELECT id, amount,
      SUM(amount) OVER (ORDER BY expires_at) as running_total
    FROM locked_coupons
  ),
  coupons_to_use AS (
    SELECT id
    FROM used_coupons
    WHERE running_total - amount < p_amount
  )
  UPDATE coupons
  SET used_at = NOW(),
      used_order_id = p_order_id
  WHERE id IN (SELECT id FROM coupons_to_use)
  RETURNING ARRAY_AGG(id) INTO v_coupon_ids;

  v_result := json_build_object(
    'success', TRUE,
    'coupon_ids', v_coupon_ids,
    'amount_deducted', p_amount
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

### 3. Consolidate Order Data Structure
```typescript
// types/order.ts
export interface UnifiedOrder {
  customer: {
    name: string
    phone: string  // SINGLE SOURCE
    company?: string
  }
  recipient: {
    name: string
    phone: string
    address: Address
  }
  product: {
    id: string
    name: string
    price: number  // SERVER VALIDATES
    quantity: number
  }
  delivery: {
    date: string
    time: string
    instructions?: string
  }
  payment: {
    method: 'card' | 'transfer'
    discount: number
    total: number
  }
}
```

## REFACTORING PLAN (This Week)

### Day 1: State Management
```typescript
// hooks/useOrderState.ts
export function useOrderState() {
  const [order, dispatch] = useReducer(orderReducer, initialState)
  
  const actions = {
    setCustomer: (data) => dispatch({ type: 'SET_CUSTOMER', data }),
    setRecipient: (data) => dispatch({ type: 'SET_RECIPIENT', data }),
    setProduct: (data) => dispatch({ type: 'SET_PRODUCT', data }),
    validateAndProceed: async () => {
      const validation = await validateOrder(order)
      if (validation.success) {
        dispatch({ type: 'PROCEED' })
      }
      return validation
    }
  }
  
  return { order, ...actions }
}
```

### Day 2: Server Validation
```typescript
// api/orders/validate/route.ts
export async function POST(request: NextRequest) {
  const order = await request.json()
  
  // Price verification
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('price')
    .eq('id', order.product.id)
    .single()
    
  if (product.price !== order.product.price) {
    return NextResponse.json({
      valid: false,
      error: 'Price mismatch detected'
    }, { status: 400 })
  }
  
  // Points verification
  const { data: points } = await supabaseAdmin
    .from('coupons')
    .select('amount')
    .eq('customer_phone', order.customer.phone)
    .is('used_at', null)
    
  const available = points?.reduce((sum, p) => sum + p.amount, 0) || 0
  
  if (order.payment.discount > available) {
    return NextResponse.json({
      valid: false,
      error: 'Insufficient points'
    }, { status: 400 })
  }
  
  return NextResponse.json({ valid: true })
}
```

### Day 3: Component Split
```
OrderPage/
├── OrderPage.tsx (300 lines - main container)
├── components/
│   ├── CustomerForm.tsx (150 lines)
│   ├── RecipientForm.tsx (150 lines)
│   ├── DeliveryOptions.tsx (100 lines)
│   ├── PaymentSummary.tsx (100 lines)
│   └── ProductDisplay.tsx (150 lines)
└── hooks/
    ├── useOrderState.ts
    ├── usePayment.ts
    └── useValidation.ts
```

### Day 4: Payment Flow
```typescript
// Single payment handler
async function processOrder() {
  try {
    // 1. Validate
    const validation = await fetch('/api/orders/validate', {
      method: 'POST',
      body: JSON.stringify(order)
    })
    
    if (!validation.ok) throw new Error('Validation failed')
    
    // 2. Lock points
    const pointLock = await fetch('/api/points/lock', {
      method: 'POST',
      body: JSON.stringify({
        customerId: order.customer.id,
        amount: order.payment.discount
      })
    })
    
    // 3. Process payment
    const payment = await tossPayments.requestPayment(...)
    
    // 4. Confirm order
    const confirmation = await fetch('/api/orders/confirm', {
      method: 'POST',
      body: JSON.stringify({
        order,
        paymentId: payment.paymentKey,
        pointLockId: pointLock.lockId
      })
    })
    
    return confirmation
    
  } catch (error) {
    // Rollback points if locked
    if (pointLock?.lockId) {
      await fetch('/api/points/release', {
        method: 'POST',
        body: JSON.stringify({ lockId: pointLock.lockId })
      })
    }
    throw error
  }
}
```

## MONITORING SETUP

```typescript
// lib/monitoring.ts
export const trackOrderEvent = (event: string, data: any) => {
  // Send to analytics
  console.log('[ORDER_EVENT]', event, data)
  
  // Track key metrics:
  // - Time to complete order
  // - Drop-off point
  // - Error type and frequency
  // - Payment success rate
}

// Usage in OrderPage
useEffect(() => {
  trackOrderEvent('order_page_loaded', { productId: product.id })
  
  return () => {
    if (!orderCompleted) {
      trackOrderEvent('order_abandoned', {
        stage: currentPage,
        filled: Object.keys(order).filter(k => order[k])
      })
    }
  }
}, [])
```

## TESTING CHECKLIST

- [ ] Concurrent orders for same product
- [ ] Point deduction race condition
- [ ] Price manipulation attempt
- [ ] Payment failure + point rollback
- [ ] Browser refresh during order
- [ ] Network failure handling
- [ ] Form validation errors
- [ ] Mobile vs desktop flow

## SUCCESS METRICS

- Order completion rate > 80%
- Payment success rate > 95%
- Average completion time < 3 minutes
- Zero price manipulation incidents
- Zero point duplication bugs
