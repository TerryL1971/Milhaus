// src/lib/stripe.ts
// Server-only Stripe client for the dealer-posting checkout flow (see
// supabase/migrations/20260928120100_listing_prices_and_payments.sql and
// src/app/checkout/). Never import this from a "use client" component —
// it reads STRIPE_SECRET_KEY, which must never reach the browser.
//
// Lazily constructed on purpose, not `export const stripe = new Stripe(...)`
// at module scope: Next.js imports every route's module graph during
// "collecting page data" at build time, regardless of whether that route
// ends up static or dynamic. The Stripe SDK throws immediately if
// constructed with an empty API key, which turned a missing
// STRIPE_SECRET_KEY (e.g. not yet added to a given deployment target)
// into a build failure for the entire site instead of a runtime error on
// just the checkout routes that actually need it.

import Stripe from "stripe";

let cachedClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!cachedClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY isn't set — dealer checkout can't run without it.");
    }
    cachedClient = new Stripe(apiKey);
  }
  return cachedClient;
}
