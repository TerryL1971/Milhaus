// src/app/[locale]/my-listings/actions.ts
// One-click status actions for a poster's own listings — the same thin
// pattern as src/app/admin/actions.ts (RLS is the real gate: "owner
// updates own listings" already scopes this to rows the caller owns, so
// there's no separate ownership check here — an id that isn't theirs
// just affects 0 rows).
//
// Notably absent: a "relist straight to active" action. The DB's
// enforce_listing_review_gate trigger blocks a non-admin from setting
// status='active' directly — only Charlie can activate a listing, even
// one the owner is bringing back from their own archive. So "relist"
// here means "send it back through review," not "make it live again."

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function updateOwnListingStatus(id: string, status: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", id)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new Error("That didn't go through — this may not be your listing.");
  }
  revalidatePath("/my-listings");
}

export async function markMyListingRented(formData: FormData) {
  await updateOwnListingStatus(formData.get("id") as string, "rented");
}

export async function archiveMyListing(formData: FormData) {
  await updateOwnListingStatus(formData.get("id") as string, "archived");
}

export async function resubmitMyListing(formData: FormData) {
  await updateOwnListingStatus(formData.get("id") as string, "pending_review");
}

// Self-service account deletion — a consumer-protection requirement
// (GDPR's right to erasure), not something to build only when asked;
// flagged alongside no self-serve Privacy Policy page yet (that one
// needs real legal text from Charlie, this one is pure code). Always
// deletes the *caller's own* session user, never an id a client could
// pass in — mirrors deleteUser from auth.users, not profiles, since
// `profiles.id references auth.users(id) on delete cascade` and every
// other table that matters (listings, businesses, favorites,
// cart_items, listing_reports as reporter) cascades from `profiles.id`
// in turn, so this one call unwinds all of it. Deleting a user account
// is an Admin-API-only operation in Supabase (no self-delete endpoint
// exists on the regular client, even for your own account), so the
// admin client is the only way to do this at all — not a shortcut
// around anything a regular client call could already do.
export async function deleteMyAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/my-listings");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error(error.message);
  }

  await supabase.auth.signOut();
  redirect("/");
}
