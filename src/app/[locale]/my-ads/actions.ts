// src/app/[locale]/my-ads/actions.ts
// An advertiser putting artwork on a spot they bought — saving is what
// puts it live (payment was the gate, same as listings since
// 2026-10-15), and the ad_slots_set_ends_at trigger starts its clock the
// first time. They can swap the artwork any time while it runs.
//
// Ownership is checked with the caller's own session (RLS: owners read
// their own spots), then written with the service-role client — the
// "trusted path" pattern from src/lib/listing-edit.ts. A plain owner
// update policy would also let them move ends_at or is_active
// themselves.

"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 1024 * 1024;

export async function saveMyAdSpot(formData: FormData) {
  const id = formData.get("id") as string;
  const linkUrl = ((formData.get("linkUrl") as string | null) ?? "").trim();
  const heading = ((formData.get("heading") as string | null) ?? "").trim() || null;
  const bodyText = ((formData.get("bodyText") as string | null) ?? "").trim() || null;
  const image = formData.get("image") as File | null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");

  const { data: spot } = await supabase
    .from("ad_slots")
    .select("id, owner_id, image_url, ends_at")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!spot) throw new Error("That ad spot isn't yours.");
  if (spot.ends_at && new Date(spot.ends_at as string) <= new Date()) {
    throw new Error("This ad spot has finished — buy a new one from the Advertise page.");
  }

  if (!/^https?:\/\/\S+\.\S+/.test(linkUrl)) throw new Error("Enter the full web address, starting with https://");

  const admin = createAdminClient();
  let imageUrl = (spot.image_url as string | null) ?? null;
  if (image && image.size > 0) {
    if (!image.type.startsWith("image/")) throw new Error("The artwork has to be an image file.");
    if (image.size > MAX_IMAGE_BYTES) throw new Error("The image is over 1 MB — save it smaller and try again.");
    const ext = image.name.split(".").pop() || "jpg";
    // New file name every time so a swapped image never shows the old
    // one from a cache.
    const path = `_ads/${id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await admin.storage.from("listing-photos").upload(path, image);
    if (uploadError) throw new Error(uploadError.message);
    imageUrl = admin.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
  }
  if (!imageUrl && !heading) throw new Error("Upload an image, or type a heading for a text ad.");

  const { error } = await admin
    .from("ad_slots")
    .update({
      image_url: imageUrl,
      heading,
      body_text: bodyText,
      link_url: linkUrl,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/my-ads");
  revalidatePath("/", "layout");
}
