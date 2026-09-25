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
