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
      disallow: [
        "/admin",
        "/admin/*",
        "/post",
        "/de/post",
        "/sign-in",
        "/de/sign-in",
        "/auth/*",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
