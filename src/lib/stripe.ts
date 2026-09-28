// src/lib/stripe.ts
// Server-only Stripe client for the dealer-posting checkout flow (see
// supabase/migrations/20260928120100_listing_prices_and_payments.sql and
// src/app/checkout/). Never import this from a "use client" component —
// it reads STRIPE_SECRET_KEY, which must never reach the browser.

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
