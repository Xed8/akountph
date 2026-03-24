import { createClient } from '@supabase/supabase-js'

// Bypasses RLS — only use for bootstrapping operations where RLS cannot be satisfied
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
