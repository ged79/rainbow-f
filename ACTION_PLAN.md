# 🚨 CRITICAL FIXES - ACTION CHECKLIST

## ⚡ THIS WEEK (Days 1-7)

### Day 1-2: Security Emergency
- [ ] **Create backup NOW**
  ```bash
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
  ```

- [ ] **Fix API authentication**
  ```typescript
  // apps/homepage/src/lib/supabase/admin.ts
  export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // Use this in all API routes
  )
  ```

- [ ] **Lock down RLS policies**
  ```sql
  DROP POLICY "members_anon_select" ON members;
  DROP POLICY "coupons_anon_update" ON coupons;
  CREATE POLICY "members_self" ON members FOR SELECT USING (auth.uid()::text = id::text);
  CREATE POLICY "coupons_service" ON coupons FOR ALL USING (auth.role() = 'service_role');
  ```

### Day 3-4: Stop Data Leaks
- [ ] **Remove PII from logs**
  - Find all `console.log` with customer data
  - Replace with masked versions or remove
  
- [ ] **Mask API responses**
  ```typescript
  customer_phone: encryptionService.maskPhone(order.customer_phone)
  ```

### Day 5-7: Prevent Fraud
- [ ] **Add order authentication**
  ```typescript
  // Check JWT token before creating orders
  const user = jwtService.verifyToken(token)
  if (!user) return 401
  ```

- [ ] **Fix race condition** (atomic function)
  ```sql
  CREATE FUNCTION deduct_points_atomic(...) RETURNS JSONB AS $$
  BEGIN
    -- Lock coupons: FOR UPDATE SKIP LOCKED
    -- Create order
    -- Deduct points
  END;
  $$;
  ```

- [ ] **Add CAPTCHA** to order form (Google reCAPTCHA v3)

---

## 📋 THIS MONTH (Weeks 2-4)

### Week 2: Core Features
- [ ] Build real shopping cart
  - Cart state management (Context API or Zustand)
  - Multi-product support
  - Cart page with edit/remove

- [ ] Fix search functionality
  ```sql
  CREATE INDEX idx_products_search ON products 
  USING GIN(to_tsvector('korean', display_name));
  ```

### Week 3: Infrastructure
- [ ] Organize SQL migrations
  ```
  database/migrations/
    001_initial.sql
    002_customer_orders.sql
    003_indexes.sql
  ```

- [ ] Set up automated backups
  ```bash
  # Cron: 0 2 * * * /backup.sh
  pg_dump | gzip > s3://backups/db_$(date).sql.gz
  ```

### Week 4: Monitoring
- [ ] Enable query monitoring
  ```sql
  CREATE EXTENSION pg_stat_statements;
  ```

- [ ] Set up error tracking (Sentry)

- [ ] Add request validation middleware (Zod schemas)

---

## 🎯 QUICK WINS (< 1 hour each)

1. **Add .env.example with dummy values** ✓
2. **Create database backup script** ✓
3. **Add CAPTCHA to homepage** (copy-paste integration)
4. **Mask phone numbers in /api/orders GET** ✓
5. **Remove console.log from production** (search & replace)
6. **Add foreign key constraints** (3 SQL statements)

---

## 🚫 STOP DOING

- ❌ Using ANON_KEY in API routes
- ❌ Logging customer PII to console
- ❌ Creating SQL files in root directory
- ❌ Running manual SQL without migration tracking
- ❌ Allowing unauthenticated order creation

---

## ✅ START DOING

- ✅ Use SERVICE_ROLE_KEY for API routes
- ✅ Mask all PII in responses
- ✅ Track migrations in database/migrations/
- ✅ Require auth for all order operations
- ✅ Run daily automated backups

---

## 📞 EMERGENCY CONTACTS

**If data breach suspected:**
1. Immediately revoke ANON_KEY (regenerate in Supabase dashboard)
2. Check `security_audit_logs` table for suspicious activity
3. Export all customer data for forensics
4. Contact customers if PII compromised (legal requirement)

**Supabase Dashboard:** https://app.supabase.com/project/[your-project]/settings/api

---

## 🔧 TESTING CHECKLIST

After each fix:
- [ ] Test in development environment first
- [ ] Verify no breaking changes to existing orders
- [ ] Check API responses still work
- [ ] Monitor error logs for 24 hours
- [ ] Rollback plan ready (backup + revert script)
