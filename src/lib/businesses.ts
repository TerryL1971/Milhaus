// src/lib/businesses.ts
// Pure types/constants for the Military-Friendly Businesses directory —
// no Supabase import here on purpose. businesses-grid.tsx ("use client")
// imports from this file; importing anything that pulls in
// @/lib/supabase/server (which needs next/headers, server-only) would
// break its client bundle. The actual queries live in
// businesses-queries.ts instead, imported only by server components.

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
