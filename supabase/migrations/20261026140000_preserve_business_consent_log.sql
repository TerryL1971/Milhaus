-- supabase/migrations/20261026140000_preserve_business_consent_log.sql
-- GDPR audit (2026-10-26) found a real tension: business_consent_log.
-- business_id had `on delete cascade`, so deleting a business — which
-- itself cascades from deleting the *account* that owns it (GDPR
-- Article 17 erasure) — silently destroyed the consent audit trail too.
-- The whole point of this table (see the migration that created it,
-- 20261013180000) is to survive as legal evidence that a real business
-- owner consented to being listed, independent of whatever later
-- happens to the account or listing — Terry: this is exactly the
-- separate, preserved table already proven out on european-living.live,
-- just with the wrong delete behavior copied over here.
--
-- Fix: business_id becomes nullable + "on delete set null" instead of
-- cascade (the log row survives, just loses its live link once the
-- business is gone), and a denormalized business_name column captures
-- the name at the time of each event so the log stays legible even
-- after business_id is null. Backfill existing rows from the current
-- join before the business_id's old value is the only copy of it.

alter table business_consent_log add column business_name text;

update business_consent_log log
set business_name = b.name
from businesses b
where log.business_id = b.id and log.business_name is null;

alter table business_consent_log drop constraint business_consent_log_business_id_fkey;
alter table business_consent_log alter column business_id drop not null;
alter table business_consent_log
  add constraint business_consent_log_business_id_fkey
  foreign key (business_id) references businesses (id) on delete set null;
