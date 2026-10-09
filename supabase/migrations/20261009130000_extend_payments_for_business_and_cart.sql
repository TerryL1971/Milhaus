-- supabase/migrations/20261009130000_extend_payments_for_business_and_cart.sql
-- listing_payments gets a business_id column alongside listing_id (same
-- polymorphic "exactly one of these two" shape as cart_items) so a paid
-- business submission has somewhere to log its payment, same ledger
-- everything else already uses. A cart checkout inserts one
-- listing_payments row per item being paid for, all sharing the same
-- provider_reference (the one Stripe session id, or PayPal order id,
-- covering the whole cart) — that shared reference is what the success
-- handler uses to flip every paid-for item to pending_review at once.

alter table public.listing_payments
  alter column listing_id drop not null,
  add column business_id uuid references public.businesses(id) on delete cascade,
  add constraint listing_payments_item_check check (
    (listing_id is not null and business_id is null) or
    (listing_id is null and business_id is not null)
  );

create index listing_payments_business_id_idx on public.listing_payments (business_id);
create index listing_payments_provider_reference_idx on public.listing_payments (provider_reference);

-- The existing owner-reads-own policy only checked the listings join —
-- extend it to also cover a business-linked payment row.
drop policy "listing_payments: owner reads own" on public.listing_payments;
create policy "listing_payments: owner reads own" on public.listing_payments
  for select
  using (
    exists (select 1 from public.listings where listings.id = listing_payments.listing_id and listings.owner_id = auth.uid())
    or exists (select 1 from public.businesses where businesses.id = listing_payments.business_id and businesses.owner_id = auth.uid())
  );
