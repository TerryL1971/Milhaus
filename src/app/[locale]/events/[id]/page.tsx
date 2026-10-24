// src/app/[locale]/events/[id]/page.tsx
// A single event's own page — cover photo, date/time, organizer link,
// description, and the picture gallery Charlie asked for. Public, no
// sign-in wall, same as every other listing/business/seller detail page.

import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getEvent } from "@/lib/events-queries";
import { SITE_URL } from "@/lib/site-url";

const COVER_GRADIENT = "linear-gradient(135deg,#B9C4A3,#6B7353)";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "Event not found", robots: { index: false, follow: false } };

  const description = event.description ?? `${event.title} — ${event.city}, hosted by ${event.organizerName}.`;
  const url = `${SITE_URL}/events/${event.id}`;

  return {
    title: event.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: event.title,
      description,
      url,
      type: "website",
      images: event.coverImageUrl ? [{ url: event.coverImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: event.coverImageUrl ? [event.coverImageUrl] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const t = await getTranslations("EventDetailPage");
  const event = await getEvent(id);
  if (!event) notFound();

  const startsAt = new Date(event.startsAt);
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;

  // Structured data for search/AI answer engines — same reasoning as
  // every other detail page's own JSON-LD block.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || undefined,
    url: `${SITE_URL}/events/${event.id}`,
    startDate: event.startsAt,
    endDate: event.endsAt || undefined,
    image: event.coverImageUrl || (event.photos.length > 0 ? event.photos : undefined),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.base || event.city,
      address: { "@type": "PostalAddress", addressLocality: event.city, addressCountry: "DE" },
    },
    organizer: {
      "@type": "Organization",
      name: event.organizerName,
      url: event.organizerUrl || undefined,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Milhaus", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Events", item: `${SITE_URL}/events` },
      { "@type": "ListItem", position: 3, name: event.title, item: `${SITE_URL}/events/${event.id}` },
    ],
  };

  return (
    <main className="flex-1 pb-14">
      {/* Static JSON we built above, not user input. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {event.coverImageUrl ? (
        // object-contain, not object-cover — a lot of event covers are
        // flyers (logo/text/QR code throughout, not a photo that tolerates
        // a crop), and most are nowhere near this banner's full-bleed
        // width, so object-cover was both cropping content off and
        // upscaling the image until it looked stretched/blurry. The
        // canvas-deep background fills in the letterboxing instead of
        // leaving it blank.
        <div className="relative flex h-56 w-full items-center justify-center bg-canvas-deep sm:h-72">
          <Image src={event.coverImageUrl} alt={event.title} fill sizes="100vw" className="object-contain" priority />
        </div>
      ) : (
        <div className="h-56 w-full sm:h-72" style={{ background: COVER_GRADIENT }} />
      )}

      <div className="mx-auto max-w-[900px] px-8">
        <h1 className="mt-6 font-display text-2xl font-semibold text-ink sm:text-3xl">{event.title}</h1>

        <p className="mt-2 font-semibold text-ink">
          {dateTimeFormatter.format(startsAt)}
          {endsAt ? ` – ${dateTimeFormatter.format(endsAt)}` : ""}
        </p>
        <p className="mt-1 text-ink-soft">
          {event.city}
          {event.base ? ` · Near ${event.base}` : ""}
        </p>

        <p className="mt-3 text-ink-soft">
          {t("organizedBy")}{" "}
          {event.organizerUrl ? (
            <a
              href={event.organizerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-olive-deep hover:underline"
            >
              {event.organizerName}
            </a>
          ) : (
            <span className="font-semibold text-ink">{event.organizerName}</span>
          )}
        </p>

        {event.description && <p className="mt-5 whitespace-pre-line text-ink-soft">{event.description}</p>}

        {event.photos.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {event.photos.map((url) => (
              <div key={url} className="relative aspect-square w-full">
                <Image src={url} alt={event.title} fill sizes="(min-width: 640px) 33vw, 50vw" className="rounded-md object-cover" />
              </div>
            ))}
          </div>
        )}

        <Link href="/events" className="mt-8 inline-block text-sm text-ink-soft hover:text-ink">
          {t("backToEvents")}
        </Link>
      </div>
    </main>
  );
}
