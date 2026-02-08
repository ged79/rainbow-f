# Supabase Setup Instructions

## 1. Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Save your credentials:
   - Project URL
   - Anon Key
   - Service Role Key

## 2. Run Database Schema
```sql
-- Run schema.sql in Supabase SQL Editor
-- This creates all tables with RLS policies
```

## 3. Run Seed Data (Optional)
```sql
-- Run seed.sql for test data
```

## 4. Generate TypeScript Types
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.generated.ts
```

## 5. Update .env.local
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Database Structure

### Core Tables:
- **stores**: Multi-tenant store management
- **orders**: Order management with status tracking
- **point_transactions**: Financial transactions
- **settlements**: Weekly settlement records
- **notifications**: Real-time notifications

### Security:
- Row Level Security (RLS) enabled on all tables
- Store-based multi-tenancy (store_id)
- User can only access their store's data

### Key Functions:
- `deduct_points()`: Order payment
- `add_points()`: Order completion income
- `charge_points()`: Point charging
- `auto_reject_pending_orders()`: 30-minute auto-rejection
