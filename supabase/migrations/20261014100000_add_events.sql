-- supabase/migrations/20261014100000_add_events.sql
-- New top-level category from Charlie's ideas slide: an Events calendar,
-- with links to the organizer and pictures. Modeled on the businesses
-- directory, not the listings engine — Charlie answered (via Terry) that
-- he wants to hand-enter these himself, no self-serve submission form and
-- no review queue, same reasoning businesses started with: he's
-- cataloging other orgs' events, not opening it to anyone to post. No
-- consent-verification system either (unlike businesses) — this is public
-- event info Charlie is choosing to publish, not a third party's private
-- contact details.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  -- Shown publicly (unlike ad_slots.advertiser_name) — the whole point of
  -- "links to the organiser" is surfacing who's actually running it.
  organizer_name text not null,
  organizer_url text,
  city text not null,
  base text, -- nullable: not every event is tied to one specific garrison
  starts_at timestamptz not null,
  ends_at timestamptz,
  cover_image_url text,
  -- The gallery Charlie asked for ("Pictures") — plural, unlike
  -- businesses' single cover_image_url/logo_url pair.
  photos text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "events: public reads active" on public.events
  for select
  using (is_active = true);

-- role in ('admin', 'owner') to match isAdminRole() (src/lib/roles.ts),
-- not just 'admin' like the original businesses policy.
create policy "events: admins manage" on public.events
  for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner'))
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner'))
  );

create index events_starts_at_idx on public.events (starts_at);
create index events_is_active_idx on public.events (is_active);

create trigger set_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();
