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
  revalidatePath("/offers");
  revalidatePath("/services");
  revalidatePath("/my-ads");
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

/** /admin/ads/[id] — change any ad, including putting artwork on a spot
 * someone bought (an invoiced advertiser emails it to Charlie). A file
 * upload wins over the image URL field. A bought spot that's never been
 * live goes live on save, same as when the buyer does it from My ads;
 * every other ad keeps whatever Hide/Unhide state it had. */
export async function updateAdSlot(formData: FormData) {
  const id = formData.get("id") as string;
  const linkUrl = ((formData.get("linkUrl") as string | null) ?? "").trim();
  const heading = ((formData.get("heading") as string | null) ?? "").trim() || null;
  const image = formData.get("image") as File | null;
  let imageUrl = ((formData.get("imageUrl") as string | null) ?? "").trim() || null;
  if (!linkUrl) throw new Error("Enter where the ad links to.");

  const supabase = await createClient();
  if (image && image.size > 0) {
    const ext = image.name.split(".").pop() || "jpg";
    const path = `_ads/${id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, image);
    if (uploadError) throw new Error(uploadError.message);
    imageUrl = supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
  }
  if (!imageUrl && !heading) throw new Error("Upload an image, or type a heading for a text ad.");

  const { data: current } = await supabase.from("ad_slots").select("duration_days, ends_at").eq("id", id).single();
  const firstTimeLive = Boolean(current?.duration_days) && !current?.ends_at;
  const sortOrderRaw = formData.get("sortOrder") as string;

  const { error } = await supabase
    .from("ad_slots")
    .update({
      advertiser_name: formData.get("advertiserName"),
      image_url: imageUrl,
      heading,
      body_text: formData.get("bodyText") || null,
      link_url: linkUrl,
      sort_order: sortOrderRaw ? Number(sortOrderRaw) : 0,
      updated_at: new Date().toISOString(),
      ...(firstTimeLive ? { is_active: true } : {}),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAdPaths();
  redirect("/admin/ads");
}
