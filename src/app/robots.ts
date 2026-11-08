// src/app/robots.ts
// Generates /robots.txt. Keeps auth/account/moderation pages out of the
// index — there's nothing there a search engine (or an AI crawler like
// GPTBot/PerplexityBot/ClaudeBot, which this deliberately doesn't block
// otherwise) should be surfacing to a searcher.

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // "/post" also covers /post-ad, /post-car, /post-business etc.
      // (robots rules match by prefix). Everything here is either
      // private, a form, or a redirect — and already noindexed.
      disallow: [
        "/admin",
        "/auth/",
        "/api/",
        "/cart",
        "/consent/",
        ...["/post", "/sign-in", "/my-listings", "/my-ads", "/edit-listing/", "/search"].flatMap((path) => [
          path,
          `/de${path}`,
        ]),
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
