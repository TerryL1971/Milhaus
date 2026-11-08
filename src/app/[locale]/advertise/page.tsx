// src/app/[locale]/advertise/page.tsx
// Self-serve advertising (Charlie's ask, 2026-11-03): a business picks a
// placement, how many spots and for how long, and adds it to the same
// cart every listing uses. Prices come from Charlie's list at
// /admin/pricing — a placement he hasn't priced yet shows "ask us"
// instead of €0. Bigger or custom deals go through him by email and he
// sends an itemized Stripe invoice instead (/admin/ads/orders).
//
// Every "Advertise here" placeholder on the site links here.

import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { addAdToCart } from "@/app/[locale]/advertise/actions";
import { CartLink } from "@/components/cart-link";
import { AD_BASE_TERMS, AD_MAX_QUANTITY, AD_TERM_OPTIONS, adUnitPrice, termPrice } from "@/lib/ad-pricing";
import { getAdPriceList } from "@/lib/ad-pricing-queries";
import { AD_PLACEMENTS, ADVERTISING_CONTACT_EMAIL, type AdPlacement } from "@/lib/ad-slots";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdvertisePage");
  return pageMetadata({
    locale: await getLocale(),
    path: "/advertise",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none";

const TERM_MONTHS: Record<number, number> = { 30: 1, 90: 3, 180: 6, 365: 12 };

// en-US like every other price on the site.
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

export default async function AdvertisePage() {
  const t = await getTranslations("AdvertisePage");
  const supabase = await createClient();
  const [
    priceList,
    {
      data: { user },
    },
  ] = await Promise.all([getAdPriceList(), supabase.auth.getUser()]);
  const { data: profile } = user
    ? await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
    : { data: null };

  const onSale = AD_PLACEMENTS.filter((placement) => adUnitPrice(priceList, placement, 30) > 0);

  const termLabel = (days: number) =>
    days >= 365 ? t("termYears", { count: days / 365 }) : t(`term${days}` as "term30" | "term90" | "term180");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[1000px] px-8">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink">
            {t("heading")}
          </h1>
          <CartLink />
        </div>
        <p className="mb-10 max-w-[60ch] text-lg text-ink-soft">{t("subhead")}</p>

        <div className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {AD_PLACEMENTS.map((placement) => (
            <PlacementCard
              key={placement}
              placement={placement}
              name={t(`${placement}Name`)}
              where={t(`${placement}Where`)}
              size={t(`${placement}Size`)}
              onSale={onSale.includes(placement)}
              rows={AD_BASE_TERMS.map((term) => {
                const price = termPrice(priceList, placement, term);
                const full = priceList.monthlyEur[placement] * TERM_MONTHS[term];
                const savePct = full > 0 ? Math.round((1 - price / full) * 100) : 0;
                return { label: termLabel(term), price: currency.format(price), savePct };
              })}
              t={{ askUs: t("askUs"), save: (pct: number) => t("save", { pct }) }}
            />
          ))}
        </div>
        <p className="-mt-8 mb-12 text-sm text-ink-soft">{t("longerNote")}</p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.2fr_1fr]">
          <section className="rounded-md border border-canvas-deep bg-paper p-6 shadow-[0_8px_24px_rgba(27,42,58,0.08)]">
            <h2 className="mb-1 font-display text-xl font-semibold text-ink">{t("buyHeading")}</h2>
            <p className="mb-5 text-sm text-ink-soft">{t("buyBody")}</p>

            {onSale.length === 0 ? (
              <p className="rounded-md bg-canvas/60 p-4 text-sm text-ink-soft">
                {t("notOnSale")}{" "}
                <a href={`mailto:${ADVERTISING_CONTACT_EMAIL}`} className="font-semibold text-olive-deep hover:underline">
                  {ADVERTISING_CONTACT_EMAIL}
                </a>
              </p>
            ) : (
              <form action={addAdToCart} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="advertiserName" className={labelClass}>
                    {t("businessName")}
                  </label>
                  <input
                    id="advertiserName"
                    name="advertiserName"
                    required
                    maxLength={120}
                    defaultValue={profile?.display_name ?? ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="placement" className={labelClass}>
                    {t("placement")}
                  </label>
                  <select id="placement" name="placement" required className={inputClass}>
                    {onSale.map((placement) => (
                      <option key={placement} value={placement}>
                        {t(`${placement}Name`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="quantity" className={labelClass}>
                      {t("quantity")}
                    </label>
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min={1}
                      max={AD_MAX_QUANTITY}
                      defaultValue={1}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="days" className={labelClass}>
                      {t("howLong")}
                    </label>
                    <select id="days" name="days" required defaultValue={30} className={inputClass}>
                      {AD_TERM_OPTIONS.map((days) => (
                        <option key={days} value={days}>
                          {termLabel(days)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-ink-soft">{t("clockNote")}</p>
                <button
                  type="submit"
                  className="rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
                >
                  {user ? t("addToCart") : t("signInToBuy")}
                </button>
              </form>
            )}
          </section>

          <section className="rounded-md border border-canvas-deep bg-paper p-6">
            <h2 className="mb-1 font-display text-xl font-semibold text-ink">{t("invoiceHeading")}</h2>
            <p className="mb-5 text-sm text-ink-soft">{t("invoiceBody")}</p>
            <a
              href={`mailto:${ADVERTISING_CONTACT_EMAIL}?subject=${encodeURIComponent(t("invoiceSubject"))}`}
              className="inline-block rounded-md border border-ink px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:border-brass hover:text-brass-deep"
            >
              {t("invoiceCta")}
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}

function PlacementCard({
  placement,
  name,
  where,
  size,
  onSale,
  rows,
  t,
}: {
  placement: AdPlacement;
  name: string;
  where: string;
  size: string;
  onSale: boolean;
  rows: { label: string; price: string; savePct: number }[];
  t: { askUs: string; save: (pct: number) => string };
}) {
  return (
    <div data-placement={placement} className="flex flex-col rounded-md border border-canvas-deep bg-paper p-5">
      <h2 className="mb-1 font-display text-lg font-semibold text-ink">{name}</h2>
      <p className="mb-1 text-sm text-ink-soft">{where}</p>
      <p className="mb-4 font-mono text-[0.7rem] uppercase tracking-wider text-ink-soft/75">{size}</p>
      {onSale ? (
        <table className="mt-auto w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-canvas-deep">
                <td className="py-2 text-ink-soft">{row.label}</td>
                <td className="py-2 text-right">
                  {row.savePct > 0 && (
                    <span className="mr-2 rounded-[3px] bg-olive/15 px-1.5 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-wider text-olive-deep">
                      {t.save(row.savePct)}
                    </span>
                  )}
                  <span className="font-mono font-semibold text-ink">{row.price}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-auto text-sm font-semibold text-ink-soft">{t.askUs}</p>
      )}
    </div>
  );
}
