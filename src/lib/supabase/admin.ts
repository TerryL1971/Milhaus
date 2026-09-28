// src/lib/supabase/admin.ts
// Service-role Supabase client — bypasses Row Level Security entirely.
// Only for server-side code confirming something happened outside any
// user's own session (payment provider confirming a charge succeeded),
// where there's no signed-in user to act as. Never import this from a
// "use client" component, and never use it as a shortcut around RLS for
// anything a regular authenticated client() call could do instead.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
