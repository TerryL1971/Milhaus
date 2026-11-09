// src/app/[locale]/contact/actions.ts
// Sends the /contact form (Charlie's ask, 2026-11-09). The message is
// stored first (contact_messages — see
// supabase/migrations/20261109180000_add_popup_ad_and_contact.sql) so
// it can't be lost if email is down, then emailed to info@milhaus.de
// with Reply-To set to the visitor, so Charlie answers with his normal
// Reply button. Nothing is emailed to the visitor: an open form that
// sends mail to any address typed into it would be a gift to spammers.
// Returns a result instead of throwing, so the form can show the error
// on the page (no pop-ups, no error screen).

"use server";

import { getLocale } from "next-intl/server";
import { CONTACT_TOPIC_ADMIN_LABELS, isContactTopic } from "@/lib/contact-topics";
import { sendEmail } from "@/lib/email";
import { emailFrame, escapeHtml } from "@/lib/escape-html";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TRADER } from "@/lib/withdrawal-notice";

export type ContactResult = { ok: true } | { ok: false; error: string } | null;

export async function sendContactMessage(_previous: ContactResult, formData: FormData): Promise<ContactResult> {
  const de = (await getLocale()) === "de";

  // Hidden field a person never fills in — a bot that fills every field
  // is told "sent" but nothing is stored or emailed.
  if (String(formData.get("website") ?? "").trim() !== "") return { ok: true };

  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const email = String(formData.get("email") ?? "").trim().slice(0, 320);
  const topic = formData.get("topic");
  const message = String(formData.get("message") ?? "").trim().slice(0, 5000);
  const page = String(formData.get("page") ?? "").trim().slice(0, 500) || null;

  if (!name || !message || !isContactTopic(topic) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false,
      error: de
        ? "Bitte geben Sie Ihren Namen, eine gültige E-Mail-Adresse, ein Thema und Ihre Nachricht an."
        : "Please give your name, a valid email address, a topic and your message.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { error } = await admin
    .from("contact_messages")
    .insert({ user_id: user?.id ?? null, name, email, topic, message, page });
  if (error) {
    console.error("sendContactMessage insert failed:", error.message);
    return {
      ok: false,
      error: de
        ? `Ihre Nachricht konnte nicht gesendet werden. Bitte schreiben Sie uns direkt an ${TRADER.email}.`
        : `Your message couldn't be sent. Please email us at ${TRADER.email} instead.`,
    };
  }

  const rows: [string, string][] = [
    ["From", `${name} <${email}>`],
    ["Topic", CONTACT_TOPIC_ADMIN_LABELS[topic]],
    ...(page ? ([["Page", page]] as [string, string][]) : []),
    ["Language", de ? "German" : "English"],
  ];
  // Best-effort: the message is already saved in Admin → Messages.
  await sendEmail({
    to: TRADER.email,
    subject: `Contact form: ${CONTACT_TOPIC_ADMIN_LABELS[topic]} — ${name}`,
    replyTo: email,
    html: emailFrame(
      "New message from the Contact page",
      `<table style="width:100%;border-collapse:collapse;margin:0 0 16px;">${rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:4px 8px 4px 0;color:#2C345E;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`,
        )
        .join("")}</table>
      <p style="margin:0 0 20px;white-space:pre-line;">${escapeHtml(message)}</p>
      <p style="margin:0 0 16px;font-size:13px;color:#2C345E;">Press Reply to answer — it goes straight to ${escapeHtml(email)}.</p>
      <a href="${SITE_URL}/admin/messages" style="display:inline-block;background:#7B101A;color:#FBFAF6;padding:12px 24px;border-radius:6px;font-weight:600;text-decoration:none;">Open Admin → Messages</a>`,
    ),
  });

  return { ok: true };
}
