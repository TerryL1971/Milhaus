// src/app/[locale]/post-ad/page.tsx
// Single "Post an ad" entry point the header CTA links to — a chooser
// between the four post flows, which each still handle their own
// sign-in gate (this page doesn't need to). Exists because a single
// prominent CTA button can't itself know which of the four forms to
// open; this is that one extra click instead of four separate buttons
// competing for attention in the header.
//
// Shows each category's price up front — per Terry: the customer has to
// know what a listing costs before clicking through, not discover it
// after already starting the form.
//
// 2026-11-11 (Terry testing prices): every card said FREE for him even
// after he set prices in Admin → Pricing, because his own profile has
// "I'm an individual" ticked — individuals post homes and cars free.
// That was right but unexplained, so a note now says why. This page
// also now follows the "free until" launch promo like the post forms
// do (before, it showed the full price while the promo made posting
// free): the price is crossed out with "Free" under it — only on the
// categories the promotion covers (Admin → Promotion can cover just
// cars, for example).

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CartLink } from "@/components/cart-link";
import { Link } from "@/i18n/navigation";
import { getListingPrices } from "@/lib/listing-prices";
import { getProfile } from "@/lib/profiles";
import { getPromotion, promotionCovers } from "@/lib/site-settings";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PostAdPage");
  return { title: t("metaTitle") };
}

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

export default async function PostAdPage() {
  const t = await getTranslations("PostAdPage");
  const [prices, promo] = await Promise.all([getListingPrices(), getPromotion()]);

  // Business directory submissions aren't covered by the individual-
  // lister discount (submitting a business is, by definition, a
  // business) — only the three "lists your own stuff" categories are.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getProfile(user.id) : null;
  const isIndividual = profile?.isIndividualLister ?? false;
  // Same rules as getPostingPrice / getPostingPriceForProfile in
  // src/lib/listing-prices.ts: the individual tick makes homes and cars
  // free; a running promotion makes the categories it covers free. priceEur is what it would
  // cost without the promo — during the promo the card shows that price
  // crossed out with "Free" under it (Terry, 2026-11-11), so people see
  // what they're saving.
  const priceFor = (price: number, individualsFree: boolean) => (individualsFree && isIndividual ? 0 : price);
  const individualMakesFree =
    isIndividual &&
    (["rental", "rental_sale", "car"] as const).some((type) => prices[type] > 0 && !promotionCovers(promo, type));

  // No "sell an item" option any more — /products became Charlie's
  // Special Offers page (promo cards, not self-listed items), so
  // /post-product isn't promoted from anywhere public any more either.
  // The form itself still works for whoever already has the direct link.
  const options = [
    {
      href: "/post",
      heading: t("rentalHeading"),
      body: t("rentalBody"),
      priceEur: priceFor(prices.rental, true),
      promoFree: promotionCovers(promo, "rental"),
    },
    {
      href: "/post?for=sale",
      heading: t("saleHeading"),
      body: t("saleBody"),
      priceEur: priceFor(prices.rental_sale, true),
      promoFree: promotionCovers(promo, "rental_sale"),
    },
    {
      href: "/post-car",
      heading: t("carHeading"),
      body: t("carBody"),
      priceEur: priceFor(prices.car, true),
      promoFree: promotionCovers(promo, "car"),
    },
    {
      href: "/post-business",
      heading: t("serviceHeading"),
      body: t("serviceBody"),
      priceEur: priceFor(prices.business, false),
      promoFree: promotionCovers(promo, "business"),
    },
  ];

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[760px] px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
            <p className="text-ink-soft">{t("subhead")}</p>
            {individualMakesFree && (
              <p className="mt-3 rounded-md bg-olive/10 px-3 py-2 text-sm text-olive-deep">
                {t.rich("individualNote", {
                  link: (chunks) => (
                    <Link href="/my-listings" className="font-semibold underline">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            )}
          </div>
          <CartLink />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {options.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="group rounded-md border border-canvas-deep bg-paper p-6 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(27,42,58,0.1)]"
            >
              <div className="mb-1 flex items-start justify-between gap-3">
                <p className="font-display text-xl font-semibold text-ink group-hover:text-olive-deep">
                  {option.heading}
                </p>
                {option.promoFree && option.priceEur > 0 ? (
                  // Promotion: normal price crossed out, "Free" under it,
                  // and how long it stays free when the promotion has a
                  // last day ("for 12 days", "today only") — Terry,
                  // 2026-11-11, who also asked for a slightly smaller FREE.
                  <span className="flex flex-shrink-0 flex-col items-end gap-0.5">
                    <s className="mb-0.5 rounded-[3px] bg-canvas-deep/60 px-2 py-0.5 font-mono text-[0.7rem] font-semibold tracking-wider text-ink-soft decoration-brass decoration-2">
                      {currencyFormatter.format(option.priceEur)}
                    </s>
                    <span className="font-body text-sm font-bold uppercase leading-tight tracking-wide text-brass">
                      {t("freeLabel")}
                    </span>
                    {promo.freeDaysLeft !== null && (
                      <span className="whitespace-nowrap font-body text-[0.72rem] font-semibold leading-tight text-brass">
                        {t("freeDaysLeft", { days: promo.freeDaysLeft })}
                      </span>
                    )}
                  </span>
                ) : (
                  <span
                    className={`flex-shrink-0 rounded-[3px] px-2 py-0.5 font-mono text-[0.7rem] font-semibold uppercase tracking-wider ${
                      option.priceEur > 0 ? "bg-brass/15 text-brass-deep" : "bg-olive/15 text-olive-deep"
                    }`}
                  >
                    {option.priceEur > 0 ? currencyFormatter.format(option.priceEur) : t("freeLabel")}
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-soft">{option.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
