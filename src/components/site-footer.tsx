// src/components/site-footer.tsx
// Ported from the "FOOTER" section of
// /design-reference/milhaus-landing-mockup.html.

import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getListingPrices } from "@/lib/listing-prices";

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

/** "List your home" -> "List your home — €10" — Terry's ask: these four
 * links are a direct, one-click path to a paid posting flow, so the
 * price needs to show before the click, not just once the form opens
 * (PostingPriceNotice handles that half already). */
function withPrice(label: string, priceEur: number): string {
  return priceEur > 0 ? `${label} — ${currencyFormatter.format(priceEur)}` : label;
}

export async function SiteFooter() {
  const t = await getTranslations("SiteFooter");
  const prices = await getListingPrices();

  const columns = [
    {
      heading: t("forRentersHeading"),
      links: [
        { label: t("browseListings"), href: "/listings" },
        { label: t("howVerificationWorks"), href: "/how-verification-works" },
      ],
    },
    {
      heading: t("forListersHeading"),
      links: [
        { label: withPrice(t("postAHome"), prices.rental), href: "/post" },
        { label: t("forLandlords"), href: "/for-landlords" },
        { label: t("myListings"), href: "/my-listings" },
      ],
    },
    {
      heading: t("carsHeading"),
      links: [
        { label: t("browseCars"), href: "/cars" },
        { label: withPrice(t("sellYourCar"), prices.car), href: "/post-car" },
      ],
    },
    {
      // Charlie's promo cards now, not real self-listed items — no
      // "sell something" link here any more (/post-product still works,
      // just isn't promoted from anywhere public, same as /post-service).
      heading: t("productsHeading"),
      links: [{ label: t("browseProducts"), href: "/products" }],
    },
    {
      heading: t("servicesHeading"),
      links: [
        { label: t("browseServices"), href: "/services" },
        { label: withPrice(t("suggestBusiness"), prices.business), href: "/post-business" },
      ],
    },
    {
      heading: t("aboutHeading"),
      links: [
        // Both Terms and Impressum now have real pages — Charlie sent
        // the ToS text 2026-10-22 (src/app/[locale]/terms) and the
        // remaining Impressum facts (phone/VAT ID/address/Handelsregister
        // status/VSBG stance) the same day (src/app/[locale]/impressum).
        { label: t("contact"), href: "mailto:info@milhaus.de" },
        { label: t("terms"), href: "/terms" },
        { label: t("impressum"), href: "/impressum" },
      ],
    },
  ];

  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-[1600px] px-8 pb-7 pt-11">
        <div className="mb-4.5 flex flex-wrap justify-between gap-6 border-b border-paper/15 pb-7">
          <div className="flex items-center">
            {/* h-7 below md — see site-header.tsx for why this logo
                needs a smaller mobile size (it overflows a phone's width
                at h-10). */}
            <Image
              src="/brand/milhaus-logo-cream-red-horizontal.png"
              alt="Milhaus"
              width={1994}
              height={236}
              className="h-7 w-auto md:h-10"
            />
          </div>

          <div className="flex flex-wrap gap-12">
            {columns.map((col) => (
              <div key={col.heading}>
                <h4 className="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-brass">
                  {col.heading}
                </h4>
                {col.links.map((link) =>
                  // mailto: links aren't an internal route — the i18n Link
                  // below assumes a pathname and would wrongly prefix one
                  // with the locale segment.
                  link.href.startsWith("mailto:") ? (
                    <a
                      key={link.label}
                      href={link.href}
                      className="mb-2 block text-[0.86rem] opacity-80 transition-opacity last:mb-0 hover:opacity-100"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="mb-2 block text-[0.86rem] opacity-80 transition-opacity last:mb-0 hover:opacity-100"
                    >
                      {link.label}
                    </Link>
                  ),
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[0.78rem] opacity-55">{t("tagline")}</p>
      </div>
    </footer>
  );
}
