-- supabase/migrations/20261006140000_add_car_transmission_and_us_spec.sql
-- Two more car-only fields, requested alongside the new filter-dropdown
-- work: transmission (automatic/manual) and us_spec (US-market vs.
-- German/EU-market car — matters a lot to this audience, since a US-spec
-- car can go home with a PCSing family without re-registration hassles a
-- EU-spec one would have). Both nullable/optional — existing car_details
-- rows (and sellers who skip the field) just mean "not specified", not an
-- invalid listing, so no NOT NULL and no backfill needed.

alter table public.car_details
  add column transmission text check (transmission is null or transmission in ('automatic', 'manual')),
  add column us_spec boolean;
