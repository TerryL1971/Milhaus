-- supabase/migrations/20261102120000_add_rental_available_to.sql
-- Charlie's ask (2026-11-02): a lister should be able to say who a home
-- is open to — "US Military only" vs. "US Military & expats" — shown as
-- a badge on the card's photo and on the detail page. Nullable, no
-- default: every listing posted before this existed just shows no badge
-- rather than guessing on the landlord's behalf. The form itself always
-- submits one of the two (it's a two-way toggle there).
alter table public.rental_details
  add column available_to text check (
    available_to is null or available_to in ('military_only', 'military_and_expats')
  );
