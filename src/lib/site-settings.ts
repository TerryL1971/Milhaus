// src/lib/site-settings.ts
// The single global "free until" launch-promo date (see
// supabase/migrations/20261019090000_add_site_settings_free_until.sql).
// Split out from listing-prices.ts the same way businesses.ts/
// businesses-queries.ts are: a tiny, separate read so nothing else in
// this file needs to know the posting-price logic that consumes it.

import { createClient } from "@/lib/supabase/server";

export interface FreeUntilStatus {
  /** null = no promo set at all. */
  freeUntil: Date | null;
  /** Whether it's set *and* still in the future — the actual "is
   * everything free right now" answer. Computed here, not inline in a
   * component's render body: Date.now() is an impure call React's
   * purity rules don't allow directly inside one, and every caller of
   * this needs the same "is it still active" logic anyway (keeping it
   * in one place beats each caller repeating freeUntil > Date.now()). */
  isActive: boolean;
}

export async function getFreeUntilStatus(): Promise<FreeUntilStatus> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").select("free_until").eq("id", true).maybeSingle();
  if (error || !data?.free_until) return { freeUntil: null, isActive: false };

  const freeUntil = new Date(data.free_until);
  return { freeUntil, isActive: freeUntil.getTime() > Date.now() };
}
