// src/lib/listings.ts
// Server-side reads from the real `listings` table. Row Level Security
// already scopes what each caller can see (public/anon gets status='active'
// only), so these just need the right query shape — no extra filtering here
// would be redundant, and the wrong extra filtering would hide rows RLS
// would otherwise allow (e.g. an owner or admin viewing their own listing).

import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";

// Supabase returns snake_case columns; the app's Listing type is camelCase.
export function mapRow(row: Record<string, unknown>): Listing {
  return {
    id: row.id as string,
    type: row.type as Listing["type"],
    title: row.title as string,
    description: row.description as string,
    address: row.address as string,
    city: row.city as string,
    base: (row.base as string | null) ?? null,
    distanceToBase: (row.distance_to_base as string | null) ?? null,
    priceEurMonth: Number(row.price_eur_month),
    bedrooms: row.bedrooms as number,
    bathrooms: row.bathrooms as number,
    sizeSqm: row.size_sqm === null ? null : Number(row.size_sqm),
    availableFrom: (row.available_from as string | null) ?? null,
    photos: (row.photos as string[]) ?? [],
    amenities: (row.amenities as string[]) ?? [],
    source: row.source as Listing["source"],
    status: row.status as Listing["status"],
    isFeatured: Boolean(row.is_featured),
    ownerId: row.owner_id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    statusChangedAt: row.status_changed_at as string,
  };
}

/** Every listing visible to the current caller with status='active' — the
 * public browse page. Anonymous visitors see all of these; RLS handles the
 * restriction, this function doesn't need to know who's asking. */
export async function getActiveListings(): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getActiveListings failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** Homepage hero's 3-card fan. Admin-featured active listings first (most
 * recently featured/added among them), backfilled with the most recent
 * active listings so there are always up to `limit` cards even before an
 * admin has featured anything. */
export async function getFeaturedListings(limit = 3): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // 42703 = undefined column: the is_featured migration hasn't been run
    // on this database yet. Degrade to "most recent active" instead of
    // returning nothing — a missing migration shouldn't take down the
    // entire hero, just the featuring behavior on top of it.
    if (error.code === "42703") {
      const fallback = await getActiveListings();
      return fallback.slice(0, limit);
    }
    console.error("getFeaturedListings failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** A single listing by id, for the detail page. Returns null if it doesn't
 * exist *or* the current caller isn't allowed to see it (RLS) — those two
 * cases are indistinguishable from the outside, which is the point: a
 * pending listing's existence shouldn't be discoverable by guessing ids. */
export async function getListingById(id: string): Promise<Listing | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getListingById failed:", error.message);
    return null;
  }
  return data ? mapRow(data) : null;
}

/** Listing detail page's "contact the lister" box. Only returns data when
 * RLS actually allows it — the caller must be signed in, and the owner
 * must have at least one active listing (see the
 * profiles_contact_visible_for_active_listings migration). Anything else
 * (not signed in, listing not active, migration not yet applied) comes
 * back null and the page falls back to the "sign in" prompt instead of
 * throwing. */
export async function getOwnerContact(
  ownerId: string,
): Promise<{ displayName: string | null; contactEmail: string | null; contactPhone: string | null } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, contact_email, contact_phone")
    .eq("id", ownerId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    displayName: data.display_name as string | null,
    contactEmail: data.contact_email as string | null,
    contactPhone: data.contact_phone as string | null,
  };
}

/** Admin dashboard: submissions waiting on review. RLS only lets an admin
 * see other people's pending_review rows, so this naturally returns
 * nothing for a non-admin caller rather than needing its own check. */
export async function getPendingListings(): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "pending_review")
    .order("created_at");

  if (error) {
    console.error("getPendingListings failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** Admin dashboard: everything currently live (active or rented), for the
 * "what's live" table and its one-click status changes. */
export async function getLiveListings(): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .in("status", ["active", "rented"])
    .order("status_changed_at", { ascending: false });

  if (error) {
    console.error("getLiveListings failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** Admin dashboard: everything archived — a rejected submission, or a
 * house that came off the market. Once a listing hits `archived` it drops
 * out of getLiveListings entirely, so this is the only place an admin can
 * find it again to bring it back with Relist. */
export async function getArchivedListings(): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "archived")
    .order("status_changed_at", { ascending: false });

  if (error) {
    console.error("getArchivedListings failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}
