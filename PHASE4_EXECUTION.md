# 🔐 PHASE 4: ENABLE RLS - EXECUTION GUIDE

## Pre-Flight Check

✅ SERVICE_ROLE_KEY in .env
✅ API routes migrated to supabaseAdmin
✅ All functionality tested and working

## Step-by-Step Execution

### Step 1: Apply Migration (Supabase Dashboard)

1. Go to: https://app.supabase.com/project/YOUR_PROJECT/editor
2. Open SQL Editor
3. Copy entire content from: `database/migrations/001_enable_rls_secure.sql`
4. Click "Run"
5. Verify all queries succeed (green checkmarks)

### Step 2: Immediate Testing

**Test API routes still work:**

```bash
# Test order creation
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "테스트",
    "customerPhone": "010-1234-5678",
    "totalAmount": 80000,
    "discountAmount": 0,
    "items": [{"productId": "test", "productName": "테스트", "price": 80000, "quantity": 1}]
  }'

# Expected: {"success":true,"orderNumber":"ORD-..."}
```

**Test order lookup:**
```bash
curl "http://localhost:3000/api/orders?name=테스트&phone=010-1234-5678"

# Expected: {"success":true,"orders":[...],"points":{...}}
```

**Test coupon query:**
```bash
curl "http://localhost:3000/api/coupons/available?phone=010-1234-5678"

# Expected: {"coupons":[],"totalPoints":0,...}
```

### Step 3: Verify RLS Status

In Supabase SQL Editor:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('customer_orders', 'coupons', 'products');
```

**Expected output:**
```
customer_orders | true
coupons         | true
products        | true
```

### Step 4: Test Client-Side Protection

Try to query database directly with ANON_KEY (should fail):
```javascript
// In browser console
const { createClient } = supabase
const client = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
)

// This should FAIL (RLS blocks it)
const { data, error } = await client.from('customer_orders').select('*')
console.log(error) // Should show RLS policy violation
```

## What Should Work

✅ All API routes (use SERVICE_ROLE_KEY)
✅ Product queries from client (allowed by policy)
✅ Admin app (if using SERVICE_ROLE_KEY)

## What Should NOT Work

❌ Direct database queries with ANON_KEY
❌ Client-side modifications to sensitive tables
❌ Unauthorized access attempts

## If Something Breaks

**Immediate rollback:**
```sql
-- Run this in Supabase SQL Editor
-- Copy from: database/migrations/001_rollback_rls.sql
ALTER TABLE customer_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
-- ... (run entire rollback script)
```

**Recovery time:** < 30 seconds

## Success Criteria

- [ ] All API routes respond correctly
- [ ] RLS enabled on all tables (verify query)
- [ ] Client-side blocked from sensitive tables
- [ ] Products still load on homepage
- [ ] No errors in application logs

## Common Issues

**Issue:** API routes return 403 errors
**Cause:** Policies created after RLS enabled
**Fix:** Run rollback, then migration in correct order

**Issue:** Products don't load
**Cause:** Missing anon_read_active_products policy
**Fix:** Add policy for products table

**Issue:** Admin app breaks
**Cause:** Admin not using SERVICE_ROLE_KEY
**Fix:** Migrate admin app to use supabaseAdmin
