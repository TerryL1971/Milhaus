// src/app/sitemap.ts
// Generates /sitemap.xml from the homepage plus every currently active
// listing — dynamic on purpose, so a new approved listing is discoverable
// without a code change or redeploy.

import type { MetadataRoute } from "next";
import { getActiveListings } from "@/lib/listings";
import { SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getActiveListings();

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...listings.map((listing) => ({
      url: `${SITE_URL}/listings/${listing.id}`,
      lastModified: new Date(listing.updatedAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
