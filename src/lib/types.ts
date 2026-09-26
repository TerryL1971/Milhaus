// src/lib/types.ts
// Shared domain types. Mirrors the `listings` / `profiles` tables from the
// data model in CLAUDE.md — kept in one place so the mock data used before
// Supabase is wired up, and the real Supabase queries later, share a shape.

export type ListingType = "rental" | "car" | "product" | "service";

export type ListingSource = "housing_office" | "self_listed";

export type ListingStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "rented"
  | "archived";

export type ProfileRole =
  | "owner"
  | "admin"
  | "housing_office_partner"
  | "landlord"
  | "individual_lister";

/** Suspended/banned only blocks *new* listing creation (see the "listings:
 * authenticated users create their own listings" RLS policy) — sign-in,
 * browsing, and existing listings are untouched. */
export type ProfileStatus = "active" | "suspended" | "banned";

export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  /** Rental only — null on a car listing. */
  address: string | null;
  city: string;
  /** The base this listing is closest to — used for filtering. Nullable:
   * populated by the post-a-listing form, or unset on a car ad. */
  base: string | null;
  distanceToBase: string | null;
  /** The listing's asking price — monthly rent for a rental, one-time
   * asking price for a car. Only display formatting is type-conditional
   * (the "/ mo" suffix); the column itself isn't. */
  priceEurMonth: number;
  /** Rental only — null on a car listing. */
  bedrooms: number | null;
  /** Rental only — null on a car listing. */
  bathrooms: number | null;
  sizeSqm: number | null;
  availableFrom: string | null; // ISO date, rental only
  photos: string[];
  /** Fixed set of property features — keys from AMENITY_LABELS in
   * src/lib/amenities.ts (e.g. "pet_friendly", "garage"). Rental only. */
  amenities: string[];
  /** How many off-street parking spots come with the place — Americans
   * here generally can't get a street parking permit, so this matters
   * more than it would elsewhere. Rental only. */
  parkingSpaces: number | null;
  /** What's nearby — keys from NEARBY_AMENITY_LABELS in
   * src/lib/nearby-amenities.ts (e.g. "school", "grocery_store"). Distinct
   * from `amenities` (in-unit features vs. neighborhood context). Rental only. */
  nearbyAmenities: string[];
  /** Rental only — null on a car listing. */
  internetType: "dsl" | "cable" | "fiber" | null;
  /** Rental only — null on a car listing. */
  internetSpeedMbps: number | null;
  /** Rental only — null on a car listing. */
  heatType: "gas" | "oil" | "electric" | null;
  /** Rental only — null on a car listing. */
  stoveType: "induction" | "standard" | null;
  /** Car only — null on a rental. */
  make: string | null;
  /** Car only — null on a rental. */
  model: string | null;
  /** Car only — null on a rental. */
  year: number | null;
  /** Car only — null on a rental. */
  mileageKm: number | null;
  /** Product only — key from PRODUCT_CATEGORY_LABELS in
   * src/lib/product-categories.ts. */
  productCategory: string | null;
  /** Product only — key from CONDITION_LABELS in
   * src/lib/product-categories.ts. */
  condition: string | null;
  /** Service only — key from SERVICE_CATEGORY_LABELS in
   * src/lib/service-categories.ts. */
  serviceCategory: string | null;
  /** Service only — when true, priceEurMonth is a "starting at" figure
   * rather than a fixed price (services often can't quote a hard number
   * up front). */
  priceIsEstimate: boolean;
  /** Service only — free text like "final price depends on square
   * footage" or "contact for a custom quote". */
  pricingNote: string | null;
  source: ListingSource;
  status: ListingStatus;
  /** Admin-controlled: whether this shows in the homepage hero's 3-card
   * fan. Toggled from the admin dashboard's live-listings table. */
  isFeatured: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  statusChangedAt: string;
}
