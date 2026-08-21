// src/lib/types.ts
// Shared domain types. Mirrors the `listings` / `profiles` tables from the
// data model in CLAUDE.md — kept in one place so the mock data used before
// Supabase is wired up, and the real Supabase queries later, share a shape.

export type ListingType = "rental"; // extensible: cars may be added later

export type ListingSource = "housing_office" | "self_listed";

export type ListingStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "rented"
  | "archived";

export type ProfileRole =
  | "admin"
  | "housing_office_partner"
  | "landlord"
  | "individual_lister";

export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  address: string;
  city: string;
  /** The base this listing is closest to — used for filtering. */
  base: string;
  distanceToBase: string;
  priceEurMonth: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  availableFrom: string; // ISO date
  photos: string[];
  source: ListingSource;
  status: ListingStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  statusChangedAt: string;
}
