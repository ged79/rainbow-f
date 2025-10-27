# 🔐 ZERO-RISK SECURITY MIGRATION PLAN

## 📊 SYSTEM ARCHITECTURE ANALYSIS

### Current State
```
Homepage ─┐
Funeral  ─┼─→ ANON_KEY ─→ Supabase ─→ RLS DISABLED ─→ Full Access
Admin    ─┘
```

**Why it works now:**
- RLS policies: `USING (true)` = Allow everything
- All 3 apps share same ANON_KEY
- No actual security, but fully functional

**What breaks if we "fix" naively:**
- Switch to SERVICE_ROLE_KEY → Nothing breaks, but doesn't add security
- Enable RLS → Everything breaks (no auth.jwt() in code)
- Add auth checks → API calls fail from client-side

---

## 🎯 PHASED MIGRATION - ZERO DOWNTIME

### Phase 1: Add Security Without Breaking (Day 1-2)
**Objective:** Add protection layer while keeping everything working

**Step 1.1: Create Secure API Layer**
```typescript
// apps/homepage/src/lib/supabase/secure.ts
import { createClient } from '@supabase/supabase-js'

// Only for API routes (server-side)
export const supabaseSecure = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // NEW: Add this to .env
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
)

// For client-side (keep existing)
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Step 1.2: Migrate API Routes One-by-One**
```typescript
// BEFORE: apps/homepage/src/app/api/orders/route.ts
const supabase = createClient(ANON_KEY)  // Old

// AFTER: 
import { supabaseSecure } from '@/lib/supabase/secure'
const { data } = await supabaseSecure.from('customer_orders')  // New
```

**Files to migrate (8 total):**
- `/api/orders/route.ts` ✓
- `/api/coupons/available/route.ts` ✓
- `/api/auth/login/route.ts` (already uses createPublicClient, keep as-is)
- `/api/reviews/route.ts` ✓
- `/api/referrals/route.ts` ✓
- `/api/wishlist/route.ts` ✓
- `/api/withdraw/route.ts` ✓
- `/api/delivery-examples/route.ts` ✓

**Impact:** ZERO breaking changes
- Client-side still uses ANON_KEY
- API routes use SERVICE_ROLE_KEY
- RLS still disabled, so both work
- Database access patterns unchanged

---

### Phase 2: Add Input Validation (Day 3)
**Objective:** Prevent injection attacks without changing logic

```typescript
// apps/homepage/src/lib/api/validator.ts
import { z } from 'zod'

export const orderSchema = z.object({
  customerName: z.string().min(2).max(50).regex(/^[가-힣a-zA-Z\s]+$/),
  customerPhone: z.string().regex(/^01[0-9]-\d{4}-\d{4}$/),
  totalAmount: z.number().positive().max(10000000),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive().int().max(100)
  }))
})

// Middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<T | NextResponse> => {
    const body = await request.json()
    const result = schema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: result.error.errors 
      }, { status: 400 })
    }
    
    return result.data
  }
}
```

**Update API routes:**
```typescript
// api/orders/route.ts
export async function POST(request: NextRequest) {
  const bodyOrError = await validateRequest(orderSchema)(request)
  if (bodyOrError instanceof NextResponse) return bodyOrError
  
  const body = bodyOrError  // Now fully typed and validated
  // ... rest of logic unchanged
}
```

**Impact:** ZERO breaking changes
- Adds safety net for malformed data
- Existing valid requests pass through
- Invalid requests rejected early

---

### Phase 3: Fix Race Condition (Day 4-5)
**Objective:** Atomic point deduction

**Step 3.1: Create Database Function**
```sql
-- database/migrations/001_atomic_points.sql
CREATE OR REPLACE FUNCTION deduct_points_atomic(
  p_phone TEXT,
  p_discount INTEGER,
  p_order_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_coupon RECORD;
  v_remaining INTEGER := p_discount;
BEGIN
  -- Lock coupons atomically
  FOR v_coupon IN
    SELECT * FROM coupons
    WHERE customer_phone IN (p_phone, regexp_replace(p_phone, '-', '', 'g'))
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY expires_at ASC
    FOR UPDATE SKIP LOCKED  -- Key: Skip if locked by other transaction
  LOOP
    EXIT WHEN v_remaining <= 0;
    
    UPDATE coupons SET used_at = NOW() WHERE id = v_coupon.id;
    v_remaining := v_remaining - v_coupon.amount;
  END LOOP;
  
  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;
  
  -- Create order
  INSERT INTO customer_orders (
    order_number, customer_name, customer_phone, 
    total_amount, discount_amount, status, created_at
  ) VALUES (
    p_order_data->>'order_number',
    p_order_data->>'customer_name',
    p_phone,
    (p_order_data->>'total_amount')::INTEGER,
    p_discount,
    'pending',
    NOW()
  ) RETURNING id INTO v_order_id;
  
  UPDATE coupons SET order_id = v_order_id 
  WHERE used_at = NOW() AND order_id IS NULL;
  
  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$ LANGUAGE plpgsql;
```

**Step 3.2: Update API to Use Function**
```typescript
// api/orders/route.ts
if (discountAmount > 0) {
  // NEW: Atomic function call
  const { data, error } = await supabaseSecure.rpc('deduct_points_atomic', {
    p_phone: formattedCustomerPhone,
    p_discount: discountAmount,
    p_order_data: { order_number, customer_name, total_amount }
  })
  
  if (error || !data.success) {
    return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
  }
  
  orderId = data.order_id
} else {
  // OLD: Keep existing logic for non-discount orders
  const { data: order } = await supabaseSecure.from('customer_orders').insert({...})
}
```

**Impact:** ZERO breaking changes
- Non-discount orders: Use old flow (unchanged)
- Discount orders: Use atomic function (prevents race condition)
- If function fails, graceful fallback with error message

---

### Phase 4: Enable RLS Gradually (Day 6-7)
**Objective:** Add security without breaking functionality

**Step 4.1: Service Role Policies (Applied First)**
```sql
-- These policies allow SERVICE_ROLE_KEY to bypass RLS
-- Applied BEFORE enabling RLS

-- customer_orders
CREATE POLICY "service_role_all" ON customer_orders
  FOR ALL USING (auth.role() = 'service_role');

-- coupons  
CREATE POLICY "service_role_all" ON coupons
  FOR ALL USING (auth.role() = 'service_role');

-- members
CREATE POLICY "service_role_all" ON members
  FOR ALL USING (auth.role() = 'service_role');

-- products (read-only for ANON)
CREATE POLICY "anon_read_products" ON products
  FOR SELECT USING (is_active = true);
```

**Step 4.2: Enable RLS**
```sql
-- Now safe to enable because SERVICE_ROLE_KEY still works
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

**Impact:** ZERO breaking changes
- API routes use SERVICE_ROLE_KEY → bypass RLS → still work
- Client-side product queries → allowed by anon_read_products
- ANON_KEY can't modify sensitive tables (but API still can)

---

### Phase 5: Rotate ANON_KEY (Day 8)
**Objective:** Invalidate any leaked keys

**Step 5.1: Generate New Key in Supabase**
1. Go to Supabase Dashboard → Settings → API
2. Click "Generate new anon key"
3. Copy new key

**Step 5.2: Update Environment Variables**
```bash
# .env.production
NEXT_PUBLIC_SUPABASE_ANON_KEY=new_key_here
```

**Step 5.3: Deploy**
- Old leaked keys stop working
- API routes unaffected (use SERVICE_ROLE_KEY)
- Client gets new ANON_KEY from build

**Impact:** Breaks old deployed clients
- Solution: Version your API or grace period with both keys

---

## 📋 MIGRATION CHECKLIST

### Day 1: Setup
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to `.env`
- [ ] Create `lib/supabase/secure.ts`
- [ ] Test connection with SERVICE_ROLE_KEY

### Day 2: Migrate API Routes
- [ ] Update `/api/orders/route.ts`
- [ ] Update `/api/coupons/available/route.ts`
- [ ] Update `/api/reviews/route.ts`
- [ ] Update `/api/referrals/route.ts`
- [ ] Update `/api/wishlist/route.ts`
- [ ] Test each route after migration

### Day 3: Validation
- [ ] Install zod: `npm install zod`
- [ ] Create validation schemas
- [ ] Add to API routes
- [ ] Test with invalid data

### Day 4-5: Atomic Points
- [ ] Create database function
- [ ] Test function in isolation
- [ ] Update API route
- [ ] Test race condition (2 simultaneous orders)

### Day 6-7: Enable RLS
- [ ] Create service_role policies
- [ ] Test API routes still work
- [ ] Enable RLS on each table
- [ ] Test again

### Day 8: Rotate Key
- [ ] Generate new ANON_KEY
- [ ] Update env vars
- [ ] Deploy
- [ ] Monitor for errors

---

## 🧪 TESTING STRATEGY

### After Each Phase
```bash
# Test homepage
curl http://localhost:3000/api/orders -X POST -H "Content-Type: application/json" -d '{...}'

# Test admin
# (Similar for admin endpoints)

# Test concurrent orders (Phase 4)
# Run 2 simultaneous curl commands with same phone + points
```

### Rollback Plan
Each phase is independent:
- Phase 1 breaks → Revert `secure.ts` imports
- Phase 3 breaks → Comment out RPC call, use old flow
- Phase 4 breaks → `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`
- Phase 5 breaks → Revert to old ANON_KEY

---

## ⚠️ CRITICAL: What NOT to Do

❌ Don't switch all at once  
❌ Don't enable RLS before SERVICE_ROLE policies  
❌ Don't rotate ANON_KEY before migration  
❌ Don't delete old code until tested  
❌ Don't skip validation phase

---

## ✅ SUCCESS CRITERIA

After all phases:
- [ ] 100 concurrent users tested without crashes
- [ ] No race condition in point deduction
- [ ] Invalid requests rejected with 400 errors
- [ ] Old ANON_KEY doesn't work
- [ ] All 3 apps (homepage, funeral, admin) still functional
- [ ] Database queries still fast (no performance regression)

---

## 📞 IF SOMETHING BREAKS

1. **Check logs** for specific error
2. **Identify phase** where it broke
3. **Rollback that phase** only
4. **Test rollback** works
5. **Debug issue** before re-attempting

Each phase is designed to be independently reversible.
