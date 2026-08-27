// next.config.ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Next's dev server only trusts requests to its internal dev assets from
  // the "localhost" origin by default. Supabase's own default local config
  // (`supabase init`'s site_url) sends magic-link redirects to
  // 127.0.0.1:3000 instead — a different origin as far as this check is
  // concerned, even though it's the same machine. Without this, following
  // a local magic-link email silently breaks client-side hydration for the
  // rest of that browser session (assets 403, no React event handlers ever
  // attach) with no visible error beyond a console warning easy to miss.
  allowedDevOrigins: ["127.0.0.1"],
};

// SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN are all optional here — unset
// (as they are until someone wires up a CI upload step), this just skips
// the source-map upload rather than failing the build. Error reporting
// itself doesn't need them at all; source maps only make stack traces in
// Sentry readable instead of pointing at minified code.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
});
