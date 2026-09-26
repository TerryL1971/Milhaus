// src/app/[locale]/my-listings/page.tsx
// A poster's own dashboard — every listing they've posted (rental or
// car), any status, with one-click status actions, plus the public
// profile editor that shows up on SellerCard everywhere their listings
// appear. This is the "BMW dealer with 20 cars" answer: one account, one
// place to keep up with everything posted under it, same idea as
// bookoo's "My Items" — styled like the rest of Milhaus, not like bookoo.
//
// No content editing yet (title/price/photos are fixed after submission)
// — status changes only for now; full edit is a fast-follow.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { archiveMyListing, markMyListingRented, resubmitMyListing } from "./actions";
import { ProfileEditor } from "@/components/profile-editor";
import { Link } from "@/i18n/navigation";
import { getMyListings } from "@/lib/listings";
import { getProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";
import type { Listing, ListingStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "My listings",
  robots: { index: false, follow: false },
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function listingLabel(listing: Listing): string {
  return listing.type === "car" ? `${listing.year} ${listing.make} ${listing.model}` : listing.title;
}

const LISTING_PATH: Record<Listing["type"], string> = {
  rental: "/listings",
  car: "/cars",
  product: "/products",
  service: "/services",
};

function listingHref(listing: Listing): string {
  return `${LISTING_PATH[listing.type]}/${listing.id}`;
}

export default async function MyListingsPage() {
  const t = await getTranslations("MyListings");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/my-listings");

  const [listings, profile] = await Promise.all([getMyListings(user.id), getProfile(user.id)]);

  const groups: { status: ListingStatus; heading: string; empty: string }[] = [
    { status: "pending_review", heading: t("pendingHeading"), empty: t("pendingEmpty") },
    { status: "active", heading: t("activeHeading"), empty: t("activeEmpty") },
    { status: "rented", heading: t("rentedHeading"), empty: t("rentedEmpty") },
    { status: "archived", heading: t("archivedHeading"), empty: t("archivedEmpty") },
    { status: "draft", heading: t("draftHeading"), empty: "" },
  ];

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[760px] px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mb-1 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
            <p className="text-ink-soft">{t("subhead")}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/post"
              className="rounded-md border border-canvas-deep px-4 py-2.5 text-sm font-semibold text-ink-soft transition-[transform] hover:-translate-y-px hover:border-olive hover:text-olive-deep"
            >
              {t("postHome")}
            </Link>
            <Link
              href="/post-car"
              className="rounded-md border border-canvas-deep px-4 py-2.5 text-sm font-semibold text-ink-soft transition-[transform] hover:-translate-y-px hover:border-olive hover:text-olive-deep"
            >
              {t("postCar")}
            </Link>
            <Link
              href="/post-product"
              className="rounded-md border border-canvas-deep px-4 py-2.5 text-sm font-semibold text-ink-soft transition-[transform] hover:-translate-y-px hover:border-olive hover:text-olive-deep"
            >
              {t("postProduct")}
            </Link>
            <Link
              href="/post-service"
              className="rounded-md bg-brass px-4 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
            >
              {t("postService")}
            </Link>
          </div>
        </div>

        {profile && (
          <div className="mb-10">
            <ProfileEditor profile={profile} />
          </div>
        )}

        {groups.map(({ status, heading, empty }) => {
          const rows = listings.filter((listing) => listing.status === status);
          if (status === "draft" && rows.length === 0) return null; // don't show an empty "stuck submissions" section
          return (
            <section key={status} className="mb-8">
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">
                {heading}
                {rows.length > 0 && (
                  <span className="ml-2 rounded-full bg-canvas-deep px-2 py-0.5 align-middle font-mono text-xs text-ink-soft">
                    {rows.length}
                  </span>
                )}
              </h2>
              {rows.length === 0 ? (
                <p className="text-sm text-ink-soft">{empty}</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {rows.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-canvas-deep bg-paper p-4"
                    >
                      <div className="min-w-0">
                        <Link
                          href={listingHref(listing)}
                          className="font-semibold text-ink hover:underline"
                        >
                          {listingLabel(listing)}
                        </Link>
                        <p className="font-mono text-xs text-ink-soft">
                          {currencyFormatter.format(listing.priceEurMonth)}
                          {listing.type === "rental" ? t("perMonth") : ""} · {listing.city}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {status === "active" && (
                          <form action={markMyListingRented}>
                            <input type="hidden" name="id" value={listing.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep"
                            >
                              {listing.type === "car" || listing.type === "product"
                                ? t("markSold")
                                : listing.type === "service"
                                  ? t("markUnavailable")
                                  : t("markRented")}
                            </button>
                          </form>
                        )}
                        {(status === "active" || status === "rented" || status === "draft") && (
                          <form action={archiveMyListing}>
                            <input type="hidden" name="id" value={listing.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-rust hover:text-rust"
                            >
                              {status === "draft" ? t("discard") : t("withdraw")}
                            </button>
                          </form>
                        )}
                        {status === "archived" && (
                          <form action={resubmitMyListing}>
                            <input type="hidden" name="id" value={listing.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep"
                            >
                              {t("postAgain")}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
