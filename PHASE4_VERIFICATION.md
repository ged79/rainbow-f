# ✅ PHASE 4 VERIFICATION CHECKLIST

## Issues Fixed

✅ Unique policy names per table
✅ Drops insecure existing policies first
✅ Removed non-existent tables (user_sessions)
✅ Added products service_role policy

## File to Apply

`database/migrations/001_enable_rls_FINAL.sql`

## Pre-Flight Verification

Run in Supabase SQL Editor:
```sql
-- Check existing policies (should see insecure ones)
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
```

## Apply Migration

Copy/paste entire `001_enable_rls_FINAL.sql` and run.

## Post-Migration Tests

### 1. Verify RLS Enabled
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('customer_orders', 'coupons', 'members');
-- Should all be 'true'
```

### 2. Test API Routes
```bash
# Order creation (should work)
curl -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d '{...}'

# Order lookup (should work)
curl "http://localhost:3000/api/orders?name=테스트&phone=010-1234-5678"
```

### 3. Test ANON_KEY Blocked
In browser console:
```javascript
// This should FAIL
const {createClient} = supabase
const client = createClient('URL', 'ANON_KEY')
await client.from('coupons').select('*')
// Expected: Policy violation error
```

## Success Criteria

- [ ] Migration runs without errors
- [ ] All tables show RLS enabled
- [ ] API routes still work
- [ ] ANON_KEY can only read products
- [ ] No 403 errors in app

## Rollback if Needed

```sql
ALTER TABLE customer_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
```
