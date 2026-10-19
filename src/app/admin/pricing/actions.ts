// src/app/admin/pricing/actions.ts
// Setting the per-category posting price from the admin Pricing page.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PriceableType } from "@/lib/listing-prices";

const VALID_TYPES: PriceableType[] = ["rental", "car", "product", "service", "business"];

export async function setListingPrice(formData: FormData) {
  const type = formData.get("type") as string;
  const priceEur = Number(formData.get("priceEur"));

  if (!VALID_TYPES.includes(type as PriceableType)) {
    throw new Error(`Not a real listing type: "${type}"`);
  }
  if (!Number.isFinite(priceEur) || priceEur < 0) {
    throw new Error("Price must be a number, 0 or more.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_prices")
    .update({ price_eur: priceEur, updated_at: new Date().toISOString() })
    .eq("type", type)
    .select("type");

  if (error) {
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new Error("That didn't go through — you may not have permission to do this.");
  }
  revalidatePath("/admin/pricing");
}

/** The site-wide "everything's free until..." launch promo — one date,
 * applies to every category regardless of its own configured price (see
 * getPostingPrice in src/lib/listing-prices.ts). Empty input clears it. */
export async function setFreeUntil(formData: FormData) {
  const raw = formData.get("freeUntil") as string;
  const freeUntil = raw ? new Date(raw).toISOString() : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .update({ free_until: freeUntil, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new Error("That didn't go through — you may not have permission to do this.");
  }
  revalidatePath("/admin/pricing");
}
