// src/app/[locale]/withdraw/actions.ts
// The online withdrawal function (§ 356a BGB, compulsory for consumer
// contracts concluded online from 19 June 2026) — added 2026-11-09
// after the legal review. The law asks for three things, all here:
//   1. the consumer gives their name, identifies the contract and gives
//      an email address for the confirmation;
//   2. they confirm with a button labelled "Widerruf bestätigen"
//      ("Confirm withdrawal" in English);
//   3. we confirm receipt — its content, date and time — on a durable
//      medium straight away (the email below, plus the on-screen
//      receipt at /withdraw/received).
// Every request is stored first (withdrawal_requests, see
// supabase/migrations/20261109120000_add_legal_compliance.sql) so it
// survives an email outage, and Charlie is emailed too. He handles the
// refund himself in Stripe and marks it done at /admin/withdrawals.
// No sign-in required: the law doesn't allow making withdrawal harder
// than buying, and someone may have lost access to their account.

"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { sendEmail } from "@/lib/email";
import { emailFrame, escapeHtml } from "@/lib/escape-html";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TRADER } from "@/lib/withdrawal-notice";

export async function submitWithdrawal(formData: FormData) {
  const locale = await getLocale();
  const de = locale === "de";

  // Hidden field a person never fills in — a bot that fills every field
  // gets the normal "received" page but nothing is stored or sent.
  if (String(formData.get("website") ?? "").trim() !== "") {
    redirect({ href: "/withdraw/received", locale });
  }

  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const email = String(formData.get("email") ?? "").trim().slice(0, 320);
  const contractDetails = String(formData.get("contractDetails") ?? "").trim().slice(0, 2000);
  const orderedOnRaw = String(formData.get("orderedOn") ?? "").trim();
  const orderedOn = /^\d{4}-\d{2}-\d{2}$/.test(orderedOnRaw) ? orderedOnRaw : null;

  if (!name || !contractDetails || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(
      de
        ? "Bitte geben Sie Ihren Namen, eine gültige E-Mail-Adresse und den Vertrag an, den Sie widerrufen möchten."
        : "Please give your name, a valid email address and the contract you want to withdraw from.",
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: request, error } = await admin
    .from("withdrawal_requests")
    .insert({ user_id: user?.id ?? null, name, email, contract_details: contractDetails, ordered_on: orderedOn })
    .select("id, created_at")
    .single();
  if (error || !request) {
    throw new Error(
      de
        ? `Ihr Widerruf konnte nicht gespeichert werden. Bitte senden Sie ihn per E-Mail an ${TRADER.email}.`
        : `Your withdrawal couldn't be saved. Please email it to ${TRADER.email} instead.`,
    );
  }

  const receivedAt = new Date(request.created_at as string);
  const when = receivedAt.toLocaleString(de ? "de-DE" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  });

  const rows = [
    [de ? "Name" : "Name", name],
    [de ? "E-Mail" : "Email", email],
    [de ? "Vertrag" : "Contract", contractDetails],
    ...(orderedOn ? [[de ? "Bestellt am" : "Ordered on", orderedOn]] : []),
    [de ? "Eingegangen am" : "Received", `${when} (${de ? "deutsche Zeit" : "German time"})`],
    [de ? "Referenz" : "Reference", request.id as string],
  ];
  const table = `<table style="width:100%;border-collapse:collapse;margin:0 0 16px;">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 8px 6px 0;vertical-align:top;color:#2C345E;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;white-space:pre-line;">${escapeHtml(value)}</td></tr>`,
    )
    .join("")}</table>`;

  const confirmation = emailFrame(
    de ? "Eingangsbestätigung Ihres Widerrufs" : "We've received your withdrawal",
    `<p style="margin:0 0 16px;">${
      de
        ? `Guten Tag ${escapeHtml(name)}, wir bestätigen den Eingang Ihres Widerrufs mit folgendem Inhalt:`
        : `Hello ${escapeHtml(name)}, this confirms we have received your withdrawal, as follows:`
    }</p>
    ${table}
    <p style="margin:0 0 16px;">${
      de
        ? "Wir erstatten Ihnen Ihre Zahlung unverzüglich, spätestens binnen 14 Tagen, über dasselbe Zahlungsmittel, das Sie verwendet haben."
        : "We'll refund your payment without undue delay, and within 14 days at the latest, to the payment method you used."
    }</p>
    <p style="margin:0;font-size:12px;color:#2C345E;">${escapeHtml(
      `${TRADER.name}, ${TRADER.tradingAs}, ${TRADER.street}, ${TRADER.city} · ${TRADER.email}`,
    )}</p>`,
  );

  const sent = await sendEmail({
    to: email,
    subject: de ? "Eingangsbestätigung Ihres Widerrufs — Milhaus" : "Your withdrawal has been received — Milhaus",
    html: confirmation,
    replyTo: TRADER.email,
  });
  if (sent) await admin.from("withdrawal_requests").update({ confirmation_sent: true }).eq("id", request.id);

  await sendEmail({
    to: TRADER.email,
    subject: `Withdrawal request from ${name}`,
    html: emailFrame(
      "A customer has withdrawn from a contract",
      `<p style="margin:0 0 16px;">Refund them within 14 days (Stripe → Payments → Refund), then mark it handled.</p>
      ${table}
      <a href="${SITE_URL}/admin/withdrawals" style="display:inline-block;background:#7B101A;color:#FBFAF6;padding:12px 24px;border-radius:6px;font-weight:600;text-decoration:none;">Open withdrawal requests</a>`,
    ),
    replyTo: email,
  });

  redirect({ href: { pathname: "/withdraw/received", query: { id: request.id as string } }, locale });
}
