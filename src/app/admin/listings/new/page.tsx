// src/app/admin/listings/new/page.tsx
// Admin's own "add a listing" form — same fields as /post or /post-car,
// but for entering a listing directly on someone's behalf (a
// housing-office rental, or a car ad for someone who can't post it
// themselves). Goes straight to `active`: the admin adding it is the
// review. ?type=car switches ListingForm to the car field set — cars have
// no housing-office equivalent, so that variant skips the source picker.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ListingForm } from "@/components/listing-form";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Add a listing",
  robots: { index: false, follow: false },
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

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <Link href="/admin" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          ← Back to admin
        </Link>
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">
          Add a {isCar ? "car ad" : "listing"}
        </h1>
        <p className="mb-4 text-ink-soft">
          Goes live immediately — no review step, since you&apos;re the reviewer.
        </p>
        <div className="mb-8 flex gap-2 text-sm font-semibold">
          <Link
            href="/admin/listings/new"
            className={`rounded-md border px-3.5 py-1.5 ${
              !isCar ? "border-olive bg-olive/15 text-olive-deep" : "border-canvas-deep text-ink-soft"
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
        </div>
        <ListingForm variant="admin-add" kind={isCar ? "car" : "rental"} />
      </div>
    </main>
  );
}
