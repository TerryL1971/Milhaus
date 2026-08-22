// src/app/admin/actions.ts
// One-click moderation actions for the admin dashboard. RLS is the real
// gate here (only an admin's session can update another owner's listing,
// and only an admin can move a listing to `active` — see the review-gate
// trigger in the schema), so these stay thin: call the update through the
// caller's own session, surface a clear error if it's rejected, and
// refresh the page. No separate "am I admin" check duplicated here — if
// you're not, the update affects 0 rows and the error message says so.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function updateListingStatus(id: string, status: string) {
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
    throw new Error("That didn't go through — you may not have permission to do this.");
  }
  revalidatePath("/admin");
}

export async function approveListing(formData: FormData) {
  await updateListingStatus(formData.get("id") as string, "active");
}

export async function rejectListing(formData: FormData) {
  await updateListingStatus(formData.get("id") as string, "archived");
}

export async function markRented(formData: FormData) {
  await updateListingStatus(formData.get("id") as string, "rented");
}

export async function archiveListing(formData: FormData) {
  await updateListingStatus(formData.get("id") as string, "archived");
}
