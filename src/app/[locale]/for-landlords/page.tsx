// src/app/[locale]/for-landlords/page.tsx
// Marketing page for property owners/managers — linked from the header and
// footer's "For landlords" links (previously both pointed at "#"). Two
// distinct paths on purpose: an individual with one property uses the same
// self-list flow as a PCSing family; a property manager or on-base housing
// office with multiple units isn't self-serve (CLAUDE.md rules out bulk-
// import tooling for MVP) and goes through Charlie by email instead.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "For landlords",
  description:
    "List a property with milhaus — for individual owners with one home, or property managers and on-base housing offices with multiple units.",
};

export default async function ForLandlordsPage() {
  const t = await getTranslations("ForLandlords");

  const trustItems = [
    { heading: t("trust1Heading"), body: t("trust1Body") },
    { heading: t("trust2Heading"), body: t("trust2Body") },
    { heading: t("trust3Heading"), body: t("trust3Body") },
  ];

  return (
    <main className="flex-1">
      {/* ---------- HERO ---------- */}
      <section className="py-16">
        <div className="mx-auto max-w-[720px] px-8 text-center">
          <div className="mb-4.5 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-olive-deep">
            <span className="inline-block h-1.5 w-1.5 rotate-45 bg-olive" />
            {t("eyebrow")}
          </div>
          <h1 className="mb-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink lg:text-5xl">
            {t("heading")}
          </h1>
          <p className="mx-auto max-w-[52ch] text-lg text-ink-soft">{t("subhead")}</p>
        </div>
      </section>

      {/* ---------- TWO PATHS ---------- */}
      <section className="pb-16">
        <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-6 px-8 md:grid-cols-2">
          <div className="flex flex-col rounded-md border border-canvas-deep bg-paper p-7">
            <span className="mb-3 inline-block w-fit rounded-full bg-olive/15 px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-olive-deep">
              {t("onePropertyTag")}
            </span>
            <h2 className="mb-2 font-display text-xl font-semibold text-ink">
              {t("onePropertyHeading")}
            </h2>
            <p className="mb-6 flex-1 text-sm text-ink-soft">{t("onePropertyBody")}</p>
            <Link
              href="/post"
              className="inline-block w-fit rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
            >
              {t("onePropertyCta")}
            </Link>
          </div>

          <div className="flex flex-col rounded-md border border-canvas-deep bg-paper p-7">
            <span className="mb-3 inline-block w-fit rounded-full bg-brass/20 px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-brass-deep">
              {t("multiUnitTag")}
            </span>
            <h2 className="mb-2 font-display text-xl font-semibold text-ink">
              {t("multiUnitHeading")}
            </h2>
            <p className="mb-6 flex-1 text-sm text-ink-soft">{t("multiUnitBody")}</p>
            {/* TODO(charlie): swap for a real inbox before launch — this
                placeholder deliberately uses the reserved example.com domain
                (RFC 2606) so it can't accidentally email a real stranger. */}
            <a
              href="mailto:hello@example.com"
              className="inline-block w-fit rounded-md border border-ink px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:border-brass hover:text-brass-deep"
            >
              {t("multiUnitCta")}
            </a>
          </div>
        </div>
      </section>

      {/* ---------- TRUST STRIP ---------- */}
      <section className="bg-ink py-8.5 text-paper">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-7 px-8 md:grid-cols-3">
          {trustItems.map((item, index) => (
            <div key={item.heading} className="flex gap-3.5">
              <div className="flex h-8.5 w-8.5 flex-none items-center justify-center rounded-full border-[1.5px] border-brass font-mono text-sm text-brass">
                {index + 1}
              </div>
              <p className="text-sm opacity-85">
                <strong className="mb-0.5 block text-[0.94rem] font-semibold">
                  {item.heading}
                </strong>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA STRIP ---------- */}
      <section className="bg-rust py-11 text-center text-paper">
        <div className="mx-auto max-w-[1180px] px-8">
          <h2 className="mb-2.5 font-display text-[1.7rem] font-semibold text-paper">
            {t("ctaHeading")}
          </h2>
          <p className="mb-5.5 text-[0.96rem] opacity-90">{t("ctaBody")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/post"
              className="inline-block rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
            >
              {t("ctaListButton")}
            </Link>
            <a
              href="mailto:hello@example.com"
              className="inline-block rounded-md border border-paper/50 px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:border-paper"
            >
              {t("ctaContactButton")}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
