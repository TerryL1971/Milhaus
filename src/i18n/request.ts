// src/i18n/request.ts
// Server-side message loading per request — wired into next.config.ts via
// createNextIntlPlugin(). Falls back to the default locale (en) for a
// request that somehow reaches here with an unsupported locale segment.

import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
