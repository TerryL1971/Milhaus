// src/app/how-verification-works/page.tsx
// Renter-facing explainer, linked from the footer's "How verification
// works" link (previously "#"). No external dependency — content mirrors
// what's already true of the review pipeline (admin/actions.ts:
// approveListing/rejectListing) and the stamp badge (StampBadge,
// listings.source === "housing_office").

import type { Metadata } from "next";
import Link from "next/link";
import { StampBadge } from "@/components/stamp-badge";

export const metadata: Metadata = {
  title: "How verification works",
  description:
    "How every milhaus listing gets checked before it goes live, and what the housing-office stamp means.",
};

const reviewSteps = [
  {
    num: "01",
    heading: "Someone submits it",
    body: "A PCSing family lists the home they're leaving, or it comes in through the on-base housing office feed.",
  },
  {
    num: "02",
    heading: "We check it",
    body: "Every self-listed submission is reviewed by hand before it's visible to anyone — usually the same day. Nothing goes live automatically.",
  },
  {
    num: "03",
    heading: "It's live — until it isn't",
    body: "One tap takes a listing off the site the moment it's rented. No calling about a place that's been gone for three weeks.",
  },
];

export default function HowVerificationWorksPage() {
  return (
    <main className="flex-1">
      {/* ---------- HERO ---------- */}
      <section className="py-16">
        <div className="mx-auto max-w-[720px] px-8 text-center">
          <div className="mb-4.5 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-olive-deep">
            <span className="inline-block h-1.5 w-1.5 rotate-45 bg-olive" />
            How it works
          </div>
          <h1 className="mb-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink lg:text-5xl">
            Nothing goes live unchecked.
          </h1>
          <p className="mx-auto max-w-[52ch] text-lg text-ink-soft">
            Every listing on milhaus — whether it came from the housing office or a family
            rotating out — is reviewed before it&apos;s visible, and taken down the day it&apos;s gone.
          </p>
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
            <h2 className="mb-2 font-display text-xl font-semibold text-ink">
              The stamp means it came from the housing office
            </h2>
            <p className="max-w-[56ch] text-sm text-ink-soft">
              Listings with this mark are a direct feed from the on-base housing office, not
              scraped or self-submitted. A listing without it is a self-listed home from an
              outgoing family — still reviewed, just sourced differently. Both go through the same
              check before they&apos;re visible; the stamp only tells you where a listing came from.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- CTA STRIP ---------- */}
      <section className="bg-rust py-11 text-center text-paper">
        <div className="mx-auto max-w-[1180px] px-8">
          <h2 className="mb-2.5 font-display text-[1.7rem] font-semibold text-paper">
            Ready to look?
          </h2>
          <p className="mb-5.5 text-[0.96rem] opacity-90">
            Every listing you&apos;ll see has already been through this.
          </p>
          <Link
            href="/#listings"
            className="inline-block rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            Browse open listings
          </Link>
        </div>
      </section>
    </main>
  );
}
