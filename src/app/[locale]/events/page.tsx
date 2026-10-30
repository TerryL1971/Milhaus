// src/app/[locale]/events/page.tsx
// Browse events — Charlie's ask (his ideas slide, 2026-10-14): a calendar
// of events with links to the organizer and pictures. No self-serve
// posting button here (unlike /services' "Offer something") — Charlie
// hand-enters every event from /admin/events, same model as the
// businesses directory started with.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EventsBrowser } from "@/components/events-browser";
import { SponsorBannerCarousel } from "@/components/sponsor-banner-carousel";
import { getActiveEvents } from "@/lib/events-queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("EventsPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

type SearchParams = Promise<{ q?: string }>;

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("EventsPage");
  const { q } = await searchParams;
  const events = await getActiveEvents();

  return (
    <main className="flex-1">
      <SponsorBannerCarousel />
      <div className="mx-auto max-w-[1600px] px-8 py-8 sm:py-11 lg:py-14">
        <div className="mb-8">
          <h1 className="font-display text-[clamp(1.5rem,7.5vw,2rem)] font-semibold text-ink">{t("heading")}</h1>
          <p className="mt-1 max-w-[52ch] text-ink-soft">{t("subhead")}</p>
        </div>

        <EventsBrowser events={events} initialQuery={q} />
      </div>
    </main>
  );
}
