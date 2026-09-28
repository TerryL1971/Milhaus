// src/lib/listing-prices.ts
// Reads for the per-category posting price a dealer account pays (see
// supabase/migrations/20260928120100_listing_prices_and_payments.sql).
// Every price defaults to 0 (free) until Charlie sets real numbers from
// /admin/pricing — a self-listing family posting their own home, car, or
// item is never charged regardless of these prices; only a `dealer`
// account is.

import { createClient } from "@/lib/supabase/server";
import type { ListingType } from "@/lib/types";

export type ListingPrices = Record<ListingType, number>;

const DEFAULT_PRICES: ListingPrices = { rental: 0, car: 0, product: 0, service: 0 };

function mapRows(rows: { type: string; price_eur: string | number }[]): ListingPrices {
  const prices = { ...DEFAULT_PRICES };
  for (const row of rows) {
    if (row.type in prices) prices[row.type as ListingType] = Number(row.price_eur);
  }
  return prices;
}

/** Admin's Pricing page, and anywhere that needs every price at once. */
export async function getListingPrices(): Promise<ListingPrices> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("listing_prices").select("type, price_eur");
  if (error) {
    console.error("getListingPrices failed:", error.message);
    return DEFAULT_PRICES;
  }
  return mapRows(data ?? []);
}

/** The posting flow only needs one type's price to decide whether a
 * dealer has to pay before this listing can go live. */
export async function getListingPrice(type: ListingType): Promise<number> {
  const prices = await getListingPrices();
  return prices[type];
}

/** The one check every /post-* page needs before rendering ListingForm:
 * is this signed-in poster a dealer, and does this category currently
 * cost something? Returns the price to show a "pay to post" gate for, or
 * null if they should just see the normal form (everyone who isn't a
 * dealer, and a dealer posting a category Charlie's left free). */
export async function getDealerGatePrice(role: string | undefined, type: ListingType): Promise<number | null> {
  if (role !== "dealer") return null;
  const price = await getListingPrice(type);
  return price > 0 ? price : null;
}
