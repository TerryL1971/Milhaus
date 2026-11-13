// src/app/admin/ads/actions.ts
// Create/toggle/delete for ad_slots — Charlie's self-serve way to manage
// the banner ads he charges advertisers for, instead of asking for a
// code change every time someone buys or drops a spot. Authorization is
// enforced by ad_slots' RLS policies (admin-only writes) — same pattern as
// the other admin actions — except that create and edit also check, since
// their image uploads use the service-role client (below).
//
// Image uploads (Terry, 2026-11-13, after Charlie got Milinsure's artwork
// as files, not links): "Add an ad" had only an "Image URL" box, which
// Charlie had no way to fill. Both forms now take a file. The upload goes
// through the service-role client after requireAdmin() — the live
// listing-photos storage policy refuses uploads made with a user's own
// login, and there's no admin rule for _ads/ (unlike _events/), so the
// edit page's upload, which used Charlie's login, could never have saved.
// Problems come back as a message on the form (?error=…) rather than an
// error screen, which production shows with no explanation.

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { AD_PLACEMENTS, type AdPlacement } from "@/lib/ad-slots";
import { isAdminRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Advertisers' artwork is often a few MB. next.config.ts lets form
 * submissions carry up to 4 MB so a 3 MB image plus the other fields fits. */
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

async function requireAdmin(back: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${back}`);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");
  return supabase;
}

function fail(back: string, message: string): never {
  redirect(`${back}?error=${encodeURIComponent(message)}`);
}

/** Saves an uploaded ad image and returns its public address, or null if
 * no file was chosen. Each upload gets a new file name, so a swapped
 * image never shows the old one from a cache. */
async function uploadAdImage(image: File | null, folder: string, back: string): Promise<string | null> {
  if (!image || image.size === 0) return null;
  if (!image.type.startsWith("image/")) fail(back, "The artwork has to be an image file (JPG, PNG, WebP or GIF).");
  if (image.size > MAX_IMAGE_BYTES) fail(back, "The image is over 3 MB — save it smaller and try again.");
  const ext = (image.name.split(".").pop() || "jpg").toLowerCase();
  const path = `_ads/${folder}/${Date.now()}.${ext}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("listing-photos").upload(path, image, { contentType: image.type });
  if (error) fail(back, `The image didn't upload: ${error.message}`);
  return admin.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
}

function revalidateAdPaths() {
  revalidatePath("/admin/ads");
  revalidatePath("/");
  revalidatePath("/cars");
  revalidatePath("/listings");
  revalidatePath("/offers");
  revalidatePath("/services");
  revalidatePath("/my-ads");
}

/** Admin → Ad slots → Add an ad: one of Charlie's own hand-added ads (no
 * end date). An uploaded file wins over the image URL box. */
export async function createAdSlot(formData: FormData) {
  const back = "/admin/ads/new";
  const supabase = await requireAdmin(back);
  const placement = formData.get("placement") as string;
  if (!AD_PLACEMENTS.includes(placement as AdPlacement)) fail(back, "Choose where the ad goes.");
  const linkUrl = ((formData.get("linkUrl") as string | null) ?? "").trim();
  const heading = ((formData.get("heading") as string | null) ?? "").trim() || null;
  if (!linkUrl) fail(back, "Enter where the ad links to.");

  const uploaded = await uploadAdImage(formData.get("image") as File | null, randomUUID(), back);
  const imageUrl = uploaded ?? (((formData.get("imageUrl") as string | null) ?? "").trim() || null);
  if (!imageUrl && !heading) fail(back, "Upload an image, or type a heading for a text ad.");
  const sortOrderRaw = formData.get("sortOrder") as string;

  const { error } = await supabase.from("ad_slots").insert({
    placement,
    advertiser_name: formData.get("advertiserName"),
    image_url: imageUrl,
    heading,
    body_text: formData.get("bodyText") || null,
    link_url: linkUrl,
    sort_order: sortOrderRaw ? Number(sortOrderRaw) : 0,
  });

  if (error) fail(back, error.message);
  revalidateAdPaths();
  redirect("/admin/ads");
}

/** Admin → Ad slots → "Hide" / "Unhide" — keeps the ad's details either way. */
export async function toggleAdSlotActive(formData: FormData) {
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";

  const supabase = await createClient();
  const { error } = await supabase.from("ad_slots").update({ is_active: !isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAdPaths();
}

/** Admin → Ad slots → "Delete": removes the ad for good. */
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
  const back = `/admin/ads/${id}`;
  const supabase = await requireAdmin(back);
  const linkUrl = ((formData.get("linkUrl") as string | null) ?? "").trim();
  const heading = ((formData.get("heading") as string | null) ?? "").trim() || null;
  if (!linkUrl) fail(back, "Enter where the ad links to.");

  const uploaded = await uploadAdImage(formData.get("image") as File | null, id, back);
  const imageUrl = uploaded ?? (((formData.get("imageUrl") as string | null) ?? "").trim() || null);
  if (!imageUrl && !heading) fail(back, "Upload an image, or type a heading for a text ad.");

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
  if (error) fail(back, error.message);
  revalidateAdPaths();
  redirect("/admin/ads");
}
