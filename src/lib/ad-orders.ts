// src/lib/ad-orders.ts
// What happens once an ad order is paid, however it was paid — the
// self-serve cart (settleCartPayment in src/app/cart/actions.ts), an
// emailed Stripe invoice (syncOpenAdInvoices, run by the daily cron and
// whenever Charlie opens /admin/ads/orders), or Charlie marking one paid
// by hand (bank transfer, cash). Server-only: takes the service-role
// client, since ad_orders and ad_slots are admin-write tables.
//
// Paying creates one hidden ad_slots row per spot bought. A self-serve
// buyer adds the artwork themselves at /my-ads; an invoiced advertiser
// replies to the "payment received" email with theirs and Charlie adds
// it in /admin/ads. Either way the spot's clock only starts when it goes
// live (the ad_slots_set_ends_at trigger).

import {
  AD_PLACEMENT_SHORT_LABELS,
  AD_PLACEMENT_SIZES,
  ADVERTISING_CONTACT_EMAIL,
  type AdPlacement,
} from "@/lib/ad-slots";
import { adLineDescription } from "@/lib/ad-pricing";
import { sendEmail } from "@/lib/email";
import { getStripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site-url";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Idempotent — only the call that actually moves the order to paid
 * creates spots, so a refreshed success page or a cron run racing
 * Charlie's page load can't double them. */
export async function fulfillAdOrder(admin: AdminClient, orderId: string): Promise<boolean> {
  const { data: order, error } = await admin
    .from("ad_orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .in("status", ["cart", "open"])
    .select("id, user_id, advertiser_name, advertiser_email, source")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) return false;

  const { data: lines, error: linesError } = await admin
    .from("ad_order_lines")
    .select("id, placement, days, quantity")
    .eq("order_id", orderId);
  if (linesError) throw new Error(linesError.message);

  const spots = (lines ?? []).flatMap((line) =>
    Array.from({ length: line.quantity as number }, () => ({
      placement: line.placement,
      advertiser_name: order.advertiser_name,
      owner_id: order.user_id,
      order_line_id: line.id,
      duration_days: line.days,
      is_active: false,
      link_url: null,
    })),
  );
  if (spots.length > 0) {
    const { error: insertError } = await admin.from("ad_slots").insert(spots);
    if (insertError) throw new Error(insertError.message);
  }

  await sendPaidEmail({
    to: order.advertiser_email as string,
    name: order.advertiser_name as string,
    selfServe: order.source === "cart" && Boolean(order.user_id),
    lines: (lines ?? []).map((line) => ({
      placement: line.placement as AdPlacement,
      description: adLineDescription(line.placement as AdPlacement, line.days as number, line.quantity as number),
    })),
  });
  return true;
}

/** Checks every unpaid emailed invoice with Stripe and settles the ones
 * that have been paid since. Cheap enough to run on page load: Charlie
 * will have a handful of open invoices at a time, not hundreds. */
export async function syncOpenAdInvoices(admin: AdminClient): Promise<number> {
  const { data: open } = await admin
    .from("ad_orders")
    .select("id, stripe_invoice_id")
    .eq("status", "open")
    .not("stripe_invoice_id", "is", null);
  if (!open || open.length === 0) return 0;

  let settled = 0;
  for (const order of open) {
    try {
      const invoice = await getStripe().invoices.retrieve(order.stripe_invoice_id as string);
      if (invoice.status === "paid") {
        if (await fulfillAdOrder(admin, order.id as string)) settled += 1;
      } else if (invoice.status === "void" || invoice.status === "uncollectible") {
        await admin.from("ad_orders").update({ status: "void" }).eq("id", order.id).eq("status", "open");
      }
    } catch (error) {
      console.error(`syncOpenAdInvoices: couldn't check order ${order.id}:`, error);
    }
  }
  return settled;
}

function sendPaidEmail({
  to,
  name,
  selfServe,
  lines,
}: {
  to: string;
  name: string;
  selfServe: boolean;
  lines: { placement: AdPlacement; description: string }[];
}) {
  const placements = [...new Set(lines.map((line) => line.placement))];
  const nextStep = selfServe
    ? `<p style="margin:0 0 24px;color:#22201B;">
         Add your artwork and the web address each ad should link to from <strong>My ads</strong>.
         Each spot goes live as soon as you save it, and its time only starts counting from then.
       </p>
       <a href="${SITE_URL}/my-ads" style="display:inline-block;background:#C0392B;color:#FBFAF6;padding:12px 24px;border-radius:6px;font-weight:600;text-decoration:none;">
         Add my artwork
       </a>`
    : `<p style="margin:0 0 16px;color:#22201B;">
         To put them live, just <strong>reply to this email</strong> with your artwork and the web
         address each ad should link to. Each spot's time only starts counting once it's live.
       </p>`;

  const html = `
    <div style="background:#F0EDE4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:520px;margin:0 auto;background:#FBFAF6;border-radius:8px;padding:32px;">
        <h1 style="margin:0 0 4px;font-size:22px;color:#1B2A3A;">Milhaus</h1>
        <p style="margin:0 0 24px;color:#2C4053;font-size:14px;">Payment received — thank you, ${escapeHtml(name)}</p>

        <p style="margin:0 0 8px;color:#22201B;">Your ad spots:</p>
        <ul style="margin:0 0 16px;padding-left:20px;color:#22201B;">
          ${lines.map((line) => `<li>${escapeHtml(line.description)}</li>`).join("")}
        </ul>

        ${nextStep}

        <p style="margin:24px 0 8px;font-size:12px;color:#2C4053;">Artwork sizes:</p>
        ${placements
          .map(
            (placement) =>
              `<p style="margin:0 0 6px;font-size:12px;color:#2C4053;"><strong>${AD_PLACEMENT_SHORT_LABELS[placement]}:</strong> ${escapeHtml(AD_PLACEMENT_SIZES[placement])}</p>`,
          )
          .join("")}
      </div>
    </div>`;

  return sendEmail({
    to,
    subject: "Your Milhaus ad spots are ready",
    html,
    replyTo: ADVERTISING_CONTACT_EMAIL,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
