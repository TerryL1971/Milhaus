// src/app/[locale]/my-ads/page.tsx
// An advertiser's bought ad spots (from /advertise, or an invoice
// Charlie linked to their account) — add artwork to put one live, swap
// it while it runs, see when each one ends. Spots Charlie sold by
// invoice to someone without an account never show up here; he adds
// their artwork himself in /admin/ads.

import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { saveMyAdSpot } from "@/app/[locale]/my-ads/actions";
import { getPathname, Link, redirect } from "@/i18n/navigation";
import { mapAdSlotRow } from "@/lib/ad-slots-queries";
import { AD_PLACEMENT_SIZES, type AdSlot } from "@/lib/ad-slots";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My ads",
  robots: { index: false, follow: false },
};

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-canvas px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none";

export default async function MyAdsPage() {
  const t = await getTranslations("MyAdsPage");
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: `/sign-in?next=${getPathname({ href: "/my-ads", locale })}`, locale });
    return;
  }

  const { data } = await supabase
    .from("ad_slots")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });
  const spots = (data ?? []).map(mapAdSlotRow);

  // eslint-disable-next-line react-hooks/purity -- a server render, once per request
  const now = Date.now();
  const finished = (spot: AdSlot) => spot.endsAt !== null && new Date(spot.endsAt).getTime() <= now;
  const groups = [
    { key: "needsArtwork", spots: spots.filter((s) => !s.isActive && !s.endsAt) },
    { key: "live", spots: spots.filter((s) => s.endsAt !== null && !finished(s)) },
    { key: "finished", spots: spots.filter(finished) },
  ] as const;

  const dateFormat = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", { dateStyle: "long" });

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[760px] px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mb-1 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
            <p className="text-ink-soft">{t("subhead")}</p>
          </div>
          <Link
            href="/advertise"
            className="whitespace-nowrap rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {t("buyMore")}
          </Link>
        </div>

        {spots.length === 0 && <p className="text-ink-soft">{t("empty")}</p>}

        {groups.map(
          (group) =>
            group.spots.length > 0 && (
              <section key={group.key} className="mb-10">
                <h2 className="mb-1 font-display text-xl font-semibold text-ink">
                  {t(`${group.key}Heading`)} ({group.spots.length})
                </h2>
                <p className="mb-4 text-sm text-ink-soft">{t(`${group.key}Note`)}</p>
                <div className="flex flex-col gap-4">
                  {group.spots.map((spot, index) => (
                    <div key={spot.id} className="rounded-md border border-canvas-deep bg-paper p-5">
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold text-ink">
                          {t(`placement_${spot.placement}`)} · {t("spotNumber", { number: index + 1 })}
                        </p>
                        <p className="font-mono text-xs uppercase tracking-wider text-ink-soft/75">
                          {spot.endsAt
                            ? t(finished(spot) ? "endedOn" : "liveUntil", { date: dateFormat.format(new Date(spot.endsAt)) })
                            : t("runsFor", { days: spot.durationDays ?? 0 })}
                        </p>
                      </div>

                      {spot.imageUrl && (
                        <div className="relative mb-4 h-24 w-full overflow-hidden rounded bg-canvas">
                          <Image src={spot.imageUrl} alt="" fill sizes="700px" className="object-contain" />
                        </div>
                      )}

                      {!finished(spot) && (
                        <form action={saveMyAdSpot} className="flex flex-col gap-3">
                          <input type="hidden" name="id" value={spot.id} />
                          <div>
                            <label htmlFor={`link-${spot.id}`} className={labelClass}>
                              {t("linkUrl")}
                            </label>
                            <input
                              id={`link-${spot.id}`}
                              name="linkUrl"
                              type="url"
                              required
                              placeholder="https://"
                              defaultValue={spot.linkUrl}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label htmlFor={`image-${spot.id}`} className={labelClass}>
                              {spot.imageUrl ? t("replaceImage") : t("image")}
                            </label>
                            <input
                              id={`image-${spot.id}`}
                              name="image"
                              type="file"
                              accept="image/*"
                              className="text-sm text-ink-soft"
                            />
                            <p className="mt-1 text-xs text-ink-soft">{AD_PLACEMENT_SIZES[spot.placement]}</p>
                          </div>
                          <details className="text-sm">
                            <summary className="cursor-pointer text-ink-soft">{t("textInstead")}</summary>
                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label htmlFor={`heading-${spot.id}`} className={labelClass}>
                                  {t("textHeading")}
                                </label>
                                <input
                                  id={`heading-${spot.id}`}
                                  name="heading"
                                  maxLength={80}
                                  defaultValue={spot.heading ?? ""}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label htmlFor={`body-${spot.id}`} className={labelClass}>
                                  {t("textBody")}
                                </label>
                                <input
                                  id={`body-${spot.id}`}
                                  name="bodyText"
                                  maxLength={140}
                                  defaultValue={spot.bodyText ?? ""}
                                  className={inputClass}
                                />
                              </div>
                            </div>
                          </details>
                          <button
                            type="submit"
                            className="w-fit rounded-md bg-brass px-5 py-2 text-sm font-semibold text-paper hover:bg-brass-deep"
                          >
                            {spot.isActive ? t("saveChanges") : t("putLive")}
                          </button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ),
        )}
      </div>
    </main>
  );
}
