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

export type BusinessStatus = "draft" | "pending_review" | "active" | "archived";

export type ConsentStatus = "pending" | "confirmed" | "revoked";
export type ConsentMethod = "email" | "paper_form" | "verbal_in_person";

export const CONSENT_METHOD_LABELS: Record<ConsentMethod, string> = {
  email: "Email confirmation link",
  paper_form: "Signed paper form",
  verbal_in_person: "Verbal, in person",
};

export interface Business {
  id: string;
  name: string;
  category: BusinessCategoryKey;
  city: string;
  base: string | null;
  rating: number | null;
  reviewCount: number | null;
  tags: BusinessTagKey[];
  /** The business's own official contact email — distinct from
   * ownerId's account. Whoever is signed in and submitting this form
   * isn't necessarily the business itself, so the confirmation link
   * goes here, not to the submitter. */
  email: string | null;
  consentStatus: ConsentStatus;
  consentToken: string | null;
  consentMethod: ConsentMethod;
  consentRequestedAt: string | null;
  consentConfirmedAt: string | null;
  confirmationIp: string | null;
  confirmationEmailSentAt: string | null;
  /** Set when Charlie records consent he obtained outside the email
   * flow — a link to the uploaded proof in the private
   * consent-documents storage bucket. */
  consentProofUrl: string | null;
  consentNote: string | null;
  /** The small badge/avatar — "profile picture" on the business profile
   * page, same image shown on the directory card. */
  logoUrl: string | null;
  /** Wide banner image on the business profile page (and the tile's
   * photo area on the directory grid) — a separate image from logoUrl,
   * same relationship as a LinkedIn cover photo to a profile picture. */
  coverImageUrl: string | null;
  /** Long-form "about the business" copy — shown on the directory tile
   * (truncated) and in full on the profile page. */
  description: string | null;
  /** A short promo/discount line, e.g. "10% off for military ID
   * holders" — not a structured discount-code system, just a prominent
   * callout. */
  promotion: string | null;
  websiteUrl: string | null;
  phone: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  /** Digits-only (with country code), not reusing `phone` — a wa.me link
   * needs that exact format, not necessarily how someone types their
   * regular contact number. */
  whatsappNumber: string | null;
  isActive: boolean;
  isFeatured: boolean;
  /** null = one of Charlie's original hand-entered rows, not a
   * self-serve submission. */
  ownerId: string | null;
  /** The same draft -> pending_review -> active pipeline every other
   * listing type has. Existing hand-entered rows default to 'active'. */
  status: BusinessStatus;
  createdAt: string;
  updatedAt: string;
}
