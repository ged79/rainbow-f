// This file is deprecated - use createAnonClient() from ./supabase/server.ts instead
// Kept for backward compatibility only

import { createAnonClient } from './supabase/server'

export const supabase = createAnonClient()

console.warn('⚠️ Using deprecated supabase export. Please import createAnonClient() directly.')
