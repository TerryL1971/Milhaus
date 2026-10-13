// src/app/admin/businesses/actions.ts
// Create/toggle/delete for the Military-Friendly Businesses directory,
// plus the consent-management actions Terry ported from
// European-Living.live (supabase/migrations/
// 20261013180000_add_business_consent_system.sql): recording consent
// Charlie obtained himself (a signed paper form, a verbal yes), and
// resending the confirmation email for one still waiting on it.
// Authorization for the plain CRUD is enforced by the businesses RLS
// policies (admin-only writes), not re-checked here — same pattern as
// the other admin actions. The consent-log writes go through the admin
// client regardless, same reasoning as the public /consent/[token]
// actions: it's an audit trail, not something any authenticated role
// should freely insert into.

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BUSINESS_CATEGORY_KEYS, BUSINESS_TAG_KEYS, type BusinessCategoryKey, type BusinessTagKey } from "@/lib/businesses";
import { sendConsentRequestEmail } from "@/lib/consent-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function revalidateBusinessPaths() {
  revalidatePath("/admin/businesses");
  revalidatePath("/services");
  revalidatePath("/");
}

export async function createBusiness(formData: FormData) {
  const category = formData.get("category") as string;
  if (!BUSINESS_CATEGORY_KEYS.includes(category as BusinessCategoryKey)) {
    throw new Error(`Not a real category: "${category}"`);
  }

  const email = (formData.get("email") as string | null)?.trim();
  if (!email) throw new Error("The business's own email is required.");

  const consentMethod = (formData.get("consentMethod") as string) || "email";
  const tags = BUSINESS_TAG_KEYS.filter((key) => formData.get(`tag_${key}`) === "on");
  const ratingRaw = formData.get("rating") as string;
  const reviewCountRaw = formData.get("reviewCount") as string;
  const now = new Date().toISOString();

  const supabase = await createClient();

  // Charlie recording consent he already has (a signed form, a verbal
  // yes) rather than going through the emailed link — mark it confirmed
  // right away instead of leaving it pending with no way to resolve it.
  let consentProofUrl: string | null = null;
  const proofFile = formData.get("consentProof") as File | null;
  if (consentMethod !== "email" && proofFile && proofFile.size > 0) {
    const ext = proofFile.name.split(".").pop() || "pdf";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("consent-documents").upload(path, proofFile);
    if (uploadError) throw new Error(uploadError.message);
    const { data: urlData } = supabase.storage.from("consent-documents").getPublicUrl(path);
    consentProofUrl = urlData.publicUrl;
  }

  const { data: created, error } = await supabase
    .from("businesses")
    .insert({
      name: formData.get("name"),
      category,
      city: formData.get("city"),
      base: formData.get("base") || null,
      rating: ratingRaw ? Number(ratingRaw) : null,
      review_count: reviewCountRaw ? Number(reviewCountRaw) : null,
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
      consent_method: consentMethod,
      consent_requested_at: now,
      consent_note: (formData.get("consentNote") as string | null) || null,
      consent_proof_url: consentProofUrl,
      ...(consentMethod !== "email" ? { consent_status: "confirmed", consent_confirmed_at: now } : {}),
      is_featured: formData.get("isFeatured") === "on",
    })
    .select("id, name, consent_token")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Couldn't save that — try again.");
  }

  const admin = createAdminClient();
  await admin.from("business_consent_log").insert({
    business_id: created.id,
    event_type: consentMethod === "email" ? "requested" : "confirmed",
    email,
    token: created.consent_token,
    consent_method: consentMethod,
    note: (formData.get("consentNote") as string | null) || null,
  });

  if (consentMethod === "email" && created.consent_token) {
    const sent = await sendConsentRequestEmail({ to: email, businessName: created.name, token: created.consent_token });
    if (sent) await admin.from("businesses").update({ confirmation_email_sent_at: now }).eq("id", created.id);
  }

  revalidateBusinessPaths();
  redirect("/admin/businesses");
}

/** A self-serve submission (status='pending_review', is_active=false)
 * becomes visible and marked active in one step — the admin approval
 * equivalent of ListingForm's admin-add going straight to active.
 * Blocked until consent is actually confirmed — the whole point of the
 * consent system is that Charlie can't publish a business he hasn't
 * verified wants to be listed, approval queue or not. */
export async function approveBusiness(formData: FormData) {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const { data: business } = await supabase.from("businesses").select("consent_status").eq("id", id).single();
  if (business?.consent_status !== "confirmed") {
    throw new Error("Consent isn't confirmed yet — can't publish this business until it is.");
  }

  const { error } = await supabase.from("businesses").update({ status: "active", is_active: true }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBusinessPaths();
}

/** Charlie recording consent he obtained outside the email flow, for a
 * business that's already been submitted/added — e.g. a self-serve
 * submission where the owner called him instead of clicking the email
 * link. Marks it confirmed immediately so he can go on to approve it. */
export async function recordManualConsent(formData: FormData) {
  const id = formData.get("id") as string;
  const consentMethod = formData.get("consentMethod") as string;
  const note = (formData.get("consentNote") as string | null) || null;
  const now = new Date().toISOString();

  const supabase = await createClient();
  const { data: business } = await supabase.from("businesses").select("email").eq("id", id).single();
  if (!business) throw new Error("Business not found.");

  let consentProofUrl: string | null = null;
  const proofFile = formData.get("consentProof") as File | null;
  if (proofFile && proofFile.size > 0) {
    const ext = proofFile.name.split(".").pop() || "pdf";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("consent-documents").upload(path, proofFile);
    if (uploadError) throw new Error(uploadError.message);
    const { data: urlData } = supabase.storage.from("consent-documents").getPublicUrl(path);
    consentProofUrl = urlData.publicUrl;
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      consent_status: "confirmed",
      consent_confirmed_at: now,
      consent_method: consentMethod,
      consent_note: note,
      ...(consentProofUrl ? { consent_proof_url: consentProofUrl } : {}),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  const admin = createAdminClient();
  await admin.from("business_consent_log").insert({
    business_id: id,
    event_type: "confirmed",
    email: business.email ?? "",
    consent_method: consentMethod,
    note,
  });

  revalidateBusinessPaths();
}

/** For a business still waiting on the emailed link — Charlie nudging
 * them again rather than the owner having to ask for a new one. */
export async function resendConsentEmail(formData: FormData) {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, email, consent_token")
    .eq("id", id)
    .single();
  if (!business?.email || !business.consent_token) {
    throw new Error("This business has no email or consent token on file.");
  }

  const sent = await sendConsentRequestEmail({
    to: business.email,
    businessName: business.name,
    token: business.consent_token,
  });

  const admin = createAdminClient();
  if (sent) {
    await supabase.from("businesses").update({ confirmation_email_sent_at: new Date().toISOString() }).eq("id", id);
  }
  await admin.from("business_consent_log").insert({
    business_id: id,
    event_type: "resubmitted",
    email: business.email,
    token: business.consent_token,
    consent_method: "email",
  });

  revalidateBusinessPaths();
}

export async function toggleBusinessActive(formData: FormData) {
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";

  const supabase = await createClient();
  const { error } = await supabase.from("businesses").update({ is_active: !isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBusinessPaths();
}

export async function toggleBusinessFeatured(formData: FormData) {
  const id = formData.get("id") as string;
  const isFeatured = formData.get("isFeatured") === "true";

  const supabase = await createClient();
  const { error } = await supabase.from("businesses").update({ is_featured: !isFeatured }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBusinessPaths();
}

export async function deleteBusiness(formData: FormData) {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("businesses").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBusinessPaths();
}
