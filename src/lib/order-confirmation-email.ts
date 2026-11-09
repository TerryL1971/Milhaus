// src/lib/order-confirmation-email.ts
// Milhaus's own order confirmation, sent once a cart payment settles
// (src/app/cart/actions.ts, settleCartPayment). Added 2026-11-09 after
// the legal review: § 312f(2) BGB requires the trader to confirm a
// consumer contract on a durable medium — including the withdrawal
// notice and, where given, the request to start straight away — and
// Stripe's own receipt contains neither. A link to the website isn't
// a durable medium, so the full notice is written into the email.
// Best-effort like every email here: a Resend failure never undoes a
// payment.

import { sendEmail } from "@/lib/email";
import { emailFrame, escapeHtml } from "@/lib/escape-html";
import { PUBLIC_SITE_URL, SITE_URL } from "@/lib/site-url";
import { IMMEDIATE_START_CONSENT, TRADER, withdrawalNotice } from "@/lib/withdrawal-notice";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

export async function sendOrderConfirmation({
  to,
  items,
  orderedAt,
  reference,
  immediateStartRequested,
}: {
  to: string;
  items: { name: string; amountEur: number }[];
  orderedAt: Date;
  reference: string;
  immediateStartRequested: boolean;
}): Promise<boolean> {
  const total = items.reduce((sum, item) => sum + item.amountEur, 0);
  const when = orderedAt.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Berlin" });
  const notice = withdrawalNotice("en", `${PUBLIC_SITE_URL}/withdraw`);

  const lines = items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-top:1px solid #E6E1D2;">${escapeHtml(item.name)}<br><span style="font-size:12px;color:#2C345E;">Listings run for 30 days; ad spots for the term shown</span></td>
        <td style="padding:8px 0;border-top:1px solid #E6E1D2;text-align:right;white-space:nowrap;">${currency.format(item.amountEur)}</td>
      </tr>`,
    )
    .join("");

  const noticeHtml = notice.sections
    .map(
      (section) =>
        `<p style="margin:16px 0 6px;font-weight:600;color:#101842;">${escapeHtml(section.heading)}</p>${section.paragraphs
          .map((paragraph) => `<p style="margin:0 0 8px;">${escapeHtml(paragraph)}</p>`)
          .join("")}`,
    )
    .join("");

  const formHtml = `<p style="margin:16px 0 6px;font-weight:600;color:#101842;">${escapeHtml(notice.formTitle)}</p>
    <p style="margin:0 0 6px;">${escapeHtml(notice.formIntro)}</p>
    ${notice.formLines.map((line) => `<p style="margin:0 0 4px;">— ${escapeHtml(line)}</p>`).join("")}`;

  const html = emailFrame(
    "Your order confirmation",
    `<p style="margin:0 0 16px;">Thank you for your order. This is your contract confirmation.</p>
    <p style="margin:0 0 8px;font-size:12px;color:#2C345E;">Ordered ${escapeHtml(when)} (German time) · Reference ${escapeHtml(reference)}</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 8px;">${lines}
      <tr><td style="padding:8px 0;border-top:2px solid #101842;font-weight:600;">Total paid</td>
      <td style="padding:8px 0;border-top:2px solid #101842;text-align:right;font-weight:600;">${currency.format(total)}</td></tr>
    </table>
    ${
      immediateStartRequested
        ? `<p style="margin:16px 0 6px;font-weight:600;color:#101842;">Your request to start right away</p>
           <p style="margin:0 0 8px;">When ordering you confirmed: &ldquo;${escapeHtml(IMMEDIATE_START_CONSENT)}&rdquo;</p>`
        : ""
    }
    <p style="margin:16px 0 8px;">Terms and Conditions: <a href="${SITE_URL}/terms" style="color:#545A41;">${PUBLIC_SITE_URL}/terms</a></p>
    <p style="margin:0 0 8px;">To withdraw, use <a href="${SITE_URL}/withdraw" style="color:#545A41;">${PUBLIC_SITE_URL}/withdraw</a> or reply to this email.</p>
    <div style="margin-top:24px;padding-top:8px;border-top:1px solid #E6E1D2;">
      <p style="margin:0;font-size:16px;font-weight:600;color:#101842;">${escapeHtml(notice.title)}</p>
      ${noticeHtml}
      ${formHtml}
    </div>
    <p style="margin:24px 0 0;font-size:12px;color:#2C345E;">${escapeHtml(
      `${TRADER.name}, ${TRADER.tradingAs}, ${TRADER.street}, ${TRADER.city}, ${TRADER.country.en} · ${TRADER.email} · ${TRADER.phone}`,
    )}</p>`,
  );

  return sendEmail({ to, subject: "Your Milhaus order confirmation", html, replyTo: TRADER.email });
}
