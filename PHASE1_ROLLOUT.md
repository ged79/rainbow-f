# 🧪 PHASE 1 MIGRATION - TESTING & ROLLOUT

## Files Created

✅ `apps/homepage/src/lib/supabase/admin.ts` - Secure client wrapper
✅ `apps/homepage/src/app/api/orders/route.MIGRATED.ts` - Migrated version (not live yet)

## Before Applying Changes

### 1. Add SERVICE_ROLE_KEY to Environment

**Development (.env.local):**
```bash
# Get from Supabase Dashboard → Settings → API
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your_service_role_key_here
```

**Production (.env.production):**
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your_service_role_key_here
```

### 2. Test Admin Client Connection

Create test file: `apps/homepage/test-admin-client.ts`
```typescript
import { supabaseAdmin } from './src/lib/supabase/admin'

async function testConnection() {
  const { data, error } = await supabaseAdmin
    .from('customer_orders')
    .select('count')
    .limit(1)
  
  if (error) {
    console.error('❌ Connection failed:', error)
    process.exit(1)
  }
  
  console.log('✅ Admin client connected successfully')
}

testConnection()
```

Run: `npx tsx test-admin-client.ts`

## Apply Migration

### Option A: Cautious (Recommended First Time)

1. **Backup current route:**
```bash
cp apps/homepage/src/app/api/orders/route.ts apps/homepage/src/app/api/orders/route.BACKUP.ts
```

2. **Apply migrated version:**
```bash
cp apps/homepage/src/app/api/orders/route.MIGRATED.ts apps/homepage/src/app/api/orders/route.ts
```

3. **Test immediately:**
```bash
npm run dev
# Test order creation
# Test order lookup
```

### Option B: Direct Edit

Open `apps/homepage/src/app/api/orders/route.ts` and:

1. Change import:
```typescript
// FROM:
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// TO:
import { supabaseAdmin } from '@/lib/supabase/admin'
```

2. Replace all `supabase` with `supabaseAdmin` (23 occurrences)

## Testing Checklist

### Test 1: Order Creation
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "테스트",
    "customerPhone": "010-1234-5678",
    "recipientName": "받는사람",
    "recipientPhone": "010-9876-5432",
    "deliveryAddress": {"dong": "서울시 강남구", "detail": "테스트빌딩 101호"},
    "totalAmount": 80000,
    "discountAmount": 0,
    "items": [{
      "productId": "test-id",
      "productName": "테스트 화환",
      "price": 80000,
      "quantity": 1
    }]
  }'
```

**Expected:** `{"success":true,"orderNumber":"ORD-...","orderId":"...","pointsEarned":2400}`

### Test 2: Order Lookup
```bash
curl "http://localhost:3000/api/orders?name=테스트&phone=010-1234-5678"
```

**Expected:** Returns orders array with points information

### Test 3: Point Deduction Order
```bash
# First create points by ordering without discount
# Then order again with discount > 0

curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "테스트",
    "customerPhone": "010-1234-5678",
    "totalAmount": 50000,
    "discountAmount": 2400,
    ...
  }'
```

**Expected:** Order created, coupons marked as used

### Test 4: Error Handling
```bash
# Missing required field
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected:** Error response (not crash)

## Rollback Plan

If issues occur:

```bash
# Immediate rollback
cp apps/homepage/src/app/api/orders/route.BACKUP.ts apps/homepage/src/app/api/orders/route.ts
npm run dev
```

**Recovery time:** < 30 seconds

## Next API Routes to Migrate

After `/api/orders` works perfectly:

1. ✅ `/api/coupons/available/route.ts` (similar pattern)
2. ✅ `/api/reviews/route.ts`
3. ✅ `/api/referrals/route.ts`
4. ✅ `/api/wishlist/route.ts`

**Note:** `/api/auth/login` already uses `createPublicClient()` - leave as-is for now.

## Production Deployment

### Pre-deployment:
- [ ] All tests pass locally
- [ ] Backup production database
- [ ] Add SERVICE_ROLE_KEY to production env
- [ ] Test on staging if available

### Deployment:
```bash
# Deploy to Vercel/production
npm run build
# Verify build succeeds
# Deploy
```

### Post-deployment:
- [ ] Monitor error logs for 1 hour
- [ ] Test live order creation
- [ ] Verify no RLS errors in Supabase logs

## Success Criteria

✅ Orders created successfully
✅ Points deducted correctly
✅ No database errors
✅ Same functionality as before
✅ No performance degradation

## What Changed

**Before:**
- API routes used ANON_KEY (public, exposed to browser)
- Security relied only on RLS policies (currently disabled)

**After:**
- API routes use SERVICE_ROLE_KEY (secret, server-only)
- Ready for RLS when we enable it in Phase 4
- **Functionality identical** because RLS still disabled

**Next:** Once this works, we migrate other API routes, then enable RLS with proper policies.
