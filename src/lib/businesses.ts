// src/lib/businesses.ts
// Military-Friendly Businesses — the directory that the nav's "Services"
// page now shows (per Terry: "The Services category is the Military-
// Friendly Businesses"). Charlie hand-enters each one from /admin/businesses;
// there's no self-registration flow and no real review system — rating/
// reviewCount are plain numbers he types in, not computed.

import { createClient } from "@/lib/supabase/server";

export const BUSINESS_CATEGORY_LABELS = {
  car_sales: "Car sales & financing",
  moving_relocation: "Moving & relocation",
  auto_repair: "Auto repair & detailing",
  food_dining: "Food & dining",
  real_estate: "Real estate",
  legal_financial: "Legal & financial services",
  health_wellness: "Health & wellness",
  shopping_retail: "Shopping & retail",
  other: "Other",
} as const;

export type BusinessCategoryKey = keyof typeof BUSINESS_CATEGORY_LABELS;
export const BUSINESS_CATEGORY_KEYS = Object.keys(BUSINESS_CATEGORY_LABELS) as BusinessCategoryKey[];

export const BUSINESS_TAG_LABELS = {
  english_friendly: "English friendly",
  military_friendly: "Military friendly",
  vat_form_accepted: "VAT form accepted",
} as const;

export type BusinessTagKey = keyof typeof BUSINESS_TAG_LABELS;
export const BUSINESS_TAG_KEYS = Object.keys(BUSINESS_TAG_LABELS) as BusinessTagKey[];

export interface Business {
  id: string;
  name: string;
  category: BusinessCategoryKey;
  city: string;
  base: string | null;
  rating: number | null;
  reviewCount: number | null;
  tags: BusinessTagKey[];
  logoUrl: string | null;
  websiteUrl: string | null;
  phone: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

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
