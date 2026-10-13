// src/lib/listing-bases.ts
// Pure helper, zero imports — needs to be importable from "use client"
// grid components (cars-grid.tsx) as well as server code, so it can't
// live in listings.ts (pulls in @/lib/supabase/server).

import type { Listing } from "@/lib/types";

/** Every base a listing should match against for filtering — `bases`
 * when a car dealer picked more than one, otherwise just `base` (every
 * other type, and a car with a single base). Shared so the base filter
 * behaves the same on /cars and the cross-category /search page. */
export function listingBases(listing: Pick<Listing, "base" | "bases">): string[] {
  if (listing.bases && listing.bases.length > 0) return listing.bases;
  return listing.base ? [listing.base] : [];
}
