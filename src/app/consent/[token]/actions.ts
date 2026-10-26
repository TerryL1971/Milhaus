// src/app/consent/[token]/actions.ts
// Confirming (or declining) a business listing via the emailed consent
// link. Whoever clicks this has no Milhaus account — there's no
// session to check RLS against — so every write here goes through the
// service-role admin client, the same way settleCartPayment does for
// its own no-signed-in-user case.

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { tryActivateBusiness } from "@/lib/businesses-queries";
import { createAdminClient } from "@/lib/supabase/admin";

async function getRequestIp(): Promise<string | null> {
  const h = await headers();
  // Vercel (and most proxies) set this; the first entry is the original
  // client, later ones are intermediate proxies.
  const forwarded = h.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : null;
}

export async function confirmConsent(formData: FormData) {
  const token = formData.get("token") as string;
  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, name, email, consent_status")
    .eq("consent_token", token)
    .maybeSingle();

  if (!business || business.consent_status === "revoked") return;

  const ip = await getRequestIp();

  await admin
    .from("businesses")
    .update({ consent_status: "confirmed", consent_confirmed_at: new Date().toISOString(), confirmation_ip: ip })
    .eq("id", business.id);

  await admin.from("business_consent_log").insert({
    business_id: business.id,
    business_name: business.name,
    event_type: "confirmed",
    email: business.email ?? "",
    ip_address: ip,
    token,
  });

  // Consent is the one thing standing between a paid business listing and
  // going live automatically (see tryActivateBusiness) — if payment
  // already cleared, this is what actually publishes it.
  await tryActivateBusiness(business.id);

  revalidatePath(`/consent/${token}`);
  revalidatePath("/admin/businesses");
  revalidatePath("/services");
  revalidatePath("/");
}

export async function declineConsent(formData: FormData) {
  const token = formData.get("token") as string;
  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, name, email")
    .eq("consent_token", token)
    .maybeSingle();

  if (!business) return;

  const ip = await getRequestIp();

  await admin.from("businesses").update({ consent_status: "revoked", is_active: false }).eq("id", business.id);

  await admin.from("business_consent_log").insert({
    business_id: business.id,
    business_name: business.name,
    event_type: "revoked",
    email: business.email ?? "",
    ip_address: ip,
    token,
    note: "Declined via the confirmation link — did not recognize or did not authorize this listing.",
  });

  revalidatePath(`/consent/${token}`);
  revalidatePath("/admin/businesses");
  revalidatePath("/services");
  revalidatePath("/");
}
