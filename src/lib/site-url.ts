// src/lib/site-url.ts
// Single source of truth for the site's public URL — used by the sitemap,
// robots.txt, canonical URLs, and Open Graph tags. Falls back to localhost
// so none of that breaks before NEXT_PUBLIC_SITE_URL is set (i.e. before
// there's a real deployed domain).

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

// The address people should READ, whatever deployment they're on —
// Terry's call (2026-11-09): "Everything needs to be listed for
// www.milhaus.de". Used for addresses printed in legal texts (the
// withdrawal policy names the withdrawal page by its full address) and
// shown in emails. Working links (Stripe's return page, sign-in
// redirects, link targets in emails) still use SITE_URL above, because
// www.milhaus.de isn't connected to Vercel yet and a link to it would
// fail until it is. Once the domain is connected, set
// NEXT_PUBLIC_SITE_URL to this same value on Vercel and the two match.
export const PUBLIC_SITE_URL = "https://www.milhaus.de";
