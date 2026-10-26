// src/app/sitemap.ts
// Generates /sitemap.xml from the homepage plus every currently active
// listing, business, and event — dynamic on purpose, so a new approved
// listing is discoverable without a code change or redeploy. Each URL
// lists both language versions via `alternates.languages` so Google
// indexes /de/... as the German translation of a page rather than a
// duplicate of it.
//
// Deliberately NOT including self-listed "service"-type listings
// (/services/{id}) — that's the old pre-Businesses-directory feature,
// still postable via /post-service but with no page anywhere left that
// browses or links to it (see that route's own noindex, same reasoning).
// Same reasoning for individual /products/{id} pages now too — /products
// itself became Charlie's "Special Offers" page (still a real, crawlable
// page, kept below), but the real self-listed items it used to browse
// have no page linking to them any more either.
// A sitemap is a crawl-priority signal; there's no reason to prioritize
// crawling pages no real visitor can ever reach by browsing the site.

import type { MetadataRoute } from "next";
import { getActiveBusinesses } from "@/lib/businesses-queries";
import { getActiveEvents } from "@/lib/events-queries";
import { getActiveListings } from "@/lib/listings";
import { SITE_URL } from "@/lib/site-url";

function withLanguageAlternates(path: string) {
  return {
    en: `${SITE_URL}${path}`,
    de: `${SITE_URL}/de${path}`,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rentals, cars, businesses, events] = await Promise.all([
    getActiveListings("rental"),
    getActiveListings("car"),
    getActiveBusinesses(),
    getActiveEvents(),
  ]);

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
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
      alternates: { languages: withLanguageAlternates("/products") },
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
      alternates: { languages: withLanguageAlternates("/services") },
    },
    {
      url: `${SITE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
      alternates: { languages: withLanguageAlternates("/events") },
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
    ...businesses.map((business) => ({
      url: `${SITE_URL}/businesses/${business.id}`,
      lastModified: new Date(business.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: { languages: withLanguageAlternates(`/businesses/${business.id}`) },
    })),
    ...events.map((event) => ({
      url: `${SITE_URL}/events/${event.id}`,
      lastModified: new Date(event.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: { languages: withLanguageAlternates(`/events/${event.id}`) },
    })),
  ];
}
