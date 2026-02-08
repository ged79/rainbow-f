# 🔐 SECURITY FIXES - IMPLEMENTATION GUIDE

## Fix #1: Switch to SERVICE_ROLE_KEY

### Create Admin Client
**File:** `apps/homepage/src/lib/supabase/admin.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

### Update All API Routes
**Example:** `apps/homepage/src/app/api/orders/route.ts`
```typescript
// BEFORE
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// AFTER
import { supabaseAdmin } from '@/lib/supabase/admin'
// Use supabaseAdmin instead of supabase
const { data, error } = await supabaseAdmin.from('customer_orders')...
```

**Files to update:**
- `/api/orders/route.ts`
- `/api/coupons/available/route.ts`
- `/api/auth/login/route.ts`
- All other API routes

---

## Fix #2: Atomic Point Deduction

### Database Function
**File:** `database/migrations/004_atomic_points.sql`
```sql
CREATE OR REPLACE FUNCTION deduct_points_and_create_order(
  p_customer_phone TEXT,
  p_customer_name TEXT,
  p_order_data JSONB,
  p_discount_amount INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_coupon RECORD;
  v_remaining INTEGER := p_discount_amount;
  v_used_coupons TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Lock and deduct coupons atomically
  FOR v_coupon IN
    SELECT id, code, amount FROM coupons
    WHERE customer_phone = p_customer_phone
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY expires_at ASC
    FOR UPDATE SKIP LOCKED  -- Critical: Skip if locked by another transaction
  LOOP
    EXIT WHEN v_remaining <= 0;
    
    -- Mark coupon as used
    UPDATE coupons
    SET used_at = NOW()
    WHERE id = v_coupon.id;
    
    v_remaining := v_remaining - v_coupon.amount;
    v_used_coupons := array_append(v_used_coupons, v_coupon.code);
  END LOOP;
  
  -- Check if enough points
  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Insufficient points. Need % more points', v_remaining;
  END IF;
  
  -- Create order
  INSERT INTO customer_orders (
    order_number, customer_name, customer_phone,
    total_amount, discount_amount, status,
    -- ... other fields from p_order_data
    created_at
  ) VALUES (
    p_order_data->>'order_number',
    p_customer_name,
    p_customer_phone,
    (p_order_data->>'total_amount')::INTEGER,
    p_discount_amount,
    'pending',
    NOW()
  ) RETURNING id INTO v_order_id;
  
  -- Link coupons to order
  UPDATE coupons
  SET order_id = v_order_id
  WHERE code = ANY(v_used_coupons);
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'coupons_used', v_used_coupons
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;
```

### Update API Route
```typescript
// apps/homepage/src/app/api/orders/route.ts
if (discountAmount > 0) {
  const { data, error } = await supabaseAdmin.rpc('deduct_points_and_create_order', {
    p_customer_phone: formattedCustomerPhone,
    p_customer_name: customerName,
    p_order_data: {
      order_number: orderNumber,
      total_amount: totalAmount,
      // ... other order fields
    },
    p_discount_amount: discountAmount
  })
  
  if (error || !data.success) {
    return NextResponse.json({ error: data.error || 'Point deduction failed' }, { status: 400 })
  }
  
  orderId = data.order_id
} else {
  // Create order without point deduction (existing logic)
}
```

---

## Fix #3: Lock Down RLS Policies

**File:** `database/migrations/005_fix_rls.sql`
```sql
-- Drop insecure policies
DROP POLICY IF EXISTS "members_anon_select" ON members;
DROP POLICY IF EXISTS "members_anon_insert" ON members;
DROP POLICY IF EXISTS "coupons_anon_select" ON coupons;
DROP POLICY IF EXISTS "coupons_anon_update" ON coupons;

-- Secure members table
CREATE POLICY "members_self_select" ON members
  FOR SELECT USING (
    auth.uid()::text = id::text OR
    auth.role() = 'service_role'
  );

CREATE POLICY "members_self_update" ON members
  FOR UPDATE USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Secure coupons table
CREATE POLICY "coupons_service_role" ON coupons
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "coupons_self_view" ON coupons
  FOR SELECT USING (
    customer_phone IN (
      SELECT phone FROM members WHERE id::text = auth.uid()::text
    )
  );

-- customer_orders - admin only
DROP POLICY IF EXISTS "Admin can view all customer orders" ON customer_orders;
CREATE POLICY "customer_orders_service_role" ON customer_orders
  FOR ALL USING (auth.role() = 'service_role');
```

---

## Fix #4: Add Authentication to Orders

**File:** `apps/homepage/src/app/api/orders/route.ts`
```typescript
import { jwtService, extractTokenFromRequest } from '@/lib/security/jwt-auth'
import { createRateLimiter, RATE_LIMITS } from '@/lib/security/rate-limit'

const orderRateLimiter = createRateLimiter(RATE_LIMITS.orders)

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await orderRateLimiter(request)
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse
  }
  
  // Authentication (optional for guest checkout, but validate phone ownership)
  const token = extractTokenFromRequest(request)
  let authenticatedUser = null
  
  if (token) {
    authenticatedUser = jwtService.verifyToken(token)
    if (!authenticatedUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  }
  
  const body = await request.json()
  
  // If authenticated, verify phone matches
  if (authenticatedUser && authenticatedUser.phone !== body.customerPhone) {
    return NextResponse.json({ 
      error: 'Phone mismatch. Please use your registered phone number.' 
    }, { status: 403 })
  }
  
  // CAPTCHA verification (required for guest orders)
  if (!authenticatedUser) {
    const captchaValid = await verifyCaptcha(body.captchaToken)
    if (!captchaValid) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 })
    }
  }
  
  // Proceed with order creation...
}
```

### Add CAPTCHA Helper
**File:** `apps/homepage/src/lib/security/captcha.ts`
```typescript
export async function verifyCaptcha(token: string): Promise<boolean> {
  if (!token) return false
  
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
  })
  
  const data = await response.json()
  return data.success && data.score > 0.5
}
```

---

## Fix #5: Mask PII in Responses

**File:** `apps/homepage/src/lib/utils/mask.ts`
```typescript
export function maskAddress(address: string | object): string {
  if (typeof address === 'object') {
    // Show only city/district
    const { sido, sigungu } = address as any
    return `${sido || ''} ${sigungu || ''}`.trim() || '주소 비공개'
  }
  
  // For string addresses, show first 20 chars
  return typeof address === 'string' && address.length > 20
    ? address.slice(0, 20) + '...'
    : '주소 비공개'
}

export function maskOrderForResponse(order: any) {
  return {
    ...order,
    customer_phone: encryptionService.maskPhone(order.customer_phone),
    recipient_phone: order.recipient_phone 
      ? encryptionService.maskPhone(order.recipient_phone) 
      : null,
    recipient_address: maskAddress(order.recipient_address)
  }
}
```

**Update GET /api/orders:**
```typescript
const ordersWithReviews = await Promise.all(...)

// Mask PII before returning
const maskedOrders = ordersWithReviews.map(maskOrderForResponse)

return NextResponse.json({ 
  success: true,
  orders: maskedOrders,  // Not ordersWithReviews
  points: {...}
})
```

---

## Testing Checklist

After implementing each fix:

- [ ] Test in dev environment with sample data
- [ ] Verify existing functionality still works
- [ ] Check error handling (insufficient points, invalid auth, etc.)
- [ ] Monitor logs for errors
- [ ] Load test (if possible)
- [ ] Verify no PII in logs
- [ ] Test race condition fix (two simultaneous orders with same phone)

---

## Rollback Plan

If issues arise:

1. **Immediate rollback:**
   ```bash
   git revert <commit-hash>
   npm run build && npm run deploy
   ```

2. **Database rollback:**
   ```sql
   -- Restore from backup
   psql $DATABASE_URL < backup_YYYYMMDD.sql
   ```

3. **Partial rollback:**
   - Keep SERVICE_ROLE_KEY changes
   - Revert atomic function if causing issues
   - Use feature flags to disable specific fixes
