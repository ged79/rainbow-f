# Admin Settlement Page - Error Fixed
## Date: 2025-01-27

### ❌ Error Found:
```
TypeError: Cannot read properties of undefined (reading 'HOUR')
at line 217: BUSINESS_RULES.SETTLEMENT_SCHEDULE.HOUR
```

### 🔍 Root Cause:
The `businessRules.ts` file in shared package has a flat structure:
- `BUSINESS_RULES.SETTLEMENT_HOUR` ✅ (correct)
- `BUSINESS_RULES.SETTLEMENT_DAY` ✅ (correct)

But the admin settlements page was trying to access:
- `BUSINESS_RULES.SETTLEMENT_SCHEDULE.HOUR` ❌ (doesn't exist)
- `BUSINESS_RULES.SETTLEMENT_SCHEDULE.DAY_OF_WEEK` ❌ (doesn't exist)

### ✅ Fix Applied:

#### Line 217:
**Before:** `BUSINESS_RULES.SETTLEMENT_SCHEDULE.HOUR`
**After:** `BUSINESS_RULES.SETTLEMENT_HOUR`

#### getNextSettlementDate function:
**Before:** 
- `BUSINESS_RULES.SETTLEMENT_SCHEDULE.DAY_OF_WEEK`
- `BUSINESS_RULES.SETTLEMENT_SCHEDULE.HOUR`
- `BUSINESS_RULES.SETTLEMENT_SCHEDULE.MINUTE`

**After:**
- `BUSINESS_RULES.SETTLEMENT_DAY`
- `BUSINESS_RULES.SETTLEMENT_HOUR`
- Removed MINUTE reference (not in constants)

### 📁 Files Modified:
- `/apps/admin/src/app/(dashboard)/accounting/settlements/page.tsx`

### ✅ Result:
The settlements page should now load without errors. The page will correctly show:
- "매주 금요일 14시 정산 (수수료 25%)"
- Settlement calculations will work properly

### Testing:
1. Run `pnpm dev` in admin folder
2. Navigate to http://localhost:3001/accounting/settlements
3. Page should load without errors
4. Settlement scheduling should work correctly