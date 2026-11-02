-- supabase/migrations/20261102150000_add_listing_expiry.sql
-- Charlie's ask (2026-11-02): every listing comes down 30 days after it
-- goes live, unless the poster renews it from My Listings. Decisions
-- (Terry, same day): expired listings move to a new 'expired' status the
-- poster can renew with one click; a warning email goes out 3 days
-- before; everything already live gets a fresh 30 days from today rather
-- than all disappearing at once (every live listing was already older
-- than 30 days); no listing type is exempt. Calendar events are a
-- separate table and are untouched.
--
-- The actual taking-down and emailing is a daily Vercel cron job
-- (src/app/api/cron/expire-listings/route.ts); this migration only adds
-- the columns, the status, and a trigger that keeps expires_at honest.
--
-- Safe to run more than once.

-- 1. Allow the new status. The original check constraint was declared
--    inline (20260821095414_init_schema.sql), so its name is Postgres's
--    auto-generated one — drop whichever check on listings mentions
--    status rather than guessing the name.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname from pg_constraint
    where conrelid = 'public.listings'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%pending_review%'
  loop
    execute format('alter table public.listings drop constraint %I', constraint_name);
  end loop;
end;
$$;

alter table public.listings
  add constraint listings_status_check
  check (status in ('draft', 'pending_review', 'active', 'rented', 'archived', 'expired'));

-- 2. When it comes down, and whether the 3-day warning already went out.
alter table public.listings add column if not exists expires_at timestamptz;
alter table public.listings add column if not exists expiry_warning_sent_at timestamptz;

create index if not exists listings_expires_at_idx on public.listings (expires_at) where status = 'active';

-- 3. Every path that makes a listing live (free post, paid checkout,
--    admin approve/add/relist, renew) gets a fresh 30 days here, in one
--    place, instead of each code path remembering to set it. The owner
--    RLS update policy lets posters write any column of their own row,
--    so a plain signed-in user is also stopped from moving their own
--    expiry date — only admins and server-side (service-role) code can.
create or replace function public.set_listing_expires_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    new.expires_at = now() + interval '30 days';
    new.expiry_warning_sent_at = null;
  elsif tg_op = 'UPDATE' and auth.uid() is not null and not public.is_admin() then
    new.expires_at = old.expires_at;
    new.expiry_warning_sent_at = old.expiry_warning_sent_at;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_set_expires_at on public.listings;
create trigger listings_set_expires_at
  before insert or update on public.listings
  for each row execute function public.set_listing_expires_at();

-- 4. Fresh 30 days for everything live right now.
update public.listings
set expires_at = now() + interval '30 days', expiry_warning_sent_at = null
where status = 'active' and expires_at is null;
