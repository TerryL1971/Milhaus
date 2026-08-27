// src/app/[locale]/how-verification-works/page.tsx
// Renter-facing explainer, linked from the footer's "How verification
// works" link (previously "#"). No external dependency — content mirrors
// what's already true of the review pipeline (admin/actions.ts:
// approveListing/rejectListing) and the stamp badge (StampBadge,
// listings.source === "housing_office").

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StampBadge } from "@/components/stamp-badge";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "How verification works",
  description:
    "How every milhaus listing gets checked before it goes live, and what the housing-office stamp means.",
};

export default async function HowVerificationWorksPage() {
  const t = await getTranslations("HowVerification");

  const reviewSteps = [
    { num: t("step1Num"), heading: t("step1Heading"), body: t("step1Body") },
    { num: t("step2Num"), heading: t("step2Heading"), body: t("step2Body") },
    { num: t("step3Num"), heading: t("step3Heading"), body: t("step3Body") },
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

      {/* ---------- REVIEW STEPS ---------- */}
      <section className="bg-canvas-deep py-16">
        <div className="mx-auto max-w-[1000px] px-8">
          <div className="grid grid-cols-1 gap-7.5 md:grid-cols-3">
            {reviewSteps.map((step) => (
              <div key={step.num}>
                <div className="mb-2.5 font-display text-[2.6rem] font-bold leading-none text-brass/90">
                  {step.num}
                </div>
                <h2 className="mb-2 font-display text-xl font-semibold text-ink">{step.heading}</h2>
                <p className="max-w-[32ch] text-sm text-ink-soft">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- THE STAMP ---------- */}
      <section className="py-16">
        <div className="mx-auto grid max-w-[1000px] grid-cols-1 items-center gap-10 px-8 md:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            <div className="relative h-16 w-16">
              <StampBadge size="lg" className="left-0 top-0" />
            </div>
          </div>
          <div>
            <h2 className="mb-2 font-display text-xl font-semibold text-ink">{t("stampHeading")}</h2>
            <p className="max-w-[56ch] text-sm text-ink-soft">{t("stampBody")}</p>
          </div>
        </div>
      </section>

      {/* ---------- CTA STRIP ---------- */}
      <section className="bg-rust py-11 text-center text-paper">
        <div className="mx-auto max-w-[1180px] px-8">
          <h2 className="mb-2.5 font-display text-[1.7rem] font-semibold text-paper">
            {t("ctaHeading")}
          </h2>
          <p className="mb-5.5 text-[0.96rem] opacity-90">{t("ctaBody")}</p>
          <Link
            href="/#listings"
            className="inline-block rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {t("ctaButton")}
          </Link>
        </div>
      </section>
    </main>
  );
}
