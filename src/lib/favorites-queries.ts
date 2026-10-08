// src/lib/favorites-queries.ts
// Server-side reads for a signed-in user's favorited listings — used to
// decide which heart icons render filled, and to sort favorites first
// on /listings and /cars.

import { createClient } from "@/lib/supabase/server";

/** Set of listing IDs the given user has favorited. Empty set for a
 * signed-out visitor (callers pass null/undefined user id in that case). */
export async function getFavoriteListingIds(userId: string | null | undefined): Promise<Set<string>> {
  if (!userId) return new Set();

  const supabase = await createClient();
  const { data, error } = await supabase.from("favorites").select("listing_id").eq("user_id", userId);

  if (error) {
    console.error("getFavoriteListingIds failed:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((row) => row.listing_id as string));
}
