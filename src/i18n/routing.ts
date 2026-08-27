// src/i18n/routing.ts
// English keeps today's bare URLs (/, /listings/[id], /post, ...) — nothing
// already indexed, linked, or hardcoded elsewhere (canonical URLs, JSON-LD,
// the sitemap) needs to change. German gets a /de prefix on top of that
// ("localePrefix: as-needed" — only the non-default locale is prefixed).
// /admin/* is deliberately outside this locale segment entirely (see
// src/app/admin) — English-only internal tool for now, not in scope here.

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  // next-intl's default (true) remembers a visitor's locale choice via a
  // NEXT_LOCALE cookie and auto-redirects a bare, unprefixed URL to it —
  // so a fresh visit to "/" after ever toggling to German would silently
  // land on "/de". Explicitly asked for the opposite: switching to German
  // should carry forward through normal navigation (the URL itself says
  // /de, so every internal Link already does this — see HomeLink's bug
  // fix for the one place that wasn't), but a refresh or a fresh page
  // load should always start from English, full stop, ignoring any past
  // choice. false makes an unprefixed URL always resolve to defaultLocale
  // — no cookie, no Accept-Language, no memory.
  localeDetection: false,
});
