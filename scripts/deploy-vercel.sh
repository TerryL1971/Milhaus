#!/usr/bin/env bash
# scripts/deploy-vercel.sh
#
# Production deploy to Vercel: link the project, push the env vars from
# .env.local, deploy, point NEXT_PUBLIC_SITE_URL at the live URL, redeploy.
#
#   VERCEL_TOKEN=xxx bash scripts/deploy-vercel.sh
#
# Token: vercel.com/account/tokens. Safe to re-run.
#
# `vercel link` rewrites .env.local from the project's remote env, so this
# snapshots the local file first and restores it on exit. bash 3.2 safe.

set -euo pipefail
cd "$(dirname "$0")/.."

: "${VERCEL_TOKEN:?set VERCEL_TOKEN=... (vercel.com/account/tokens)}"
[ -f .env.local ] || { echo ".env.local not found"; exit 1; }

vc() { vercel --token "$VERCEL_TOKEN" "$@"; }

ENV_BACKUP="$(mktemp)"
cp .env.local "$ENV_BACKUP"
trap 'cp "$ENV_BACKUP" .env.local; rm -f "$ENV_BACKUP"' EXIT

# Capture the values we push (from the snapshot, before Vercel touches it).
SB_URL="" SB_ANON="" SB_SRK="" SENTRY="" GSV=""
while IFS= read -r line; do
  case "$line" in
    NEXT_PUBLIC_SUPABASE_URL=*)             SB_URL="${line#*=}" ;;
    NEXT_PUBLIC_SUPABASE_ANON_KEY=*)        SB_ANON="${line#*=}" ;;
    SUPABASE_SERVICE_ROLE_KEY=*)            SB_SRK="${line#*=}" ;;
    NEXT_PUBLIC_SENTRY_DSN=*)               SENTRY="${line#*=}" ;;
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=*) GSV="${line#*=}" ;;
  esac
done < "$ENV_BACKUP"
[ -n "$SB_URL" ] && [ -n "$SB_ANON" ] && [ -n "$SB_SRK" ] || {
  echo "missing Supabase keys in .env.local"; exit 1; }

set_env() {  # name value
  [ -z "$2" ] && return 0
  vc env rm "$1" production --yes >/dev/null 2>&1 || true
  printf '%s' "$2" | vc env add "$1" production >/dev/null
  echo "   set $1"
}

echo "== 1/5  link project =="
vc link --yes >/dev/null
cp "$ENV_BACKUP" .env.local

echo "== 2/5  push env vars (production) =="
set_env NEXT_PUBLIC_SUPABASE_URL "$SB_URL"
set_env NEXT_PUBLIC_SUPABASE_ANON_KEY "$SB_ANON"
set_env SUPABASE_SERVICE_ROLE_KEY "$SB_SRK"
set_env NEXT_PUBLIC_SENTRY_DSN "$SENTRY"
set_env NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION "$GSV"

echo "== 3/5  production deploy (builds on Vercel, ~1-2 min) =="
DEPLOY_URL="$(vc deploy --prod 2>/dev/null | tail -n1)"
echo "   deployment: $DEPLOY_URL"

PROD_URL="$(vc inspect "$DEPLOY_URL" 2>&1 | grep -oE 'https://[a-z0-9.-]+\.vercel\.app' | grep -vE '[a-z0-9]{9}-' | head -n1 || true)"
[ -z "$PROD_URL" ] && PROD_URL="$DEPLOY_URL"
echo "   site url:   $PROD_URL"

echo "== 4/5  set NEXT_PUBLIC_SITE_URL, redeploy =="
set_env NEXT_PUBLIC_SITE_URL "$PROD_URL"
vc deploy --prod >/dev/null 2>&1

echo
echo "== 5/5  live: $PROD_URL"
echo
echo "Next — point Supabase auth at it (adds the URL, keeps localhost):"
echo "  PAT=sbp_… RESEND_KEY=re_… SITE_URL=$PROD_URL bash scripts/configure-supabase-auth.sh"
