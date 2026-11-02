// src/app/admin/ads/orders/actions.ts
// Charlie's emailed ad invoices. He fills in who it's for and the lines
// (spot × how many × how long, at the price list or his own price per
// spot); Stripe creates the itemized invoice and emails it with a Pay
// button, and sends the receipt itself once it's paid. The order turns
// into ad spots when Stripe says it's paid (syncOpenAdInvoices) or when
// Charlie marks it paid by hand for a bank transfer or cash.
//
// Service-role writes (ad_orders is admin-write via RLS too, but Stripe
// work and the order have to succeed or fail together), so every action
// checks the caller is an admin first.

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fulfillAdOrder } from "@/lib/ad-orders";
import { AD_INVOICE_LINE_ROWS, AD_MAX_QUANTITY, adLineDescription, adUnitPrice, isAdTerm } from "@/lib/ad-pricing";
import { getAdPriceList } from "@/lib/ad-pricing-queries";
import { AD_PLACEMENTS, type AdPlacement } from "@/lib/ad-slots";
import { isAdminRole } from "@/lib/roles";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) throw new Error("Only an admin can do this.");
}

function revalidateOrders() {
  revalidatePath("/admin/ads/orders");
  revalidatePath("/admin/ads");
}

/** The advertiser's Milhaus account, if they have one under this email —
 * then their spots also show up in their own My ads page and they can
 * add the artwork themselves. */
async function findAccountByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data?.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

export async function createAdInvoice(formData: FormData) {
  await requireAdmin();

  const advertiserName = ((formData.get("advertiserName") as string | null) ?? "").trim();
  const advertiserEmail = ((formData.get("advertiserEmail") as string | null) ?? "").trim();
  const note = ((formData.get("note") as string | null) ?? "").trim() || null;
  const daysUntilDue = Number(formData.get("daysUntilDue") || 14);
  if (!advertiserName) throw new Error("Enter who the invoice is for.");
  if (!/^\S+@\S+\.\S+$/.test(advertiserEmail)) throw new Error("Enter the advertiser's email address.");
  if (!Number.isInteger(daysUntilDue) || daysUntilDue < 1 || daysUntilDue > 90) {
    throw new Error("Days to pay must be between 1 and 90.");
  }

  const priceList = await getAdPriceList();
  const lines: { placement: AdPlacement; days: number; quantity: number; unit_price_eur: number }[] = [];
  for (let i = 0; i < AD_INVOICE_LINE_ROWS; i++) {
    const quantityRaw = formData.get(`quantity${i}`) as string | null;
    if (!quantityRaw) continue;
    const row = `Line ${i + 1}`;
    const placement = formData.get(`placement${i}`) as string;
    const days = Number(formData.get(`days${i}`));
    const quantity = Number(quantityRaw);
    if (!AD_PLACEMENTS.includes(placement as AdPlacement)) throw new Error(`${row}: pick an ad spot.`);
    if (!isAdTerm(days)) throw new Error(`${row}: pick how long.`);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > AD_MAX_QUANTITY) {
      throw new Error(`${row}: how many must be between 1 and ${AD_MAX_QUANTITY}.`);
    }
    const customRaw = formData.get(`unitPrice${i}`) as string | null;
    const unitPrice = customRaw ? Number(customRaw) : adUnitPrice(priceList, placement as AdPlacement, days);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error(`${row}: the price must be 0 or more.`);
    lines.push({ placement: placement as AdPlacement, days, quantity, unit_price_eur: unitPrice });
  }
  if (lines.length === 0) throw new Error("Add at least one line — fill in How many.");
  const totalEur = lines.reduce((sum, line) => sum + line.unit_price_eur * line.quantity, 0);
  if (totalEur <= 0) {
    throw new Error("The total is €0 — set prices in Pricing first, or type a price per spot on each line.");
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("ad_orders")
    .insert({
      user_id: await findAccountByEmail(admin, advertiserEmail),
      advertiser_name: advertiserName,
      advertiser_email: advertiserEmail,
      source: "invoice",
      status: "open",
      note,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  try {
    const { error: linesError } = await admin
      .from("ad_order_lines")
      .insert(lines.map((line) => ({ ...line, order_id: order.id })));
    if (linesError) throw new Error(linesError.message);

    const stripe = getStripe();
    const existing = await stripe.customers.list({ email: advertiserEmail, limit: 1 });
    const customer =
      existing.data[0] ?? (await stripe.customers.create({ email: advertiserEmail, name: advertiserName }));

    const invoice = await stripe.invoices.create({
      customer: customer.id,
      currency: "eur",
      collection_method: "send_invoice",
      days_until_due: daysUntilDue,
      description: note ?? "Advertising on Milhaus",
      metadata: { ad_order_id: order.id },
    });
    for (const line of lines) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        currency: "eur",
        // The whole line as one amount, with the count and per-spot price
        // in the description — reads the same on the emailed invoice.
        amount: Math.round(line.unit_price_eur * line.quantity * 100),
        description: `${adLineDescription(line.placement, line.days, line.quantity)} (${currency.format(line.unit_price_eur)} each)`,
      });
    }
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id!);
    await stripe.invoices.sendInvoice(finalized.id!);

    await admin
      .from("ad_orders")
      .update({ stripe_invoice_id: finalized.id, stripe_invoice_url: finalized.hosted_invoice_url ?? null })
      .eq("id", order.id);
  } catch (stripeError) {
    await admin.from("ad_orders").delete().eq("id", order.id);
    throw stripeError;
  }

  revalidateOrders();
  redirect("/admin/ads/orders");
}

/** Paid outside Stripe (bank transfer, cash) — closes the Stripe invoice
 * as paid so the advertiser isn't chased for it, then creates the spots. */
export async function markAdOrderPaid(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const admin = createAdminClient();
  const { data: order } = await admin.from("ad_orders").select("stripe_invoice_id, status").eq("id", id).single();
  if (!order || order.status !== "open") return;
  if (order.stripe_invoice_id) {
    const invoice = await getStripe().invoices.retrieve(order.stripe_invoice_id as string);
    if (invoice.status === "open") {
      await getStripe().invoices.pay(invoice.id!, { paid_out_of_band: true });
    }
  }
  await fulfillAdOrder(admin, id);
  revalidateOrders();
}

export async function cancelAdOrder(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const admin = createAdminClient();
  const { data: order } = await admin.from("ad_orders").select("stripe_invoice_id, status").eq("id", id).single();
  if (!order || order.status !== "open") return;
  if (order.stripe_invoice_id) {
    const invoice = await getStripe().invoices.retrieve(order.stripe_invoice_id as string);
    if (invoice.status === "open") await getStripe().invoices.voidInvoice(invoice.id!);
  }
  await admin.from("ad_orders").update({ status: "void" }).eq("id", id).eq("status", "open");
  revalidateOrders();
}
