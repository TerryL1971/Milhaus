// src/lib/ad-pricing-queries.ts
// Server-side read of the ad price list — split from ad-pricing.ts for
// the same reason as ad-slots-queries.ts (keeps @/lib/supabase/server out
// of anything a client component might import). The three tables are
// public-read, so the caller's own session is enough.

import { AD_BASE_TERMS, type AdBaseTerm, type AdPriceList } from "@/lib/ad-pricing";
import { AD_PLACEMENTS, type AdPlacement } from "@/lib/ad-slots";
import { createClient } from "@/lib/supabase/server";

export async function getAdPriceList(): Promise<AdPriceList> {
  const supabase = await createClient();
  const [prices, discounts, overrides] = await Promise.all([
    supabase.from("ad_prices").select("placement, monthly_eur"),
    supabase.from("ad_term_discounts").select("days, discount_pct"),
    supabase.from("ad_price_overrides").select("placement, days, price_eur"),
  ]);
  for (const result of [prices, discounts, overrides]) {
    if (result.error) console.error("getAdPriceList failed:", result.error.message);
  }

  const list: AdPriceList = {
    monthlyEur: Object.fromEntries(AD_PLACEMENTS.map((p) => [p, 0])) as Record<AdPlacement, number>,
    discountPct: Object.fromEntries(AD_BASE_TERMS.map((d) => [d, 0])) as Record<AdBaseTerm, number>,
    overrides: {},
  };
  for (const row of prices.data ?? []) list.monthlyEur[row.placement as AdPlacement] = Number(row.monthly_eur);
  for (const row of discounts.data ?? []) list.discountPct[row.days as AdBaseTerm] = Number(row.discount_pct);
  for (const row of overrides.data ?? []) {
    const placement = row.placement as AdPlacement;
    list.overrides[placement] = { ...list.overrides[placement], [row.days as AdBaseTerm]: Number(row.price_eur) };
  }
  return list;
}
