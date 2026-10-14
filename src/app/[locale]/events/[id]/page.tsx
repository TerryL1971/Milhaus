// src/app/[locale]/events/[id]/page.tsx
// A single event's own page — cover photo, date/time, organizer link,
// description, and the picture gallery Charlie asked for. Public, no
// sign-in wall, same as every other listing/business/seller detail page.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getEvent } from "@/lib/events-queries";

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
  return event
    ? { title: event.title, description: event.description ?? undefined }
    : { title: "Event not found", robots: { index: false, follow: false } };
}

export default async function EventDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const t = await getTranslations("EventDetailPage");
  const event = await getEvent(id);
  if (!event) notFound();

  const startsAt = new Date(event.startsAt);
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;

  return (
    <main className="flex-1 pb-14">
      {event.coverImageUrl ? (
        // object-contain, not object-cover — a lot of event covers are
        // flyers (logo/text/QR code throughout, not a photo that tolerates
        // a crop), and most are nowhere near this banner's full-bleed
        // width, so object-cover was both cropping content off and
        // upscaling the image until it looked stretched/blurry. The
        // canvas-deep background fills in the letterboxing instead of
        // leaving it blank.
        <div className="flex h-56 w-full items-center justify-center bg-canvas-deep sm:h-72">
          {/* eslint-disable-next-line @next/next/no-img-element -- external cover image URL */}
          <img src={event.coverImageUrl} alt="" className="h-full w-full object-contain" />
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
              // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
              <img key={url} src={url} alt="" className="aspect-square w-full rounded-md object-cover" />
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
