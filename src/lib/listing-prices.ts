// src/lib/listing-prices.ts
// Reads for the per-category posting price (see
// supabase/migrations/20260928120100_listing_prices_and_payments.sql
// and 20261009120000_universal_pricing_business_posting_and_cart.sql).
// Every price defaults to 0 (free) until Charlie sets real numbers from
// /admin/pricing. Originally gated to dealer accounts only — Terry's
// call, reversed: everyone posting pays the listed price now, "business"
// included as a 5th priced category alongside the original four.

import { createClient } from "@/lib/supabase/server";
import { getPromotion, promotionCovers } from "@/lib/site-settings";

// "rental_sale" is a home for sale — still a type='rental' listing, with
// its own posting price (Terry, 2026-11-04). priceableType() maps one.
export type PriceableType = "rental" | "rental_sale" | "car" | "product" | "service" | "business";
export type ListingPrices = Record<PriceableType, number>;

const DEFAULT_PRICES: ListingPrices = { rental: 0, rental_sale: 0, car: 0, product: 0, service: 0, business: 0 };

/** Which posting price a listing pays — a home for sale has its own. */
export function priceableType(type: string, offerType?: string | null): PriceableType {
  return type === "rental" && offerType === "sale" ? "rental_sale" : (type as PriceableType);
}

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
 * category free (price is 0), or a promotion from Admin → Promotion is
 * running and covers this category (src/lib/site-settings.ts), and the
 * listing goes live straight away with no payment step. */
export async function getPostingPrice(type: PriceableType): Promise<number | null> {
  if (promotionCovers(await getPromotion(), type)) return null;

  const price = await getListingPrice(type);
  return price > 0 ? price : null;
}

/** Same as getPostingPrice, but free for anyone who's checked "I'm an
 * individual" on their own profile (Charlie's ask, self-declared/honor
 * system — see profiles.is_individual_lister) regardless of the
 * category's normal price. */
export async function getPostingPriceForProfile(
  type: PriceableType,
  isIndividualLister: boolean,
): Promise<number | null> {
  if (isIndividualLister) return null;
  return getPostingPrice(type);
}
