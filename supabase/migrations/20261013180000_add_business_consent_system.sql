-- supabase/migrations/20261013180000_add_business_consent_system.sql
-- Terry: listing a business without its owner's permission is illegal
-- in Germany — hit this directly on European-Living.live, which already
-- solved it with a real double-opt-in consent system (not just a
-- checkbox). Ported here, adapted to Milhaus's existing businesses
-- table rather than a fresh one.
--
-- The core idea: a business submission (self-serve or Charlie's own
-- hand-add) isn't enough on its own to go live. The business's own
-- email (distinct from whoever's account submitted it — a third party
-- can type in someone else's info) gets a one-time confirmation link;
-- clicking it is what actually proves the real business consents to
-- being listed. Charlie can also record consent he obtained another way
-- (a signed paper form, a verbal yes in person) with a proof document
-- and a note, for cases that don't go through email at all.
--
-- business_consent_log is a separate, append-only history — not just
-- the current-state columns on businesses — because consent can change
-- over time (confirmed, later revoked by the owner, restored, the
-- business resubmitted) and each of those needs its own timestamped
-- record for the actual audit trail, not just whatever the latest state
-- happens to be.

alter table businesses
  add column email text,
  add column consent_status text not null default 'pending'
    check (consent_status in ('pending', 'confirmed', 'revoked')),
  add column consent_token uuid default gen_random_uuid(),
  add column consent_method text not null default 'email'
    check (consent_method in ('email', 'paper_form', 'verbal_in_person')),
  add column consent_requested_at timestamptz,
  add column consent_confirmed_at timestamptz,
  add column confirmation_ip text,
  add column confirmation_email_sent_at timestamptz,
  add column consent_proof_url text,
  add column consent_note text;

create index businesses_consent_token_idx on businesses (consent_token);
create index businesses_consent_status_idx on businesses (consent_status);

create table business_consent_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  event_type text not null check (
    event_type in ('requested', 'confirmed', 'revoked', 'restored', 'resubmitted')
  ),
  email text not null,
  ip_address text,
  token uuid,
  consent_method text,
  note text,
  created_at timestamptz not null default now()
);

create index business_consent_log_business_id_idx on business_consent_log (business_id);

alter table business_consent_log enable row level security;

-- Admins read the audit trail; writes go through server actions using
-- the service-role client (createAdminClient) instead of a client-side
-- insert policy — the public confirmation link (clicked by a business
-- owner with no Milhaus account at all) has to be able to log a
-- 'confirmed' event with no authenticated session to check against.
create policy "business_consent_log: admins read" on business_consent_log
  for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner'))
  );

-- Private bucket for uploaded proof of consent (a scanned signed form,
-- etc.) — admin-only, never publicly readable, mirroring how
-- European-Living locked this down.
insert into storage.buckets (id, name, public)
values ('consent-documents', 'consent-documents', false)
on conflict (id) do nothing;

create policy "consent-documents: admins upload"
  on storage.objects for insert
  with check (
    bucket_id = 'consent-documents'
    and exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner'))
  );

create policy "consent-documents: admins read"
  on storage.objects for select
  using (
    bucket_id = 'consent-documents'
    and exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner'))
  );
