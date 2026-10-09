// src/app/admin/listings/new/page.tsx
// Admin's own "add a listing" form — same fields as /post or /post-car,
// but for entering a listing directly on someone's behalf (a
// housing-office rental, a car ad, an item for sale, or a service for
// someone who can't post it themselves). Goes straight to `active`: the
// admin adding it is the review. ?type=car / ?type=product / ?type=service
// switch ListingForm to that field set — none of them has a
// housing-office equivalent, so those variants skip the source picker.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ListingForm } from "@/components/listing-form";
import { getListingPrices } from "@/lib/listing-prices";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import type { ListingType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Add a listing",
  robots: { index: false, follow: false },
};

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

const TYPE_LABELS: Record<ListingType, string> = {
  rental: "Rental",
  car: "Car",
  product: "Item for sale",
  service: "Service",
};

type SearchParams = Promise<{ type?: string }>;

export default async function AdminNewListingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/listings/new");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  const { type } = await searchParams;
  const isCar = type === "car";
  const isProduct = type === "product";
  const isService = type === "service";
  const kind = isCar ? "car" : isProduct ? "product" : isService ? "service" : "rental";
  const prices = await getListingPrices();

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <Link href="/admin" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          ← Back to admin
        </Link>
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">
          Add a {isCar ? "car ad" : isProduct ? "item for sale" : isService ? "service" : "listing"}
        </h1>
        <p className="mb-4 text-ink-soft">
          Goes live immediately — no review step, since you&apos;re the reviewer.
        </p>
        <div className="mb-8 flex gap-2 text-sm font-semibold">
          <Link
            href="/admin/listings/new"
            className={`rounded-md border px-3.5 py-1.5 ${
              kind === "rental" ? "border-olive bg-olive/15 text-olive-deep" : "border-canvas-deep text-ink-soft"
            }`}
          >
            Rental
          </Link>
          <Link
            href="/admin/listings/new?type=car"
            className={`rounded-md border px-3.5 py-1.5 ${
              isCar ? "border-olive bg-olive/15 text-olive-deep" : "border-canvas-deep text-ink-soft"
            }`}
          >
            Car
          </Link>
          <Link
            href="/admin/listings/new?type=product"
            className={`rounded-md border px-3.5 py-1.5 ${
              isProduct ? "border-olive bg-olive/15 text-olive-deep" : "border-canvas-deep text-ink-soft"
            }`}
          >
            Item for sale
          </Link>
          <Link
            href="/admin/listings/new?type=service"
            className={`rounded-md border px-3.5 py-1.5 ${
              isService ? "border-olive bg-olive/15 text-olive-deep" : "border-canvas-deep text-ink-soft"
            }`}
          >
            Service
          </Link>
        </div>

        {/* What everyone pays to post in each category — not relevant to
            this admin-add flow itself (it always goes straight to
            active, no payment), just a reference so Charlie can see
            current pricing while he's here. */}
        <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-md border border-canvas-deep bg-canvas px-4 py-3 text-sm">
          <span className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
            Posting prices
          </span>
          {(Object.keys(TYPE_LABELS) as ListingType[]).map((t) => (
            <span key={t} className={t === kind ? "font-semibold text-ink" : "text-ink-soft"}>
              {TYPE_LABELS[t]}: {currencyFormatter.format(prices[t])}
            </span>
          ))}
          <Link href="/admin/pricing" className="ml-auto text-xs font-semibold text-olive-deep hover:underline">
            Edit prices
          </Link>
        </div>

        <ListingForm variant="admin-add" kind={kind} />
      </div>
    </main>
  );
}
