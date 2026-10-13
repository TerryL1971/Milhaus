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
//
// Also kicks off the real consent flow (supabase/migrations/
// 20261013180000_add_business_consent_system.sql, ported from Terry's
// European-Living.live): the business's own email — not the submitter's
// account, which may belong to a third party — gets a one-time
// confirmation link. Nothing here skips that just because a submission
// is also paid for; consent and payment are separate gates.

"use server";

import { redirect } from "next/navigation";
import { BUSINESS_TAG_KEYS, type BusinessTagKey } from "@/lib/businesses";
import { sendConsentRequestEmail } from "@/lib/consent-email";
import { getPostingPrice } from "@/lib/listing-prices";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

  const { data: created, error } = await supabase
    .from("businesses")
    .insert({
      name: formData.get("name"),
      category: formData.get("category"),
      city: formData.get("city"),
      base: formData.get("base") || null,
      tags,
      logo_url: formData.get("logoUrl") || null,
      cover_image_url: formData.get("coverImageUrl") || null,
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

  redirect("/post-business/success");
}
