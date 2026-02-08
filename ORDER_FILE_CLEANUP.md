# ORDER API FILE CLEANUP GUIDE

## CURRENT ANALYSIS

### Files to KEEP ✅
```
1. route.ts (11.51 KB) - PRODUCTION VERSION
   - Uses supabaseAdmin from @/lib/supabase/admin
   - Has SERVICE_ROLE_KEY implementation
   - Has checkRateLimit from @/lib/rateLimit
   - Most recent, largest file
   - Comments say "// GET: Order lookup - SECURE"
```

### Files to DELETE 🗑️
```
2. route.backup.ts - OLD VERSION (uses ANON_KEY)
3. route.BACKUP_ORIGINAL.ts - Duplicate of backup
4. route.ts.backup - Another duplicate
5. route.secure.ts - OLD attempt (still uses ANON_KEY!)
6. route.MIGRATED.ts - Incomplete migration
```

## CRITICAL FINDING ⚠️
**route.secure.ts is NOT secure!** It still uses:
```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // ❌ NOT SECURE
)
```

## ACTION COMMANDS

### Step 1: Backup current production
```bash
cd C:\work_station\flower\apps\homepage\src\app\api\orders
mkdir _archive
copy route.ts _archive\route.production.2025-10-29.ts
```

### Step 2: Archive old versions
```bash
move route.backup.ts _archive\
move route.BACKUP_ORIGINAL.ts _archive\
move route.ts.backup _archive\
move route.secure.ts _archive\
move route.MIGRATED.ts _archive\
```

### Step 3: Verify only production remains
```bash
dir *.ts
# Should only show: route.ts
```

## VERIFICATION CHECKLIST

After cleanup, verify route.ts has:
- [x] `import { supabaseAdmin }` not createClient
- [x] Uses SERVICE_ROLE_KEY (via supabaseAdmin)
- [x] Has rate limiting
- [x] No console.log debug statements in production

## OTHER FILES TO CHECK

### /app/order/page.tsx
- Keep: page.tsx (current)
- Archive: page_mobile_fixed.tsx, page_original.tsx

### /middleware
- Keep: middleware.ts
- Archive: middleware.backup.ts, middleware.secure.ts

### /components
- Keep: SecureOrderModal.tsx (actually uses Toss properly)
- Review: PaymentModal.tsx vs SecureOrderModal.tsx usage

## RECOMMENDED NEXT STEPS

1. After file cleanup, test order flow:
   - Create order
   - Lookup order
   - Check rate limiting works

2. Fix remaining issues in route.ts:
   - Add atomic point deduction
   - Complete price validation (line 149 incomplete)
   - Remove debug console.logs

3. Update imports in page.tsx if needed
