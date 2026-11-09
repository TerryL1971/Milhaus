// src/lib/types.ts
// Shared domain types. Mirrors the `listings` / `profiles` tables from the
// data model in CLAUDE.md — kept in one place so the mock data used before
// Supabase is wired up, and the real Supabase queries later, share a shape.

export type ListingType = "rental" | "car" | "product" | "service";
export type OfferType = "rent" | "sale";

/** Every listing is "self_listed" — posted by the person renting or
 * selling it. "housing_office" is a retired value kept only because the
 * database column still allows it: nothing may set it or display it, and
 * the site must never suggest a military housing office listed, approved
 * or endorsed a home (owner's decision, 2026-11-04). */
export type ListingSource = "housing_office" | "self_listed";

export type ListingStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "rented"
  | "archived"
  /** 30 days after going live with no renewal — see
   * 20261102150000_add_listing_expiry.sql. Renewable from My Listings. */
  | "expired";

export type ProfileRole =
  | "owner"
  | "admin"
  // Retired along with the "housing_office" listing source (see
  // ListingSource above); kept so old rows still type-check.
  | "housing_office_partner"
  | "landlord"
  | "individual_lister"
  | "dealer";

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
  /** Car only — set when a dealer advertises the same car at more than
   * one base/region. Null (or a single-element array, never created by
   * the form) means "just `base`". */
  bases: string[] | null;
  distanceToBase: string | null;
  /** The listing's asking price — monthly rent for a home for rent,
   * one-time asking price for a home for sale or a car. Only display
   * formatting is conditional (the "/ mo" suffix); the column isn't. */
  priceEurMonth: number;
  /** Homes only: for rent, or for sale (2026-11-04). Always "rent" on
   * every other type. */
  offerType: OfferType;
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
  /** Homes only — the amenity / nearby keys the lister starred to show
   * on the card, in order. Empty = the card shows the first features. */
  highlights: string[];
  /** Rental only — null on a car listing. */
  internetType: "dsl" | "cable" | "fiber" | null;
  /** Rental only — null on a car listing. */
  internetSpeedMbps: number | null;
  /** Rental only — null on a car listing. */
  heatType: "gas" | "oil" | "electric" | null;
  /** Rental only — null on a car listing. */
  stoveType: "induction" | "standard" | null;
  /** Rental only — a "New" badge, set by the lister themselves (not
   * computed from created_at). Defaults false. */
  isNew: boolean;
  /** Rental only — who the home is open to, Charlie's "available to"
   * badge. "everyone" shows no badge; null on listings posted before
   * the field existed. */
  availableTo: "everyone" | "military_and_expats" | "military_only" | null;
  /** Homes only — the energy certificate (Energieausweis) details § 87
   * GEG requires in every property ad (2026-11-09 legal pass, see
   * src/components/energy-certificate-fields.tsx). "exempt" = no
   * certificate needed (e.g. a listed building). Null on homes posted
   * before the fields existed. */
  energyCertificateType: "demand" | "consumption" | "exempt" | null;
  /** kWh per m² per year, from the certificate. */
  energyValueKwh: number | null;
  /** A+ … H; null when the certificate predates classes (before May 2014). */
  energyClass: string | null;
  /** Main heating energy source, from the certificate. */
  energySource: string | null;
  yearBuilt: number | null;
  /** Car only — null on a rental. */
  make: string | null;
  /** Car only — null on a rental. */
  model: string | null;
  /** Car only — null on a rental. */
  year: number | null;
  /** Car only — null on a rental. */
  mileageKm: number | null;
  /** Car only — null on a rental, and nullable even on a car (optional
   * field; a lot of real listings won't specify it). */
  transmission: "automatic" | "manual" | null;
  /** Car only — whether this is a US-market car vs. a German/EU-market
   * one, which matters a lot to this audience (re-registration hassle).
   * Nullable/optional, same reasoning as transmission. */
  usSpec: boolean | null;
  /** Car only — key from CAR_BODY_TYPE_LABELS in
   * src/lib/car-body-types.ts. Nullable/optional, same reasoning as
   * transmission. */
  bodyType: string | null;
  /** Car only — a "Low Mileage" badge, set by the lister themselves
   * (not computed from mileageKm). Defaults false. */
  lowMileage: boolean;
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
  /** How many times this listing's detail page has been viewed —
   * incremented server-side (src/lib/listing-views.ts), never counting
   * the owner's own views. Owner-facing only (/my-listings, the detail
   * page when the viewer is the owner), never shown publicly. */
  viewCount: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  statusChangedAt: string;
  /** When an active listing comes down unless renewed. Null before it
   * has ever gone live (or before the expiry migration was run). */
  expiresAt: string | null;
}
