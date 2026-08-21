# supabase/SETUP.md
# One-time setup for the milhaus Supabase project.

## 1. Apply the schema

`supabase/migrations/20260821095414_init_schema.sql` creates everything:
the `profiles` and `listings` tables, their Row Level Security policies,
and the `listing-photos` storage bucket.

**Easiest path — paste it into the dashboard:**

1. Open your project at https://supabase.com/dashboard
2. Go to **SQL Editor** → **New query**
3. Paste the full contents of
   `supabase/migrations/20260821095414_init_schema.sql`
4. Run it. It's a one-shot script — safe to run once on a fresh project.

**Or, with the Supabase CLI** (already set up in this repo via `supabase
init`): `supabase link --project-ref <your-project-ref>` (project ref is in
your dashboard URL, or Project Settings → General), then `supabase db
push`.

## 2. Grab the API keys

Project Settings → API, in the dashboard:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this one secret —
  it bypasses Row Level Security)

Copy `.env.example` to `.env.local` in the project root and fill in the
three values.

## 3. Auth settings (for later — the auth step isn't built yet)

No action needed yet. When we wire up auth, you'll want email confirmations
either off (fastest for local testing) or on with a redirect URL set to
your deployed domain, under Authentication → URL Configuration.
