// src/lib/service-request-actions.ts
// Sends the Milhaus Service pop-up's form (Charlie's design, 2026-11-09):
// the boxes ticked plus an email address. Stored first in
// service_requests (supabase/migrations/20261109210000_service_popup.sql)
// so nothing is lost if email is down, then emailed to info@milhaus.de
// with Reply-To set to the visitor, so Charlie answers with his normal
// Reply button. Nothing is emailed to the visitor — an open form that
// mails any address typed into it would be a gift to spammers. Returns a
// result instead of throwing, so the pop-up shows the outcome in place.

"use server";

import { getLocale } from "next-intl/server";
import { sendEmail } from "@/lib/email";
import { emailFrame, escapeHtml } from "@/lib/escape-html";
import { SERVICE_INTEREST_ADMIN_LABELS, isServiceInterest } from "@/lib/milhaus-service";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TRADER } from "@/lib/withdrawal-notice";

export type ServiceRequestResult = { ok: true } | { ok: false; error: string } | null;

export async function sendServiceRequest(
  _previous: ServiceRequestResult,
  formData: FormData,
): Promise<ServiceRequestResult> {
  const de = (await getLocale()) === "de";

  // Hidden field a person never fills in — see contact/actions.ts.
  if (String(formData.get("website") ?? "").trim() !== "") return { ok: true };

  const email = String(formData.get("email") ?? "").trim().slice(0, 320);
  const interests = [...new Set(formData.getAll("interests").filter(isServiceInterest))];
  const page = String(formData.get("page") ?? "").trim().slice(0, 500) || null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: de ? "Bitte gib eine gültige E-Mail-Adresse ein." : "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await createAdminClient()
    .from("service_requests")
    .insert({ user_id: user?.id ?? null, email, interests, locale: de ? "de" : "en", page });
  if (error) {
    console.error("sendServiceRequest insert failed:", error.message);
    return {
      ok: false,
      error: de
        ? `Das hat leider nicht geklappt. Schreib uns bitte direkt an ${TRADER.email}.`
        : `That didn't go through. Please email us at ${TRADER.email} instead.`,
    };
  }

  const wants = interests.length
    ? interests.map((key) => SERVICE_INTEREST_ADMIN_LABELS[key]).join(", ")
    : "Nothing ticked";
  // Best-effort: the request is already saved in Admin → Messages.
  await sendEmail({
    to: TRADER.email,
    subject: `Milhaus Service request: ${wants}`,
    replyTo: email,
    html: emailFrame(
      "New Milhaus Service request",
      `<p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p style="margin:0 0 8px;"><strong>Wants help with:</strong> ${escapeHtml(wants)}</p>
      ${page ? `<p style="margin:0 0 8px;"><strong>Page:</strong> ${escapeHtml(page)}</p>` : ""}
      <p style="margin:0 0 16px;"><strong>Language:</strong> ${de ? "German" : "English"}</p>
      <p style="margin:0 0 16px;font-size:13px;color:#2C345E;">Press Reply to answer — it goes straight to ${escapeHtml(email)}.</p>
      <a href="${SITE_URL}/admin/messages" style="display:inline-block;background:#7B101A;color:#FBFAF6;padding:12px 24px;border-radius:6px;font-weight:600;text-decoration:none;">Open Admin → Messages</a>`,
    ),
  });

  return { ok: true };
}
