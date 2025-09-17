# Deployment Guide

## 1. Prerequisites
- Node.js 18+
- Supabase Project
- Domain & SSL

## 2. Build Steps
```bash
# 1. Install dependencies
pnpm install

# 2. Build shared package
cd packages/shared && npm run build && cd ../..

# 3. Build all apps
pnpm run build
```

## 3. Environment Setup
Copy `.env.production.template` to each app folder as `.env.production`

## 4. Database Setup
Run SQL files in order:
1. `supabase/schema.sql`
2. `add_product_pricing_columns.sql`
3. `remove_constraint.sql`

## 5. Deploy to Vercel/Netlify
- Admin: `apps/admin`
- Client: `apps/client`
- Homepage: `apps/homepage`

## 6. Post-deployment
- Test all login flows
- Check product management
- Verify order system
- Test point system