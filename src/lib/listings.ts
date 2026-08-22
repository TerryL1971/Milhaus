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
