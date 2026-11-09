-- supabase/migrations/20261109150000_add_event_categories.sql
-- Event categories — Charlie's ask (via Terry, 2026-11-09): "can we add
-- categories to the events filters, sports, cultural, fests etc". One
-- category per event, picked by Charlie in Admin → Events. The list
-- itself lives in src/lib/events.ts (EVENT_CATEGORIES); this CHECK must
-- match it. Nullable so events added before this migration keep working
-- — they show no category until Charlie sets one in Admin → Events.
-- Safe to re-run.

alter table public.events add column if not exists category text;

alter table public.events drop constraint if exists events_category_check;
alter table public.events add constraint events_category_check
  check (category is null or category in (
    'sports', 'culture', 'festival', 'family', 'food', 'community', 'other'
  ));

create index if not exists events_category_idx on public.events (category);
