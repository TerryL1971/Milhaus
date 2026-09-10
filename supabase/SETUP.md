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
testing). Two things in that template matter:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

The link points at our own `/auth/confirm` **page** (not Supabase's hosted
verify endpoint) so the Next.js SSR client sets the session cookie. That
page shows a "Confirm sign-in" button rather than verifying on load — a
single-use token, and email security scanners / browser prefetchers GET
every link in a message, so an auto-verifying URL gets its token spent
before the recipient clicks. The button (a POST server action) is the only
thing that spends it.

```
{{ .Token }}
```

The 6-digit code, also in the template, is the fallback: the sign-in form
takes it directly, and it can't be consumed by a link scanner. If users
report "link expired or already used" on every attempt, that's a scanner
in their mail/browser stack — the code path gets them in regardless.

## 3a. Auth: email rate limit (important for testing)

New hosted projects use Supabase's shared email service, capped at
**2 sign-in emails per hour** (`[auth.rate_limit] email_sent`). You'll hit
"email rate limit exceeded" fast while testing. Options:

- **Custom SMTP** (Authentication → Emails → SMTP Settings) — Resend,
  Postmark, SES. Removes the cap and is required before real users anyway.
  With Resend: sender must be on a **verified domain** (an
  `onboarding@resend.dev` sender only delivers to your own Resend account
  address). Settings: host `smtp.resend.com`, port `465`, user `resend`,
  password = a Resend API key. Then raise Authentication → Rate Limits →
  emails/hour.
  - **Turn OFF click + open tracking** for the sending domain in Resend
    (Domains → the domain → Tracking). With tracking on, every link in the
    sign-in email is rewritten through a shared redirect domain, which
    reads as phishing to spam filters and lands the email in junk.
  - Add a **DMARC** DNS record for the sending domain:
    `_dmarc  TXT  v=DMARC1; p=none;` — enough to lift inbox placement.

## 3b. `scripts/configure-supabase-auth.sh`

Applies the pieces above to the hosted project via the Management API in
one shot — the Magic Link template ([supabase/templates/magic_link.html](./templates/magic_link.html)),
custom SMTP, the redirect allow-list, `mailer_otp_length`, and the rate
limit. Run:

```sh
PAT=sbp_… RESEND_KEY=re_… SITE_URL=https://your-domain bash scripts/configure-supabase-auth.sh
```

`PAT` from supabase.com/dashboard/account/tokens (revoke it after).
`SITE_URL` is what the emailed magic link points at — the deployed URL in
production, `http://localhost:3000` for local-only.
- To sign in during local development without email at all: visit

  ```
  http://localhost:3000/auth/dev-signin?email=you@example.com
  ```

  It mints and verifies a token server-side with the service-role key and
  drops you on the homepage signed in. It 404s unless `NODE_ENV` is
  `development` and the request is on localhost, so it's inert on Vercel.

## 4. Auth: URL configuration

**Authentication → URL Configuration:**

- **Site URL** — this is what `{{ .SiteURL }}` resolves to when building
  the emailed link, so the emailed link is only clickable if this points
  at wherever the app is actually running. While developing against this
  hosted project from localhost, set it to `http://localhost:3000`. Switch
  it to the deployed domain (e.g. `https://milhaus.com`) at launch. If it's
  wrong, every emailed sign-in link 404s — use the 6-digit code, or the
  Admin API workaround in 3a, until it's fixed.
- **Redirect URLs** — add `http://localhost:3000/**` now (for local dev)
  and your deployed domain (e.g. `https://milhaus.com/**`) at launch.
  `signInWithOtp` passes `emailRedirectTo: <origin>/auth/confirm`; Supabase
  refuses to honor it unless the origin is on this list.

## 5. Bootstrapping the first admin

Profiles are created automatically on signup (`individual_lister` by
default — see the `handle_new_user` trigger in the init migration). To make
yourself an admin after signing in once through the app:

```sql
update public.profiles set role = 'admin' where contact_email = 'you@example.com';
```
