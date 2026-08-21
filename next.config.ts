// next.config.ts
import type { NextConfig } from "next";

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

export default nextConfig;
