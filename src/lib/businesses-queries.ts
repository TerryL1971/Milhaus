// src/lib/businesses-queries.ts
// Server-side reads/writes for the businesses table — split out from
// businesses.ts (pure types/constants) because this needs
// @/lib/supabase/server, which depends on next/headers and breaks if a
// "use client" component (businesses-grid.tsx) ends up importing it
// transitively.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    coverImageUrl: (row.cover_image_url as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    promotion: (row.promotion as string | null) ?? null,
    websiteUrl: (row.website_url as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    instagramUrl: (row.instagram_url as string | null) ?? null,
    facebookUrl: (row.facebook_url as string | null) ?? null,
    whatsappNumber: (row.whatsapp_number as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    consentStatus: (row.consent_status as Business["consentStatus"]) ?? "pending",
    consentToken: (row.consent_token as string | null) ?? null,
    consentMethod: (row.consent_method as Business["consentMethod"]) ?? "email",
    consentRequestedAt: (row.consent_requested_at as string | null) ?? null,
    consentConfirmedAt: (row.consent_confirmed_at as string | null) ?? null,
    confirmationIp: (row.confirmation_ip as string | null) ?? null,
    confirmationEmailSentAt: (row.confirmation_email_sent_at as string | null) ?? null,
    consentProofUrl: (row.consent_proof_url as string | null) ?? null,
    consentNote: (row.consent_note as string | null) ?? null,
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

/** The public /consent/[token] confirmation page — looked up by token,
 * not id, since the business owner clicking this link has no Milhaus
 * account/session at all to scope a normal id-based read to. Uses the
 * admin client (bypasses RLS) for the same reason getBusiness can't:
 * there's no signed-in admin here, just whoever got the email. */
export async function getBusinessByConsentToken(token: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("businesses").select("*").eq("consent_token", token).maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}
