-- supabase/migrations/20261021140000_add_car_body_type.sql
-- Terry: searching "sedan", "truck", "convertible", "sports car" etc. on
-- /cars has always returned nothing, even for cars that obviously are
-- one — "2019 Toyota Camry SE" never contains the literal word "sedan"
-- anywhere in its own title/make/model/description, so no amount of
-- keyword-matching tuning (see lib/search-matching.ts) could ever fix
-- this: the word just isn't stored anywhere to match against. Needs an
-- actual field, same as transmission/us_spec before it (see
-- 20261006140000_add_car_transmission_and_us_spec.sql) — nullable, no
-- NOT NULL, so a seller skipping it just means "not specified."
--
-- Backfilling the existing demo listings too, not just adding the
-- column — leaving them all null would mean "sedan"/"truck" *still*
-- return nothing against today's data, the exact complaint this is
-- fixing. Matched by (make, model) since that's already unique across
-- the current 12 demo cars; a real seller picks this from a dropdown on
-- /post-car going forward (see that page's own update).
alter table public.car_details
  add column body_type text check (
    body_type is null or body_type in
    ('sedan', 'suv', 'truck', 'van', 'wagon', 'hatchback', 'coupe', 'convertible', 'sports_car')
  );

update public.car_details set body_type = 'sedan' where make = 'Toyota' and model = 'Camry SE';
update public.car_details set body_type = 'sedan' where make = 'BMW' and model = '328i';
update public.car_details set body_type = 'suv' where make = 'Honda' and model = 'CR-V EX';
update public.car_details set body_type = 'suv' where make = 'Jeep' and model = 'Wrangler Unlimited';
update public.car_details set body_type = 'truck' where make = 'Ford' and model = 'F-150 XLT';
update public.car_details set body_type = 'van' where make = 'Dodge' and model = 'Grand Caravan';
update public.car_details set body_type = 'wagon' where make = 'Subaru' and model = 'Outback';
update public.car_details set body_type = 'suv' where make = 'Mazda' and model = 'CX-5';
-- Trailing space in the stored model is real (not a typo here) — this
-- listing's own data has it, confirmed against the live table before
-- writing this migration.
update public.car_details set body_type = 'suv' where make = 'BMW' and model = 'X5 xDrive40i ';
update public.car_details set body_type = 'suv' where make = 'Honda' and model = 'Crv';
update public.car_details set body_type = 'suv' where make = 'Chevrolet' and model = 'Equinox';
update public.car_details set body_type = 'sedan' where make = 'Volkswagen' and model = 'Jetta Sport';
