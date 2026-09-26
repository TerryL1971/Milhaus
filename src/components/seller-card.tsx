// src/components/seller-card.tsx
// The "who's selling this" panel on every listing detail page (rental or
// car) — photo, name, bio, contact info, and their other active
// listings. Public with no sign-in wall, per Charlie's call (modeled on
// bookoo's own seller card): the trust signal here is the profile itself
// being visible, not gating the contact details behind an account.
//
// Kept as one shared component rather than duplicated per detail page —
// a seller's "other listings" can mix any of the four listing types, so
// it renders whichever card type fits each one.

import { useTranslations } from "next-intl";
import { CarListingCard } from "@/components/car-listing-card";
import { ListingCard } from "@/components/listing-card";
import { ProductListingCard } from "@/components/product-listing-card";
import { ServiceListingCard } from "@/components/service-listing-card";
import { Link } from "@/i18n/navigation";
import type { Listing } from "@/lib/types";
import type { SellerProfile } from "@/lib/listings";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#D8C9A8,#A9AE83)",
  "linear-gradient(135deg,#C3B79D,#8C9873)",
  "linear-gradient(135deg,#CBBBA0,#8E7C63)",
  "linear-gradient(135deg,#D3C6A6,#9AA37E)",
];

export function SellerCard({
  seller,
  ownerId,
  listingTitle,
  otherListings,
}: {
  seller: SellerProfile;
  ownerId: string;
  listingTitle: string;
  otherListings: Listing[];
}) {
  const t = useTranslations("SellerCard");
  const name = seller.displayName ?? t("theSeller");

  return (
    <div className="mt-8 rounded-md border border-canvas-deep bg-paper p-5">
      <div className="flex flex-wrap items-start gap-4">
        {seller.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
          <img
            src={seller.photoUrl}
            alt=""
            className="h-16 w-16 flex-none rounded-full border border-canvas-deep object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full border border-canvas-deep bg-canvas font-display text-xl font-semibold text-ink-soft">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
            {t("postedBy")}
          </p>
          <Link
            href={`/sellers/${ownerId}`}
            className="font-display text-lg font-semibold text-ink hover:underline"
          >
            {name}
          </Link>
          {seller.bio && <p className="mt-1.5 text-sm text-ink-soft">{seller.bio}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {seller.contactEmail && (
              <a
                href={`mailto:${seller.contactEmail}?subject=${encodeURIComponent(`About: ${listingTitle}`)}`}
                className="inline-block rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
              >
                {t("emailButton", { name })}
              </a>
            )}
            {seller.contactPhone && (
              <a
                href={`tel:${seller.contactPhone.replace(/[^+\d]/g, "")}`}
                className="text-sm font-semibold text-ink-soft hover:text-ink"
              >
                {seller.contactPhone}
              </a>
            )}
          </div>
        </div>
      </div>

      {otherListings.length > 0 && (
        <div className="mt-6 border-t border-canvas-deep pt-5">
          <p className="mb-3 font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
            {t("moreFromSeller", { name })}
          </p>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {otherListings.map((listing, index) => {
              const photoGradient = PHOTO_GRADIENTS[index % PHOTO_GRADIENTS.length];
              switch (listing.type) {
                case "car":
                  return <CarListingCard key={listing.id} listing={listing} photoGradient={photoGradient} />;
                case "product":
                  return <ProductListingCard key={listing.id} listing={listing} photoGradient={photoGradient} />;
                case "service":
                  return <ServiceListingCard key={listing.id} listing={listing} photoGradient={photoGradient} />;
                default:
                  return <ListingCard key={listing.id} listing={listing} photoGradient={photoGradient} />;
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}
