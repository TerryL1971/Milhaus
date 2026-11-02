// src/app/[locale]/edit-listing/[id]/page.tsx
// Edit an existing listing — any of the four types, same ListingForm as
// posting, just pre-filled. Reached from the Edit button on /my-listings
// (the poster) and on every row of /admin (Charlie, for anyone's
// listing). Anyone else gets a 404 rather than a "not yours" message, so
// a listing id can't be probed for who owns it.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ListingForm } from "@/components/listing-form";
import { getPathname, redirect } from "@/i18n/navigation";
import { getListingById } from "@/lib/listings";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit listing",
  robots: { index: false, follow: false },
};

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("EditListingPage");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    const nextPath = getPathname({ href: `/edit-listing/${id}`, locale });
    redirect({ href: `/sign-in?next=${nextPath}`, locale });
    return;
  }

  const [listing, { data: profile }] = await Promise.all([
    getListingById(id),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);
  const isAdmin = isAdminRole(profile?.role);
  // getListingById also returns other people's *active* listings (RLS
  // lets the public read those), so this check is what actually gates it.
  if (!listing || (listing.ownerId !== user.id && !isAdmin)) notFound();

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
        <p className="mb-8 text-ink-soft">{t("body")}</p>
        <ListingForm variant={isAdmin ? "admin-add" : "self-list"} kind={listing.type} existing={listing} />
      </div>
    </main>
  );
}
