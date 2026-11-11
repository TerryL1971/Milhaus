// src/app/admin/promotion/page.tsx
// Admin → Promotion (Terry's ask for Charlie, 2026-11-11): one place to
// run a free-posting promotion — switch it on or off, choose which
// categories are free (e.g. only cars, for "free car ads all July"),
// set the first and last free day, and write the green banner shown at
// the top of every page while it runs. Saving updates the site straight
// away. While it runs, the posting pages show those categories' prices
// crossed out with "Free" (src/app/[locale]/post-ad/page.tsx) and
// posting in them skips payment (getPostingPrice in
// src/lib/listing-prices.ts). Replaces the single "Launch promo" date
// box that used to sit on the Pricing page.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { savePromotion, stopPromotion } from "@/app/admin/promotion/actions";
import type { PriceableType } from "@/lib/listing-prices";
import { isAdminRole } from "@/lib/roles";
import { berlinDay, berlinLongDate, getPromotion, PROMO_TYPES } from "@/lib/site-settings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Promotion",
  robots: { index: false, follow: false },
};

const TYPE_LABELS: Record<(typeof PROMO_TYPES)[number], string> = {
  rental: "Homes for rent",
  rental_sale: "Homes for sale",
  car: "Cars",
  business: "Business listings",
};

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-canvas px-3 py-2 text-sm text-charcoal focus:border-olive focus:outline-none";

export default async function AdminPromotionPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/promotion");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  const { saved, error } = await searchParams;
  const promotion = await getPromotion();
  const [tEn, tDe] = await Promise.all([
    getTranslations({ locale: "en", namespace: "PromoBanner" }),
    getTranslations({ locale: "de", namespace: "PromoBanner" }),
  ]);

  const covered = (type: PriceableType) => promotion.types === null || promotion.types.includes(type);
  const coveredLabels = PROMO_TYPES.filter(covered).map((type) => TYPE_LABELS[type].toLowerCase());
  const lastFreeDay = promotion.endsAt ? new Date(promotion.endsAt.getTime() - 1) : null;

  let status: { text: string; tone: "on" | "off" };
  if (promotion.isActive) {
    status = {
      tone: "on",
      text: `Running now — free to post: ${coveredLabels.join(", ")}${
        lastFreeDay ? `, until the end of ${berlinLongDate(lastFreeDay)}` : ", until you switch it off"
      }.`,
    };
  } else if (promotion.isScheduled && promotion.startsAt) {
    status = { tone: "on", text: `Switched on — starts on ${berlinLongDate(promotion.startsAt)}.` };
  } else if (promotion.enabled && lastFreeDay) {
    status = { tone: "off", text: `Ended on ${berlinLongDate(lastFreeDay)}. Normal prices apply.` };
  } else {
    status = { tone: "off", text: "Off — normal prices apply, and no banner shows." };
  }

  const previewEn = promotion.bannerEn ?? tEn("message");
  const previewDe = promotion.bannerDe ?? promotion.bannerEn ?? tDe("message");

  return (
    <main className="flex-1 py-12">
      <div className="mx-auto max-w-[700px] px-8">
        <Link href="/admin" className="mb-2 inline-block text-sm text-ink-soft hover:text-ink">
          ← Admin
        </Link>
        <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Promotion</h1>
        <p className="mb-6 text-ink-soft">
          Make posting free for a while — for everything, or just some categories (for example free car
          ads for the month of July). While it runs, a green banner shows at the top of every page, and the
          posting pages show the normal price crossed out with &quot;Free&quot;. The normal prices are on
          the{" "}
          <Link href="/admin/pricing" className="font-semibold text-olive-deep hover:underline">
            Pricing
          </Link>{" "}
          page.
        </p>

        <p
          className={`mb-6 rounded-md px-3 py-2 text-sm font-semibold ${
            status.tone === "on" ? "bg-olive/15 text-olive-deep" : "bg-canvas-deep text-ink-soft"
          }`}
        >
          {status.text}
        </p>

        {saved && (
          <p role="status" className="mb-4 rounded-md bg-olive/15 px-3 py-2 text-sm font-semibold text-olive-deep">
            ✓ Saved — the site is updated.
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 rounded-md bg-rust/10 px-3 py-2 text-sm font-semibold text-rust">
            {error}
          </p>
        )}

        <form action={savePromotion} className="flex flex-col gap-6 rounded-md border border-canvas-deep bg-paper p-5">
          <label className="flex items-center gap-3 font-semibold text-ink">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={promotion.enabled}
              className="h-5 w-5 accent-olive"
            />
            Promotion switched on
          </label>

          <fieldset>
            <legend className={labelClass}>Free to post</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PROMO_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm text-charcoal">
                  <input
                    type="checkbox"
                    name="types"
                    value={type}
                    defaultChecked={covered(type)}
                    className="h-4 w-4 accent-olive"
                  />
                  {TYPE_LABELS[type]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="from" className={labelClass}>
                First free day
              </label>
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={promotion.startsAt ? berlinDay(promotion.startsAt) : ""}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-ink-soft">Empty = starts as soon as you save.</p>
            </div>
            <div>
              <label htmlFor="until" className={labelClass}>
                Last free day
              </label>
              <input
                id="until"
                name="until"
                type="date"
                defaultValue={lastFreeDay ? berlinDay(lastFreeDay) : ""}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-ink-soft">
                Free until midnight at the end of this day (German time). Empty = until you switch it off.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                name="showBanner"
                defaultChecked={promotion.showBanner}
                className="h-4 w-4 accent-olive"
              />
              Show the banner at the top of every page while it runs
            </label>
            <div>
              <label htmlFor="bannerEn" className={labelClass}>
                Banner text — English
              </label>
              <input
                id="bannerEn"
                name="bannerEn"
                type="text"
                maxLength={200}
                defaultValue={promotion.bannerEn ?? ""}
                placeholder={tEn("message")}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-ink-soft">
                Empty = the standard text shown greyed out above. If only some categories are free, write
                your own, e.g. &quot;🚗 Post your car for free all July!&quot;
              </p>
            </div>
            <div>
              <label htmlFor="bannerDe" className={labelClass}>
                Banner text — German (optional)
              </label>
              <input
                id="bannerDe"
                name="bannerDe"
                type="text"
                maxLength={200}
                defaultValue={promotion.bannerDe ?? ""}
                placeholder={tDe("message")}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-ink-soft">
                Shown on the German site. Empty = your English text, or the standard German text if the
                English is empty too.
              </p>
            </div>
          </div>

          <div>
            <p className={labelClass}>What the banner says now (after saving)</p>
            <div className="mb-1 rounded-md bg-olive px-4 py-2 text-center text-sm font-medium text-paper">
              {previewEn}
            </div>
            <div className="rounded-md bg-olive px-4 py-2 text-center text-sm font-medium text-paper">
              {previewDe}
            </div>
          </div>

          <button
            type="submit"
            className="self-start rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper hover:bg-brass-deep"
          >
            Save
          </button>
        </form>

        {promotion.enabled && (
          <form action={stopPromotion} className="mt-3">
            <button type="submit" className="text-sm font-semibold text-ink-soft hover:text-rust">
              Switch it off now
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
