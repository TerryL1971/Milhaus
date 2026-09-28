// src/app/admin/pricing/actions.ts
// Setting the per-category dealer posting price from the admin Pricing
// page.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ListingType } from "@/lib/types";

const VALID_TYPES: ListingType[] = ["rental", "car", "product", "service"];

export async function setListingPrice(formData: FormData) {
  const type = formData.get("type") as string;
  const priceEur = Number(formData.get("priceEur"));

  if (!VALID_TYPES.includes(type as ListingType)) {
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
