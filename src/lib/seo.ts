// src/lib/seo.ts
// One place that builds a public page's search and sharing metadata, so
// every page gets the same set (SEO check, 2026-11-08):
//
// - a canonical URL for the page itself, in its own language;
// - hreflang links to *this page's* English and German versions (they
//   used to come from the layout, which pointed every page's alternates
//   at the homepage);
// - its own Open Graph / Twitter title, description and image, so a
//   shared link previews as that page instead of as the homepage, with
//   the branded default image when the page has no photo of its own.

import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-url";

export const SITE_NAME = "Milhaus";

/** public/og-default.jpg — the hero photo, logo and tagline at 1200×630. */
export const DEFAULT_OG_IMAGE = {
  url: "/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "Milhaus — everything you need for life in Germany",
};

/** A page's absolute URL in the given language ("" is the homepage). */
export function localizedUrl(path: string, locale: string): string {
  return `${SITE_URL}${locale === "de" ? "/de" : ""}${path}` || SITE_URL;
}

/** Search snippets cut off around 160 characters — end on a whole word. */
export function metaDescription(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 30)).replace(/[\s,.;:—-]+$/, "")}…`;
}

/** Builds a public page's full metadata: title, trimmed description,
 * canonical, en/de/x-default hreflang, and its Open Graph/Twitter card. */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  images,
  type = "website",
  shareTitle: shareTitleOverride,
}: {
  locale: string;
  /** e.g. "/cars", "/listings?for=sale", "" for the homepage. */
  path: string;
  /** Without the "— Milhaus" suffix; the layout's title template adds it. */
  title?: string;
  description: string;
  /** Absolute or site-relative image URLs; defaults to the branded image. */
  images?: string[];
  type?: "website" | "article" | "profile";
  /** The homepage has no page title of its own (it uses the layout's
   * default), so it passes its full share title here. */
  shareTitle?: string;
}): Metadata {
  const canonical = localizedUrl(path, locale);
  const shareTitle = shareTitleOverride ?? (title ? `${title} — ${SITE_NAME}` : undefined);
  const shareImages = images && images.length > 0 ? images.slice(0, 4).map((url) => ({ url })) : [DEFAULT_OG_IMAGE];
  const desc = metaDescription(description);

  return {
    ...(title ? { title } : {}),
    description: desc,
    alternates: {
      canonical,
      languages: { en: localizedUrl(path, "en"), de: localizedUrl(path, "de"), "x-default": localizedUrl(path, "en") },
    },
    openGraph: {
      ...(shareTitle ? { title: shareTitle } : {}),
      description: desc,
      url: canonical,
      siteName: SITE_NAME,
      type,
      locale: locale === "de" ? "de_DE" : "en_US",
      images: shareImages,
    },
    twitter: {
      card: "summary_large_image",
      ...(shareTitle ? { title: shareTitle } : {}),
      description: desc,
      images: shareImages.map((image) => image.url),
    },
  };
}
