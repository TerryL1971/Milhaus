// src/app/admin/listings/new/page.tsx
// Admin's own "add a listing" form — same fields as /post, but for
// entering a housing-office listing directly (or any listing on behalf of
// someone else). Goes straight to `active`: the admin adding it is the
// review.

import { redirect } from "next/navigation";
import Link from "next/link";
import { ListingForm } from "@/components/listing-form";
import { createClient } from "@/lib/supabase/server";

export default async function AdminNewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/listings/new");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <Link href="/admin" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          ← Back to admin
        </Link>
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">Add a listing</h1>
        <p className="mb-8 text-ink-soft">
          Goes live immediately — no review step, since you&apos;re the reviewer.
        </p>
        <ListingForm variant="admin-add" />
      </div>
    </main>
  );
}
