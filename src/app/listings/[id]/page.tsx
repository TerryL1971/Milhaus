// src/app/listings/[id]/page.tsx
// Listing detail page (build order step 4). Shows the full graphical
// StampBadge for housing_office listings — the grid card only has room for
// the compact checkmark/dash line, but CLAUDE.md calls for the stamp to be
// visible on both the grid and here.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StampBadge } from "@/components/stamp-badge";
import { getListingById } from "@/lib/listings";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return { title: "Listing not found — milhaus" };
  return {
    title: `${listing.city} · ${currencyFormatter.format(listing.priceEurMonth)}/mo — milhaus`,
    description: listing.description || `${listing.bedrooms}-bedroom home in ${listing.city}.`,
  };
}

export default async function ListingDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const isRented = listing.status === "rented";
  const isHousingOffice = listing.source === "housing_office";

  return (
    <main className="flex-1 py-10">
      <div className="mx-auto max-w-[860px] px-8">
        <Link href="/#listings" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          ← Back to listings
        </Link>

        <div
          className="relative h-72 rounded-md sm:h-96"
          style={{ background: "linear-gradient(135deg, #C9B896, #8E9B7A 60%, #6B7353)" }}
        >
          {isHousingOffice && <StampBadge size="lg" className="right-4 top-4" />}
        </div>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              {listing.city}
              {listing.distanceToBase ? ` · ${listing.distanceToBase}` : ""}
            </h1>
            <p className="mt-1 text-ink-soft">{listing.address}</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-semibold text-ink">
              {currencyFormatter.format(listing.priceEurMonth)}
              <span className="text-base font-normal text-ink-soft"> / mo</span>
            </div>
            <span
              className={`mt-1 inline-block rounded-[3px] px-2 py-0.5 font-mono text-[0.7rem] font-semibold uppercase tracking-wider ${
                isRented ? "bg-rust/10 text-rust line-through" : "bg-olive/15 text-olive-deep"
              }`}
            >
              {isRented ? "Rented" : "Available"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex gap-6 border-y border-canvas-deep py-4 font-mono text-sm text-charcoal/80">
          <span>{listing.bedrooms} bed</span>
          <span>{listing.bathrooms} bath</span>
          {listing.sizeSqm != null && <span>{listing.sizeSqm} m²</span>}
          {listing.availableFrom && (
            <span>Available {dateFormatter.format(new Date(listing.availableFrom))}</span>
          )}
        </div>

        {listing.description && (
          <p className="mt-6 whitespace-pre-line text-[0.98rem] leading-relaxed text-charcoal">
            {listing.description}
          </p>
        )}

        <p
          className={`mt-6 flex items-center gap-1.5 text-sm ${
            isHousingOffice ? "text-olive-deep" : "text-[#8A8272]"
          }`}
        >
          <span className="font-bold">{isHousingOffice ? "✓" : "—"}</span>
          {isHousingOffice ? "Housing office listing" : "Listed by outgoing family"}
        </p>

        <div className="mt-8 rounded-md border border-canvas-deep bg-paper p-5">
          <p className="mb-3 text-sm text-ink-soft">
            Interested in this home? Sign in to contact the lister.
          </p>
          <Link
            href="/sign-in"
            className="inline-block rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
