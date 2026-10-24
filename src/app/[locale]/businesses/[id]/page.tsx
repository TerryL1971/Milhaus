// src/app/[locale]/businesses/[id]/page.tsx
// A business's own profile page — Charlie's ask, modeled on a LinkedIn-
// style layout: a wide cover/hero image with the logo overlapping it
// like a profile picture, name and category below, then a promotion
// callout, the full description, tags, and the social-links row. Public,
// no sign-in wall, same as /sellers/[id] and every listing detail page.

import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BusinessSocialLinks } from "@/components/business-social-links";
import { Link } from "@/i18n/navigation";
import { BUSINESS_CATEGORY_LABELS, BUSINESS_TAG_LABELS, type BusinessTagKey } from "@/lib/businesses";
import { getBusiness } from "@/lib/businesses-queries";
import { SITE_URL } from "@/lib/site-url";

const COVER_GRADIENT = "linear-gradient(135deg,#C3B79D,#8C9873)";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const business = await getBusiness(id);
  if (!business) return { title: "Business not found", robots: { index: false, follow: false } };

  const description =
    business.description ?? `${BUSINESS_CATEGORY_LABELS[business.category]} in ${business.city}.`;
  const url = `${SITE_URL}/businesses/${business.id}`;

  return {
    title: business.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: business.name,
      description,
      url,
      type: "website",
      images: business.coverImageUrl ? [{ url: business.coverImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: business.name,
      description,
      images: business.coverImageUrl ? [business.coverImageUrl] : undefined,
    },
  };
}

export default async function BusinessProfilePage({ params }: { params: Params }) {
  const { id } = await params;
  const business = await getBusiness(id);
  if (!business) notFound();

  // Structured data for search/AI answer engines — directly matches
  // Charlie's own stated AEO target ("military friendly business
  // Stuttgart"): LocalBusiness is the schema.org type built for exactly
  // this query shape.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description || undefined,
    url: `${SITE_URL}/businesses/${business.id}`,
    image: business.coverImageUrl || business.logoUrl || undefined,
    telephone: business.phone || undefined,
    address: { "@type": "PostalAddress", addressLocality: business.city, addressCountry: "DE" },
    aggregateRating:
      business.rating != null
        ? {
            "@type": "AggregateRating",
            ratingValue: business.rating,
            reviewCount: business.reviewCount ?? 1,
          }
        : undefined,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Milhaus", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
      { "@type": "ListItem", position: 3, name: business.name, item: `${SITE_URL}/businesses/${business.id}` },
    ],
  };

  return (
    <main className="flex-1 pb-14">
      {/* Static JSON we built above, not user input. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {business.coverImageUrl ? (
        <div className="relative h-56 w-full sm:h-72">
          <Image src={business.coverImageUrl} alt="" fill sizes="100vw" className="object-cover" priority />
        </div>
      ) : (
        <div className="h-56 w-full sm:h-72" style={{ background: COVER_GRADIENT }} />
      )}

      <div className="mx-auto max-w-[900px] px-8">
        <div className="flex items-end gap-4">
          {business.logoUrl ? (
            <Image
              src={business.logoUrl}
              alt={`${business.name} logo`}
              width={112}
              height={112}
              className="relative z-10 -mt-12 h-24 w-24 flex-shrink-0 rounded-md border-4 border-paper bg-paper object-contain shadow-md sm:h-28 sm:w-28"
            />
          ) : (
            <div className="relative z-10 -mt-12 flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-md border-4 border-paper bg-ink font-display text-3xl font-semibold text-paper shadow-md sm:h-28 sm:w-28">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{business.name}</h1>
            <p className="mt-1 text-ink-soft">
              {BUSINESS_CATEGORY_LABELS[business.category]} · {business.city}
              {business.base ? ` · Near ${business.base}` : ""}
            </p>
            {business.rating != null && (
              <p className="mt-1 font-mono text-sm text-brass-deep">
                ★ {business.rating.toFixed(1)}
                {business.reviewCount != null && <span className="text-ink-soft"> ({business.reviewCount} reviews)</span>}
              </p>
            )}
          </div>
          <BusinessSocialLinks business={business} size="md" />
        </div>

        {business.promotion && (
          <p className="mt-5 rounded-md bg-brass/15 px-4 py-3 font-semibold text-brass-deep">{business.promotion}</p>
        )}

        {business.description && <p className="mt-5 whitespace-pre-line text-ink-soft">{business.description}</p>}

        {business.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {business.tags.map((tag: BusinessTagKey) => (
              <span
                key={tag}
                className="rounded-[3px] bg-olive/15 px-2 py-0.5 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-olive-deep"
              >
                {BUSINESS_TAG_LABELS[tag]}
              </span>
            ))}
          </div>
        )}

        <Link href="/services" className="mt-8 inline-block text-sm text-ink-soft hover:text-ink">
          ← Back to Military-Friendly Businesses
        </Link>
      </div>
    </main>
  );
}
