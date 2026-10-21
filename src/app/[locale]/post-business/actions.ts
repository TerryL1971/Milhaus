// src/app/[locale]/post-business/actions.ts
// Submitting a business to the Military-Friendly Businesses directory —
// a real self-serve submission now (see
// supabase/migrations/20261009120000_...), not just Charlie hand-entering
// everything. Always starts invisible (is_active=false) and in the same
// draft -> pending_review pipeline every other listing type uses. No
// manual approval step anymore (Charlie's call, 2026-10-15 — see this
// repo's cart/actions.ts header comment for the full reasoning): it goes
// active automatically via tryActivateBusiness once it's both paid for
// and consent-confirmed.
//
// Logo/cover are real file uploads now, not URL text fields (Charlie
// couldn't make sense of "paste a URL" — see
// supabase/migrations/20261021120000_add_business_logo_cover_upload_policy.sql).
// The business row has to be inserted *before* uploading (that policy
// checks ownership via an existing businesses row, same pattern
// listing-photos itself uses), so this inserts with both image columns
// null, uploads whichever files were provided using the new row's own
// id as the storage path, then updates just those two columns — not a
// client-side multi-step form the way ListingForm is, just one extra
// round trip inside the same server action.
//
// Also kicks off the real consent flow (supabase/migrations/
// 20261013180000_add_business_consent_system.sql, ported from Terry's
// European-Living.live): the business's own email — not the submitter's
// account, which may belong to a third party — gets a one-time
// confirmation link. That part hasn't changed — consent still can't be
// skipped just because a submission is paid for; see tryActivateBusiness
// in src/lib/businesses-queries.ts for exactly why.

"use server";

import { redirect } from "next/navigation";
import { BUSINESS_TAG_KEYS, type BusinessTagKey } from "@/lib/businesses";
import { tryActivateBusiness } from "@/lib/businesses-queries";
import { sendConsentRequestEmail } from "@/lib/consent-email";
import { getPostingPrice } from "@/lib/listing-prices";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function uploadBusinessImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  file: File,
  name: "logo" | "cover",
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${businessId}/${name}.${ext}`;
  const { error } = await supabase.storage.from("listing-photos").upload(path, file);
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function submitBusiness(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");

  // Legal requirement (Terry: illegal in Germany to list a business
  // without its owner's permission — see the file-top comment) — the
  // form's `required` attribute alone can be bypassed by posting
  // directly to this action, so it's re-checked here too.
  if (formData.get("ownerConfirmation") !== "on") {
    throw new Error("You must confirm you have the authority to list this business.");
  }

  const email = (formData.get("email") as string | null)?.trim();
  if (!email) {
    throw new Error("The business's own email is required — that's where the confirmation link goes.");
  }

  const priceEur = await getPostingPrice("business");
  const tags = BUSINESS_TAG_KEYS.filter((key) => formData.get(`tag_${key}`) === "on") as BusinessTagKey[];
  const now = new Date().toISOString();
  const businessId = crypto.randomUUID();

  const { data: created, error } = await supabase
    .from("businesses")
    .insert({
      id: businessId,
      name: formData.get("name"),
      category: formData.get("category"),
      city: formData.get("city"),
      base: formData.get("base") || null,
      tags,
      // Uploaded just below, once this row exists — see
      // uploadBusinessImage's own comment for why it can't happen first.
      logo_url: null,
      cover_image_url: null,
      description: formData.get("description") || null,
      promotion: formData.get("promotion") || null,
      website_url: formData.get("websiteUrl") || null,
      phone: formData.get("phone") || null,
      instagram_url: formData.get("instagramUrl") || null,
      facebook_url: formData.get("facebookUrl") || null,
      whatsapp_number: formData.get("whatsappNumber") || null,
      email,
      consent_requested_at: now,
      owner_id: user.id,
      is_active: false, // never publicly visible until Charlie approves AND consent is confirmed
      status: priceEur ? "draft" : "pending_review",
    })
    .select("id, name, consent_token")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Couldn't save that — try again.");
  }

  const logoFile = formData.get("logo") as File | null;
  const coverFile = formData.get("coverImage") as File | null;
  const logoUrl = logoFile ? await uploadBusinessImage(supabase, businessId, logoFile, "logo") : null;
  const coverUrl = coverFile ? await uploadBusinessImage(supabase, businessId, coverFile, "cover") : null;
  if (logoUrl || coverUrl) {
    const { error: imageError } = await supabase
      .from("businesses")
      .update({
        ...(logoUrl ? { logo_url: logoUrl } : {}),
        ...(coverUrl ? { cover_image_url: coverUrl } : {}),
      })
      .eq("id", businessId);
    if (imageError) throw new Error(imageError.message);
  }

  // The consent log (an audit trail, not something a regular user's own
  // session should be able to write at will) and the email-sent
  // timestamp both go through the admin client — same reasoning as the
  // public /consent/[token] actions.
  const admin = createAdminClient();
  await admin.from("business_consent_log").insert({
    business_id: created.id,
    event_type: "requested",
    email,
    token: created.consent_token,
    consent_method: "email",
  });

  if (created.consent_token) {
    const sent = await sendConsentRequestEmail({ to: email, businessName: created.name, token: created.consent_token });
    if (sent) {
      await admin.from("businesses").update({ confirmation_email_sent_at: now }).eq("id", created.id);
    }
  }

  if (priceEur) {
    const { error: cartError } = await supabase
      .from("cart_items")
      .insert({ user_id: user.id, business_id: created.id, price_eur: priceEur });
    if (cartError) throw new Error(cartError.message);
    redirect("/cart");
  }

  // Free category, so there's no payment step to trigger this later —
  // consent is still the only thing it's waiting on (tryActivateBusiness
  // is a no-op here in practice, since consent was only just requested
  // above, but every path that could move a business to active goes
  // through it rather than checking consent_status inline).
  await tryActivateBusiness(created.id);

  redirect("/post-business/success");
}
