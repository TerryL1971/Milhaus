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

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getListingPrices } from "@/lib/listing-prices";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PostAdPage");
  return { title: t("metaTitle") };
}

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

export default async function PostAdPage() {
  const t = await getTranslations("PostAdPage");
  const prices = await getListingPrices();

  const options = [
    { href: "/post", heading: t("rentalHeading"), body: t("rentalBody"), priceEur: prices.rental },
    { href: "/post-car", heading: t("carHeading"), body: t("carBody"), priceEur: prices.car },
    { href: "/post-product", heading: t("productHeading"), body: t("productBody"), priceEur: prices.product },
    { href: "/post-business", heading: t("serviceHeading"), body: t("serviceBody"), priceEur: prices.business },
  ];

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[760px] px-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
        <p className="mb-8 text-ink-soft">{t("subhead")}</p>

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
                <span
                  className={`flex-shrink-0 rounded-[3px] px-2 py-0.5 font-mono text-[0.7rem] font-semibold uppercase tracking-wider ${
                    option.priceEur > 0 ? "bg-brass/15 text-brass-deep" : "bg-olive/15 text-olive-deep"
                  }`}
                >
                  {option.priceEur > 0 ? currencyFormatter.format(option.priceEur) : t("freeLabel")}
                </span>
              </div>
              <p className="text-sm text-ink-soft">{option.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
