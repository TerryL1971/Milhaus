// src/lib/invoice-email.ts
// Builds and sends the "you paid, here's your invoice" email after a
// cart checkout settles (see settleCartPayment in src/app/cart/actions.ts)
// — a posting-fee receipt, not anything to do with what a listing itself
// sells for.

import { sendEmail } from "@/lib/email";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

export type InvoiceLineItem = {
  name: string;
  priceEur: number;
};

type SendInvoiceEmailInput = {
  to: string;
  adminBcc?: string[];
  buyerName: string;
  invoiceNumber: string;
  provider: "stripe" | "paypal";
  items: InvoiceLineItem[];
};

export async function sendInvoiceEmail({
  to,
  adminBcc,
  buyerName,
  invoiceNumber,
  provider,
  items,
}: SendInvoiceEmailInput): Promise<void> {
  const total = items.reduce((sum, item) => sum + item.priceEur, 0);
  const date = dateFormatter.format(new Date());
  const paymentMethod = provider === "stripe" ? "Card" : "PayPal";

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E6E1D2;color:#22201B;">${escapeHtml(item.name)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #E6E1D2;color:#22201B;text-align:right;white-space:nowrap;">${currencyFormatter.format(item.priceEur)}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="background:#F0EDE4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#FBFAF6;border-radius:8px;padding:32px;">
        <h1 style="margin:0 0 4px;font-size:22px;color:#1B2A3A;">Milhaus</h1>
        <p style="margin:0 0 24px;color:#2C4053;font-size:14px;">Posting fee receipt</p>

        <p style="margin:0 0 4px;color:#22201B;">Hi ${escapeHtml(buyerName)},</p>
        <p style="margin:0 0 24px;color:#22201B;">
          Thanks for your payment — here's your receipt. Everything below has been submitted for
          review and you'll hear from us, usually the same day.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
          <tbody>${rows}</tbody>
        </table>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;font-weight:600;color:#1B2A3A;">Total</td>
            <td style="padding:10px 0;font-weight:600;color:#1B2A3A;text-align:right;">${currencyFormatter.format(total)}</td>
          </tr>
        </table>

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E6E1D2;font-size:13px;color:#2C4053;">
          <p style="margin:0 0 4px;">Invoice #${escapeHtml(invoiceNumber)}</p>
          <p style="margin:0 0 4px;">Date: ${date}</p>
          <p style="margin:0;">Paid via: ${paymentMethod}</p>
        </div>
      </div>
    </div>`;

  await sendEmail({
    to,
    bcc: adminBcc,
    subject: `Milhaus receipt — invoice #${invoiceNumber}`,
    html,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
