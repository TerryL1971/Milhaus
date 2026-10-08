// src/components/site-footer.tsx
// Ported from the "FOOTER" section of
// /design-reference/milhaus-landing-mockup.html.

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("SiteFooter");

  const columns = [
    {
      heading: t("forRentersHeading"),
      links: [
        { label: t("browseListings"), href: "/#listings" },
        { label: t("howVerificationWorks"), href: "/how-verification-works" },
      ],
    },
    {
      heading: t("forListersHeading"),
      links: [
        { label: t("postAHome"), href: "/post" },
        { label: t("forLandlords"), href: "/for-landlords" },
        { label: t("myListings"), href: "/my-listings" },
      ],
    },
    {
      heading: t("carsHeading"),
      links: [
        { label: t("browseCars"), href: "/cars" },
        { label: t("sellYourCar"), href: "/post-car" },
      ],
    },
    {
      heading: t("productsHeading"),
      links: [
        { label: t("browseProducts"), href: "/products" },
        { label: t("sellSomething"), href: "/post-product" },
      ],
    },
    {
      heading: t("servicesHeading"),
      links: [
        { label: t("browseServices"), href: "/services" },
        { label: t("suggestBusiness"), href: "mailto:hello@example.com?subject=Business%20suggestion%20for%20Milhaus" },
      ],
    },
    {
      heading: t("aboutHeading"),
      links: [
        { label: t("contact"), href: "#" },
        { label: t("impressum"), href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-[1400px] px-8 pb-7 pt-11">
        <div className="mb-4.5 flex flex-wrap justify-between gap-6 border-b border-paper/15 pb-7">
          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, not worth next/image's config here */}
            <img src="/brand/milhaus-logo-cream-red-horizontal.png" alt="Milhaus" className="h-10 w-auto" />
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
