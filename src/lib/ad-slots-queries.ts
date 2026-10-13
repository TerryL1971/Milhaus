// src/lib/ad-slots-queries.ts
// Server-side reads for ad_slots — split out from ad-slots.ts for the
// same reason as businesses-queries.ts: needs @/lib/supabase/server,
// which breaks a "use client" component's bundle if it ends up pulled in
// transitively.

import { createClient } from "@/lib/supabase/server";
import type { AdSlot, AdPlacement } from "@/lib/ad-slots";

function mapRow(row: Record<string, unknown>): AdSlot {
  return {
    id: row.id as string,
    placement: row.placement as AdPlacement,
    advertiserName: row.advertiser_name as string,
    imageUrl: (row.image_url as string | null) ?? null,
    heading: (row.heading as string | null) ?? null,
    bodyText: (row.body_text as string | null) ?? null,
    linkUrl: row.link_url as string,
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order),
    createdAt: row.created_at as string,
  };
}

/** The public-facing read — SponsorBannerCarousel and CarsSidebarBanner
 * both just need "every active ad for this placement, in display
 * order." RLS already restricts anon/public reads to is_active=true. */
export async function getActiveAdSlots(placement: AdPlacement): Promise<AdSlot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_slots")
    .select("*")
    .eq("placement", placement)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getActiveAdSlots failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** Every ad slot regardless of active state — /admin/ads. */
export async function getAllAdSlots(): Promise<AdSlot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_slots")
    .select("*")
    .order("placement", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getAllAdSlots failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}
