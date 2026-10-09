// src/lib/businesses-queries.ts
// Server-side reads/writes for the businesses table — split out from
// businesses.ts (pure types/constants) because this needs
// @/lib/supabase/server, which depends on next/headers and breaks if a
// "use client" component (businesses-grid.tsx) ends up importing it
// transitively.

import { createClient } from "@/lib/supabase/server";
import type { Business, BusinessCategoryKey, BusinessTagKey } from "@/lib/businesses";

function mapRow(row: Record<string, unknown>): Business {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as BusinessCategoryKey,
    city: row.city as string,
    base: (row.base as string | null) ?? null,
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
    reviewCount: row.review_count === null || row.review_count === undefined ? null : Number(row.review_count),
    tags: (row.tags as BusinessTagKey[]) ?? [],
    logoUrl: (row.logo_url as string | null) ?? null,
    websiteUrl: (row.website_url as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    isActive: Boolean(row.is_active),
    isFeatured: Boolean(row.is_featured),
    ownerId: (row.owner_id as string | null) ?? null,
    status: (row.status as Business["status"]) ?? "active",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Every active business — the public /services directory. RLS already
 * restricts anonymous/public reads to is_active=true, same model as
 * getActiveListings. */
export async function getActiveBusinesses(): Promise<Business[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getActiveBusinesses failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** Featured active businesses for the homepage's 4-card strip. */
export async function getFeaturedBusinesses(limit = 4): Promise<Business[]> {
  const all = await getActiveBusinesses();
  return all.slice(0, limit);
}

/** Every business regardless of active state — the admin list. */
export async function getAllBusinesses(): Promise<Business[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllBusinesses failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

export async function getBusiness(id: string): Promise<Business | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("businesses").select("*").eq("id", id).single();
  if (error || !data) return null;
  return mapRow(data);
}
