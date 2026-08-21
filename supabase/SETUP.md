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

## 3. Auth: magic-link email template

Sign-in is passwordless (magic link) — done in **Authentication → Email
Templates → Magic Link**. Replace the default template's content with
`supabase/templates/magic_link.html`'s contents (same file used for local
testing). The important part is the link:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

This points at our own `/auth/confirm` route (which verifies the token and
sets the session cookie server-side) instead of Supabase's default hosted
verify endpoint — required for the Next.js SSR cookie handling to work.

## 4. Auth: URL configuration

**Authentication → URL Configuration:**

- **Site URL** — set to your deployed domain once you have one (e.g.
  `https://milhaus.com`). This is what `{{ .SiteURL }}` resolves to in the
  email template above, so it must be correct before real users sign in.
  Until then, leave it as whatever default was set — magic links will just
  redirect to that placeholder domain, which is fine for now since real
  signups aren't happening yet.
- **Redirect URLs** — add your deployed domain here too once you have one
  (e.g. `https://milhaus.com/**`), otherwise Supabase will refuse the
  redirect after sign-in.

## 5. Bootstrapping the first admin

Profiles are created automatically on signup (`individual_lister` by
default — see the `handle_new_user` trigger in the init migration). To make
yourself an admin after signing in once through the app:

```sql
update public.profiles set role = 'admin' where contact_email = 'you@example.com';
```
