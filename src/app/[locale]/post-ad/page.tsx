// src/app/[locale]/post-ad/page.tsx
// Single "Post an ad" entry point the header CTA links to — a chooser
// between the four existing post flows, which each still handle their
// own sign-in gate (this page doesn't need to). Exists because a single
// prominent CTA button can't itself know which of the four forms to
// open; this is that one extra click instead of four separate buttons
// competing for attention in the header.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PostAdPage");
  return { title: t("metaTitle") };
}

export default async function PostAdPage() {
  const t = await getTranslations("PostAdPage");

  const options = [
    { href: "/post", heading: t("rentalHeading"), body: t("rentalBody") },
    { href: "/post-car", heading: t("carHeading"), body: t("carBody") },
    { href: "/post-product", heading: t("productHeading"), body: t("productBody") },
    { href: "/post-service", heading: t("serviceHeading"), body: t("serviceBody") },
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
              <p className="mb-1 font-display text-xl font-semibold text-ink group-hover:text-olive-deep">
                {option.heading}
              </p>
              <p className="text-sm text-ink-soft">{option.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
