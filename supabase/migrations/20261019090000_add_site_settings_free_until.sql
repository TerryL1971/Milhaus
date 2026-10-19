-- supabase/migrations/20261019090000_add_site_settings_free_until.sql
-- Terry's ask: a 90-day free-posting launch promo, automatic — not
-- something Charlie has to remember to switch off by hand on day 91.
-- Built now, deliberately not activated: the site hasn't actually
-- launched yet (domain, live Stripe keys, Impressum, etc. are all still
-- pending — see launch-blockers-pending), so there's no real date to set
-- yet. free_until starts out null (no override at all — every category's
-- real behavior is exactly what listing_prices already says, same as
-- today) until Charlie or Terry sets a real date once launch is locked
-- in.
--
-- One global date, not per-category — the ask was "everyone/anyone
-- making a listing," a single site-wide promo window, not five
-- independently-timed ones.
--
-- Singleton table (the `id boolean ... check (id)` trick): a primary key
-- of boolean can only ever be `true` (the check forbids `false`, and a
-- second `true` row would collide with the first on the primary key), so
-- this table can never hold more than the one row it's seeded with here.
create table public.site_settings (
  id boolean primary key default true check (id),
  free_until timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, free_until) values (true, null);

alter table public.site_settings enable row level security;

-- Same read/write split as listing_prices: the posting flow (anyone,
-- including anon) needs to read this to decide whether a category is
-- free right now; only an admin can change it.
create policy "site_settings: anyone reads"
  on public.site_settings for select
  using (true);

create policy "site_settings: admins update"
  on public.site_settings for update
  using (public.is_admin());

grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
