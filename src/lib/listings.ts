// src/lib/listings.ts
// Server-side reads from the real `listings` table. Row Level Security
// already scopes what each caller can see (public/anon gets status='active'
// only), so these just need the right query shape — no extra filtering here
// would be redundant, and the wrong extra filtering would hide rows RLS
// would otherwise allow (e.g. an owner or admin viewing their own listing).

import { createClient } from "@/lib/supabase/server";
import type { Listing, ListingType } from "@/lib/types";

// Every read below selects "*, rental_details(*), car_details(*),
// product_details(*), service_details(*)" — PostgREST embeds each as a
// nested object (null when the row isn't that type, since listing_id is
// that table's PK/FK).
const LISTING_SELECT = "*, rental_details(*), car_details(*), product_details(*), service_details(*)";

// Supabase returns snake_case columns; the app's Listing type is camelCase.
// The type-specific fields now live on a joined details row rather than
// directly on `row` — mapRow flattens whichever of the three is present
// back into the same flat shape the rest of the app already expects.
export function mapRow(row: Record<string, unknown>): Listing {
  const details =
    (row.rental_details as Record<string, unknown> | null) ??
    (row.car_details as Record<string, unknown> | null) ??
    (row.product_details as Record<string, unknown> | null) ??
    (row.service_details as Record<string, unknown> | null) ??
    {};

  return {
    id: row.id as string,
    type: row.type as Listing["type"],
    title: row.title as string,
    description: row.description as string,
    address: (details.address as string | null) ?? null,
    city: row.city as string,
    base: (row.base as string | null) ?? null,
    distanceToBase: (row.distance_to_base as string | null) ?? null,
    priceEurMonth: Number(row.price_eur_month),
    bedrooms: details.bedrooms === null || details.bedrooms === undefined ? null : Number(details.bedrooms),
    bathrooms: details.bathrooms === null || details.bathrooms === undefined ? null : Number(details.bathrooms),
    sizeSqm: details.size_sqm === null || details.size_sqm === undefined ? null : Number(details.size_sqm),
    availableFrom: (details.available_from as string | null) ?? null,
    photos: (row.photos as string[]) ?? [],
    amenities: (details.amenities as string[]) ?? [],
    parkingSpaces:
      details.parking_spaces === null || details.parking_spaces === undefined ? null : Number(details.parking_spaces),
    nearbyAmenities: (details.nearby_amenities as string[]) ?? [],
    internetType: (details.internet_type as Listing["internetType"]) ?? null,
    internetSpeedMbps:
      details.internet_speed_mbps === null || details.internet_speed_mbps === undefined
        ? null
        : Number(details.internet_speed_mbps),
    heatType: (details.heat_type as Listing["heatType"]) ?? null,
    stoveType: (details.stove_type as Listing["stoveType"]) ?? null,
    make: (details.make as string | null) ?? null,
    model: (details.model as string | null) ?? null,
    year: details.year === null || details.year === undefined ? null : Number(details.year),
    mileageKm: details.mileage_km === null || details.mileage_km === undefined ? null : Number(details.mileage_km),
    productCategory: (details.product_category as string | null) ?? null,
    condition: (details.condition as string | null) ?? null,
    serviceCategory: (details.service_category as string | null) ?? null,
    priceIsEstimate: Boolean(details.price_is_estimate),
    pricingNote: (details.pricing_note as string | null) ?? null,
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
 * restriction, this function doesn't need to know who's asking. Defaults
 * to 'rental' so the existing homepage/sitemap callers are unaffected by
 * cars existing at all — pass "car" for the cars browse page. */
export async function getActiveListings(type: ListingType = "rental"): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .eq("type", type)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getActiveListings failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** Homepage hero's 3-card fan — rentals only (the hero's search bar is
 * rental-specific: near base, move-in date, bedrooms). Admin-featured
 * active listings first (most recently featured/added among them),
 * backfilled with the most recent active rentals so there are always up
 * to `limit` cards even before an admin has featured anything. */
export async function getFeaturedListings(limit = 3): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .eq("type", "rental")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // 42703 = undefined column: the is_featured migration hasn't been run
    // on this database yet. Degrade to "most recent active" instead of
    // returning nothing — a missing migration shouldn't take down the
    // entire hero, just the featuring behavior on top of it.
    if (error.code === "42703") {
      const fallback = await getActiveListings("rental");
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
    .select(LISTING_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getListingById failed:", error.message);
    return null;
  }
  return data ? mapRow(data) : null;
}

export interface SellerProfile {
  displayName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  photoUrl: string | null;
  bio: string | null;
}

/** The public seller card shown on every listing's detail page, and the
 * standalone /sellers/[id] profile page. Public on purpose — Charlie's
 * call, modeled on bookoo's own seller card, no sign-in wall — so this
 * only returns null when the id doesn't match a profile that owns at
 * least one active listing (the RLS policy's condition); a pending/
 * rented-out/archived-only seller has nothing to show here. */
export async function getSellerProfile(ownerId: string): Promise<SellerProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, contact_email, contact_phone, photo_url, bio")
    .eq("id", ownerId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    displayName: data.display_name as string | null,
    contactEmail: data.contact_email as string | null,
    contactPhone: data.contact_phone as string | null,
    photoUrl: data.photo_url as string | null,
    bio: data.bio as string | null,
  };
}

/** A seller's active listings, any type — "more from this seller" on a
 * listing detail page (pass excludeId to leave out the one on screen), or
 * the full set on the standalone /sellers/[id] page (omit it). */
export async function getSellerListings(
  ownerId: string,
  excludeId?: string,
  limit = 4,
): Promise<Listing[]> {
  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("owner_id", ownerId)
    .eq("status", "active");
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);

  if (error) {
    console.error("getSellerListings failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** "My listings" dashboard — every listing the signed-in caller owns,
 * any status, any type. RLS's "owner reads own listings" policy is what
 * actually scopes this to the caller; a signed-out or mismatched-id call
 * just comes back empty rather than needing its own check here. */
export async function getMyListings(ownerId: string): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getMyListings failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** Admin dashboard: submissions waiting on review. RLS only lets an admin
 * see other people's pending_review rows, so this naturally returns
 * nothing for a non-admin caller rather than needing its own check. */
export async function getPendingListings(): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
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
    .select(LISTING_SELECT)
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
    .select(LISTING_SELECT)
    .eq("status", "archived")
    .order("status_changed_at", { ascending: false });

  if (error) {
    console.error("getArchivedListings failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}
