// src/lib/listing-prices.ts
// Reads for the per-category posting price (see
// supabase/migrations/20260928120100_listing_prices_and_payments.sql
// and 20261009120000_universal_pricing_business_posting_and_cart.sql).
// Every price defaults to 0 (free) until Charlie sets real numbers from
// /admin/pricing. Originally gated to dealer accounts only — Terry's
// call, reversed: everyone posting pays the listed price now, "business"
// included as a 5th priced category alongside the original four.

import { createClient } from "@/lib/supabase/server";

export type PriceableType = "rental" | "car" | "product" | "service" | "business";
export type ListingPrices = Record<PriceableType, number>;

const DEFAULT_PRICES: ListingPrices = { rental: 0, car: 0, product: 0, service: 0, business: 0 };

function mapRows(rows: { type: string; price_eur: string | number }[]): ListingPrices {
  const prices = { ...DEFAULT_PRICES };
  for (const row of rows) {
    if (row.type in prices) prices[row.type as PriceableType] = Number(row.price_eur);
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

/** The posting flow only needs one type's price to decide whether this
 * listing needs to be paid for before it goes live. */
export async function getListingPrice(type: PriceableType): Promise<number> {
  const prices = await getListingPrices();
  return prices[type];
}

/** The one check every /post-* page needs before rendering its form:
 * does this category currently cost something? Returns the price to
 * show a "pay to post" gate for, or null if Charlie's left this
 * category free (price is 0) and the form should just submit straight
 * to pending_review like it always did. */
export async function getPostingPrice(type: PriceableType): Promise<number | null> {
  const price = await getListingPrice(type);
  return price > 0 ? price : null;
}
