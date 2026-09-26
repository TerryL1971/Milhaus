-- supabase/migrations/20260927000000_add_service_listing_type.sql
-- Fourth listing type: Services (a mechanic, a moving company, tutoring —
-- no physical item, per docs/marketplace-vision.md). Same split-table
-- pattern as rental_details/car_details/product_details from
-- 20260926180000: listings stays the slim shared table, service-specific
-- fields live in their own 1:1 details table.
--
-- price_eur_month on listings stays NOT NULL (every listing needs *a*
-- number to sort/filter/display) rather than relaxing that constraint for
-- one type — the plan doc's "starting at / contact for quote" need is
-- solved instead with price_is_estimate (renders "from €X" instead of
-- "€X") and pricing_note (free text like "final price depends on square
-- footage"), both on service_details.

alter table public.listings
  drop constraint listings_type_check,
  add constraint listings_type_check
    check (type = any (array['rental'::text, 'car'::text, 'product'::text, 'service'::text]));

create table public.service_details (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  service_category text not null check (
    service_category in (
      'moving', 'auto_repair', 'tutoring', 'cleaning', 'childcare',
      'pet_care', 'home_repair', 'photography', 'other'
    )
  ),
  price_is_estimate boolean not null default false,
  pricing_note text
);

alter table public.service_details enable row level security;

create policy "service_details: public reads for active listings"
  on public.service_details for select
  using (exists (select 1 from public.listings where listings.id = service_details.listing_id and listings.status = 'active'));

create policy "service_details: owner reads own"
  on public.service_details for select
  using (exists (select 1 from public.listings where listings.id = service_details.listing_id and listings.owner_id = auth.uid()));

create policy "service_details: admins read all"
  on public.service_details for select
  using (public.is_admin());

create policy "service_details: owner inserts own"
  on public.service_details for insert
  to authenticated
  with check (exists (select 1 from public.listings where listings.id = service_details.listing_id and listings.owner_id = auth.uid()));

create policy "service_details: owner updates own"
  on public.service_details for update
  using (exists (select 1 from public.listings where listings.id = service_details.listing_id and listings.owner_id = auth.uid()));

create policy "service_details: admins update all"
  on public.service_details for update
  using (public.is_admin());

grant select, insert, update on public.service_details to authenticated;
grant select on public.service_details to anon;
grant all on public.service_details to service_role;
