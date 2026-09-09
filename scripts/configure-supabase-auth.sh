#!/usr/bin/env bash
# scripts/configure-supabase-auth.sh
#
# One-shot: point the hosted Supabase project's auth config at what the
# email sign-in flow needs — the scanner-safe Magic Link template, a real
# SMTP sender (Resend), the redirect allow-list, and a usable email rate
# limit. Uses curl (Python's HTTP client is blocked by Cloudflare here).
# Prints the real HTTP status and response; nothing is swallowed.
#
#   PAT=sbp_xxx RESEND_KEY=re_xxx bash scripts/configure-supabase-auth.sh
#
# After it succeeds: delete this file and revoke the PAT at
# https://supabase.com/dashboard/account/tokens
#
# Override via env if the project / sender / URL changes: REF, SITE_URL, SENDER_EMAIL

set -euo pipefail

: "${PAT:?set PAT=sbp_... (supabase.com/dashboard/account/tokens)}"
: "${RESEND_KEY:?set RESEND_KEY=re_... (resend.com/api-keys)}"
REF="${REF:-dijnlkywqnmyeiovvhlw}"
SITE_URL="${SITE_URL:-http://localhost:3000}"
SENDER_EMAIL="${SENDER_EMAIL:-noreply@ucg-social-scheduler.com}"

bodyfile="$(mktemp)"
respfile="$(mktemp)"
trap 'rm -f "$bodyfile" "$respfile"' EXIT

python3 - "$SITE_URL" "$SENDER_EMAIL" "$RESEND_KEY" > "$bodyfile" <<'PY'
import json, sys
site, sender, resend_key = sys.argv[1], sys.argv[2], sys.argv[3]
template = (
    "<h2>Sign in to Milhaus</h2>\n"
    '<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">'
    "Click here to sign in</a></p>\n"
    "<p>Or enter this code:</p>\n"
    '<p style="font-size:22px;font-family:monospace;letter-spacing:4px">'
    "<strong>{{ .Token }}</strong></p>\n"
    "<p>The link and the code both expire in one hour, and each can only be used once.</p>\n"
    "<p>If you did not request this, you can safely ignore this email.</p>\n"
)
json.dump({
    "site_url": site,
    "uri_allow_list": f"{site}/**,http://127.0.0.1:3000/**",
    "mailer_subjects_magic_link": "Your Milhaus sign-in link",
    "mailer_templates_magic_link_content": template,
    "mailer_otp_length": 6,
    "smtp_host": "smtp.resend.com",
    "smtp_port": "465",
    "smtp_user": "resend",
    "smtp_pass": resend_key,
    "smtp_sender_name": "Milhaus",
    "smtp_admin_email": sender,
    "rate_limit_email_sent": 30,
}, sys.stdout)
PY

url="https://api.supabase.com/v1/projects/$REF/config/auth"
echo "PATCH $url"
http=$(curl -sS -X PATCH "$url" \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  --data-binary @"$bodyfile" \
  -o "$respfile" -w '%{http_code}')

echo "HTTP $http"
echo
if [ "$http" = "200" ]; then
  python3 -c '
import json, sys
c = json.load(open(sys.argv[1]))
for k in ("site_url","uri_allow_list","smtp_host","smtp_port","smtp_user",
          "smtp_sender_name","smtp_admin_email","rate_limit_email_sent","mailer_subjects_magic_link"):
    print(f"  {k}: {c.get(k)!r}")
print("  magic-link template updated:",
      "auth/confirm?token_hash" in (c.get("mailer_templates_magic_link_content") or ""))
' "$respfile"
  echo
  echo "Success. Send yourself a fresh sign-in link and try it."
  echo "Then: rm scripts/configure-supabase-auth.sh  and revoke the PAT."
else
  echo "FAILED — response body:"
  cat "$respfile"
  echo
  exit 1
fi
