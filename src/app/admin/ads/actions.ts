// src/app/admin/ads/actions.ts
// Create/toggle/delete for ad_slots — Charlie's self-serve way to manage
// the banner ads he charges advertisers for, instead of asking for a
// code change every time someone buys or drops a spot. Authorization is
// enforced by ad_slots' RLS policies (admin-only writes), not re-checked
// here — same pattern as the other admin actions.

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AD_PLACEMENTS, type AdPlacement } from "@/lib/ad-slots";
import { createClient } from "@/lib/supabase/server";

function revalidateAdPaths() {
  revalidatePath("/admin/ads");
  revalidatePath("/");
  revalidatePath("/cars");
  revalidatePath("/listings");
  revalidatePath("/products");
  revalidatePath("/services");
}

export async function createAdSlot(formData: FormData) {
  const placement = formData.get("placement") as string;
  if (!AD_PLACEMENTS.includes(placement as AdPlacement)) {
    throw new Error(`Not a real placement: "${placement}"`);
  }
  const sortOrderRaw = formData.get("sortOrder") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("ad_slots").insert({
    placement,
    advertiser_name: formData.get("advertiserName"),
    image_url: formData.get("imageUrl") || null,
    heading: formData.get("heading") || null,
    body_text: formData.get("bodyText") || null,
    link_url: formData.get("linkUrl"),
    sort_order: sortOrderRaw ? Number(sortOrderRaw) : 0,
  });

  if (error) throw new Error(error.message);
  revalidateAdPaths();
  redirect("/admin/ads");
}

export async function toggleAdSlotActive(formData: FormData) {
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";

  const supabase = await createClient();
  const { error } = await supabase.from("ad_slots").update({ is_active: !isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAdPaths();
}

export async function deleteAdSlot(formData: FormData) {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("ad_slots").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAdPaths();
}
