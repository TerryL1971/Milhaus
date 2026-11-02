// src/lib/ad-pricing.ts
// The ad price list's maths — pure, so /advertise, the cart, the admin
// invoice builder and the Stripe line descriptions all agree on what a
// spot costs (see supabase/migrations/20261103120000_add_ad_orders.sql).
//
// Charlie sets one 30-day price per placement, a discount % for 90
// days / 6 months / 1 year, and can type a fixed price for any
// placement + term instead. Anything over a year is a whole number of
// years at the 1-year price.

import { AD_PLACEMENT_SHORT_LABELS, type AdPlacement } from "@/lib/ad-slots";

export const AD_BASE_TERMS = [30, 90, 180, 365] as const;
export type AdBaseTerm = (typeof AD_BASE_TERMS)[number];

const TERM_MONTHS: Record<AdBaseTerm, number> = { 30: 1, 90: 3, 180: 6, 365: 12 };

export const AD_MAX_YEARS = 5;

/** Every term a buyer can pick: 30 / 90 / 180 days, then 1–5 years. */
export const AD_TERM_OPTIONS: number[] = [
  30,
  90,
  180,
  ...Array.from({ length: AD_MAX_YEARS }, (_, i) => (i + 1) * 365),
];

export const AD_MAX_QUANTITY = 100;

/** How many line rows Charlie's new-invoice form shows. */
export const AD_INVOICE_LINE_ROWS = 6;

export interface AdPriceList {
  monthlyEur: Record<AdPlacement, number>;
  discountPct: Record<AdBaseTerm, number>;
  overrides: Partial<Record<AdPlacement, Partial<Record<AdBaseTerm, number>>>>;
}

export function isAdTerm(days: number): boolean {
  return AD_TERM_OPTIONS.includes(days);
}

export function adTermLabel(days: number): string {
  if (days >= 365) {
    const years = days / 365;
    return years === 1 ? "1 year" : `${years} years`;
  }
  return days === 180 ? "6 months" : `${days} days`;
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/** What the maths alone gives, ignoring any fixed price Charlie typed —
 * shown next to his override field so he can see what he's replacing. */
export function calculatedTermPrice(list: AdPriceList, placement: AdPlacement, term: AdBaseTerm): number {
  return roundCents(list.monthlyEur[placement] * TERM_MONTHS[term] * (1 - list.discountPct[term] / 100));
}

export function termPrice(list: AdPriceList, placement: AdPlacement, term: AdBaseTerm): number {
  return list.overrides[placement]?.[term] ?? calculatedTermPrice(list, placement, term);
}

/** The price of one spot for `days` (any of AD_TERM_OPTIONS). */
export function adUnitPrice(list: AdPriceList, placement: AdPlacement, days: number): number {
  if (days >= 365) return roundCents((days / 365) * termPrice(list, placement, 365));
  return termPrice(list, placement, days as AdBaseTerm);
}

/** "Site banner × 10 · 90 days" — one order line, everywhere it's shown. */
export function adLineDescription(placement: AdPlacement, days: number, quantity: number): string {
  return `${AD_PLACEMENT_SHORT_LABELS[placement]} × ${quantity} · ${adTermLabel(days)}`;
}
