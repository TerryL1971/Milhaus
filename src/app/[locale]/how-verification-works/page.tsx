// src/app/[locale]/how-verification-works/page.tsx
// Renter-facing explainer, linked from the footer's "How verification
// works" link (previously "#"). No external dependency — content mirrors
// what's already true of the review pipeline (admin/actions.ts:
// approveListing/rejectListing). The housing-office stamp section is
// gone (2026-11-04, after Charlie and Terry met the on-base Housing
// Office — nothing may suggest the Housing Office lists or approves homes).

import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    locale: await getLocale(),
    path: "/how-verification-works",
    title: "How verification works",
    description: "How every Milhaus listing gets checked before it goes live, and taken down once it's gone.",
  });
}

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

      {/* ---------- CTA STRIP ---------- */}
      <section className="bg-rust py-11 text-center text-paper">
        <div className="mx-auto max-w-[1600px] px-8">
          <h2 className="mb-2.5 font-display text-[1.7rem] font-semibold text-paper">
            {t("ctaHeading")}
          </h2>
          <p className="mb-5.5 text-[0.96rem] opacity-90">{t("ctaBody")}</p>
          <Link
            href="/listings"
            className="inline-block rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {t("ctaButton")}
          </Link>
        </div>
      </section>
    </main>
  );
}
