// src/lib/ad-orders-queries.ts
// Reads for ad orders as the signed-in caller (RLS: a buyer sees their
// own, an admin sees all) — the cart's line names, /my-ads and
// /admin/ads/orders. The writes all live in src/lib/ad-orders.ts and
// the server actions, through the service-role client.

import { adLineDescription } from "@/lib/ad-pricing";
import type { AdPlacement } from "@/lib/ad-slots";
import { createClient } from "@/lib/supabase/server";

export interface AdOrderLine {
  id: string;
  placement: AdPlacement;
  days: number;
  quantity: number;
  unitPriceEur: number;
}

export interface AdOrder {
  id: string;
  userId: string | null;
  advertiserName: string;
  advertiserEmail: string;
  source: "cart" | "invoice";
  status: "cart" | "open" | "paid" | "void";
  stripeInvoiceUrl: string | null;
  note: string | null;
  createdAt: string;
  paidAt: string | null;
  lines: AdOrderLine[];
  totalEur: number;
}

function mapOrder(row: Record<string, unknown>): AdOrder {
  const lines = ((row.ad_order_lines as Record<string, unknown>[] | null) ?? []).map((line) => ({
    id: line.id as string,
    placement: line.placement as AdPlacement,
    days: Number(line.days),
    quantity: Number(line.quantity),
    unitPriceEur: Number(line.unit_price_eur),
  }));
  return {
    id: row.id as string,
    userId: (row.user_id as string | null) ?? null,
    advertiserName: row.advertiser_name as string,
    advertiserEmail: row.advertiser_email as string,
    source: row.source as AdOrder["source"],
    status: row.status as AdOrder["status"],
    stripeInvoiceUrl: (row.stripe_invoice_url as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    createdAt: row.created_at as string,
    paidAt: (row.paid_at as string | null) ?? null,
    lines,
    totalEur: lines.reduce((sum, line) => sum + line.unitPriceEur * line.quantity, 0),
  };
}

const ORDER_SELECT = "*, ad_order_lines(id, placement, days, quantity, unit_price_eur)";

/** "Site banner × 10 · 90 days" per cart ad order, keyed by order id. */
export async function getAdOrderNames(orderIds: string[]): Promise<Map<string, string>> {
  if (orderIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase.from("ad_orders").select(ORDER_SELECT).in("id", orderIds);
  return new Map(
    (data ?? []).map(mapOrder).map((order) => [
      order.id,
      `Advertising: ${order.lines.map((line) => adLineDescription(line.placement, line.days, line.quantity)).join(", ")}`,
    ]),
  );
}

/** Every order, newest first — /admin/ads/orders. */
export async function getAllAdOrders(): Promise<AdOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_orders")
    .select(ORDER_SELECT)
    .neq("status", "cart")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getAllAdOrders failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapOrder);
}
