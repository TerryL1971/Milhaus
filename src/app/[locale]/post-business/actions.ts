// src/app/[locale]/post-business/actions.ts
// Submitting a business to the Military-Friendly Businesses directory —
// a real self-serve submission now (see
// supabase/migrations/20261009120000_...), not just Charlie hand-entering
// everything. Always starts invisible (is_active=false) and in the same
// draft -> pending_review pipeline every other listing type uses;
// Charlie approves it from /admin/businesses, same as reviewing any
// other submission. No photo upload step like ListingForm has — just a
// logo URL field — so this stays a plain server action, no client-side
// multi-step state needed.

"use server";

import { redirect } from "next/navigation";
import { BUSINESS_TAG_KEYS, type BusinessTagKey } from "@/lib/businesses";
import { getPostingPrice } from "@/lib/listing-prices";
import { createClient } from "@/lib/supabase/server";

export async function submitBusiness(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");

  const priceEur = await getPostingPrice("business");
  const tags = BUSINESS_TAG_KEYS.filter((key) => formData.get(`tag_${key}`) === "on") as BusinessTagKey[];

  const { data: created, error } = await supabase
    .from("businesses")
    .insert({
      name: formData.get("name"),
      category: formData.get("category"),
      city: formData.get("city"),
      base: formData.get("base") || null,
      tags,
      logo_url: formData.get("logoUrl") || null,
      website_url: formData.get("websiteUrl") || null,
      phone: formData.get("phone") || null,
      owner_id: user.id,
      is_active: false, // never publicly visible until Charlie approves
      status: priceEur ? "draft" : "pending_review",
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Couldn't save that — try again.");
  }

  if (priceEur) {
    const { error: cartError } = await supabase
      .from("cart_items")
      .insert({ user_id: user.id, business_id: created.id, price_eur: priceEur });
    if (cartError) throw new Error(cartError.message);
    redirect("/cart");
  }

  redirect("/post-business/success");
}
