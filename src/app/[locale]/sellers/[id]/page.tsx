// src/app/[locale]/sellers/[id]/page.tsx
// Standalone public seller profile — the same photo/bio/contact SellerCard
// shows inline on a listing, plus their full set of active listings (not
// capped at 4 like the "more from this seller" strip). Public, no sign-in
// wall, same as SellerCard — see src/components/seller-card.tsx.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { CarListingCard } from "@/components/car-listing-card";
import { ListingCard } from "@/components/listing-card";
import { ProductListingCard } from "@/components/product-listing-card";
import { ServiceListingCard } from "@/components/service-listing-card";
import { Link } from "@/i18n/navigation";
import { getSellerListings, getSellerProfile } from "@/lib/listings";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#D8C9A8,#A9AE83)",
  "linear-gradient(135deg,#C3B79D,#8C9873)",
  "linear-gradient(135deg,#CBBBA0,#8E7C63)",
  "linear-gradient(135deg,#D3C6A6,#9AA37E)",
  "linear-gradient(135deg,#C7B8A0,#7E8A6C)",
  "linear-gradient(135deg,#D9CBAF,#B0A184)",
];

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const seller = await getSellerProfile(id);
  return seller
    ? { title: seller.displayName ?? "Seller profile", robots: { index: false, follow: false } }
    : { title: "Seller not found", robots: { index: false, follow: false } };
}

export default async function SellerProfilePage({ params }: { params: Params }) {
  const { id } = await params;
  const t = await getTranslations("SellerProfilePage");
  const [seller, listings] = await Promise.all([getSellerProfile(id), getSellerListings(id, undefined, 100)]);
  if (!seller) notFound();

  const name = seller.displayName ?? t("theSeller");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[1400px] px-8">
        <div className="mb-8 flex flex-wrap items-start gap-5 rounded-md border border-canvas-deep bg-paper p-6">
          {seller.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
            <img
              src={seller.photoUrl}
              alt=""
              className="h-20 w-20 flex-none rounded-full border border-canvas-deep object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 flex-none items-center justify-center rounded-full border border-canvas-deep bg-canvas font-display text-2xl font-semibold text-ink-soft">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold text-ink">{name}</h1>
            {seller.bio && <p className="mt-1.5 text-ink-soft">{seller.bio}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {seller.contactEmail && (
                <a
                  href={`mailto:${seller.contactEmail}`}
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

        <h2 className="mb-5 font-display text-xl font-semibold text-ink">
          {t("listingsHeading", { name })}
        </h2>
        {listings.length === 0 ? (
          <p className="text-ink-soft">{t("noListings")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing, index) => {
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
        )}

        <Link href="/#listings" className="mt-8 inline-block text-sm text-ink-soft hover:text-ink">
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
