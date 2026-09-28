-- supabase/migrations/20260928120000_add_dealer_role_and_paid_listings.sql
-- First pass at charging for listings — Charlie's ask, modeled on bookoo's
-- own "by owner is free, by agent/dealer costs money" split rather than a
-- flat fee on everyone: a PCS family listing their own car or couch stays
-- free, same as today. Only a new `dealer` role (Charlie promotes an
-- account to it by hand, same admin/users flow already used for
-- housing_office_partner) triggers a price.
--
-- No payment provider is wired up yet (Stripe/PayPal test-mode keys are
-- still pending) — this migration only adds the shape: a role to gate on,
-- a price per listing type Charlie can edit himself, and a ledger of
-- payment attempts once checkout exists. Every price defaults to 0
-- (free) until Charlie sets real numbers, so nothing is accidentally
-- gated shut by this migration landing.

alter type public.profile_role add value 'dealer';
