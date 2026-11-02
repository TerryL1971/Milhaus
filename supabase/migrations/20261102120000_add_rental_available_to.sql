-- supabase/migrations/20261102120000_add_rental_available_to.sql
-- Charlie's ask (2026-11-02): a lister should be able to say who a home
-- is open to — "Everyone", "US Military & expats" or "US Military only".
-- The latter two show a badge on the card's photo and on the detail page;
-- "everyone" is the unrestricted case and deliberately shows nothing. Nullable, no
-- default: every listing posted before this existed just shows no badge
-- rather than guessing on the landlord's behalf. The form itself always
-- submits one of the three (it's a three-way toggle there).
alter table public.rental_details
  add column available_to text check (
    available_to is null or available_to in ('everyone', 'military_and_expats', 'military_only')
  );
