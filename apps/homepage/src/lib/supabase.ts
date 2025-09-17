// This file is deprecated - use createServiceClient() from ./supabase/server.ts instead
// Kept for backward compatibility only

import { createServiceClient } from './supabase/server'

export const supabase = createServiceClient()

console.warn('⚠️ Using deprecated supabase export. Please import createAnonClient() directly.')
