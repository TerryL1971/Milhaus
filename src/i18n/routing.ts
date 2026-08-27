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
});
