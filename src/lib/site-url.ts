// src/lib/site-url.ts
// Single source of truth for the site's public URL — used by the sitemap,
// robots.txt, canonical URLs, and Open Graph tags. Falls back to localhost
// so none of that breaks before NEXT_PUBLIC_SITE_URL is set (i.e. before
// there's a real deployed domain).

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
