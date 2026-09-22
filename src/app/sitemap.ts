// src/app/sitemap.ts
// Generates /sitemap.xml from the homepage plus every currently active
// listing — dynamic on purpose, so a new approved listing is discoverable
// without a code change or redeploy. Each URL lists both language versions
// via `alternates.languages` so Google indexes /de/... as the German
// translation of a page rather than a duplicate of it.

import type { MetadataRoute } from "next";
import { getActiveListings } from "@/lib/listings";
import { SITE_URL } from "@/lib/site-url";

function withLanguageAlternates(path: string) {
  return {
    en: `${SITE_URL}${path}`,
    de: `${SITE_URL}/de${path}`,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rentals, cars] = await Promise.all([getActiveListings("rental"), getActiveListings("car")]);

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: { languages: withLanguageAlternates("") },
    },
    {
      url: `${SITE_URL}/cars`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
      alternates: { languages: withLanguageAlternates("/cars") },
    },
    ...rentals.map((listing) => ({
      url: `${SITE_URL}/listings/${listing.id}`,
      lastModified: new Date(listing.updatedAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
      alternates: { languages: withLanguageAlternates(`/listings/${listing.id}`) },
    })),
    ...cars.map((listing) => ({
      url: `${SITE_URL}/cars/${listing.id}`,
      lastModified: new Date(listing.updatedAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
      alternates: { languages: withLanguageAlternates(`/cars/${listing.id}`) },
    })),
  ];
}
