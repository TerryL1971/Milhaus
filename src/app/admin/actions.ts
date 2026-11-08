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
import { extendExpiry } from "@/lib/listing-expiry";
import { isAdminRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
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

/** Admin → Needs review → "Approve": puts the listing live. */
export async function approveListing(formData: FormData) {
  await updateListingStatus(formData.get("id") as string, "active");
}

/** Admin → Needs review → "Reject": moves it to the archive instead of live. */
export async function rejectListing(formData: FormData) {
  await updateListingStatus(formData.get("id") as string, "archived");
}

/** Admin → Live listings → "Mark rented / sold / unavailable". */
export async function markRented(formData: FormData) {
  await updateListingStatus(formData.get("id") as string, "rented");
}

/** Admin → "Archive": takes a listing off the site but keeps it (Relist brings it back). */
export async function archiveListing(formData: FormData) {
  await updateListingStatus(formData.get("id") as string, "archived");
}

// Bringing a house back onto the market (or, for a previously-rejected
// submission, approving it after all) — either way it goes straight back
// to active. It was already reviewed once before landing in the archive,
// so this doesn't route back through pending_review.
export async function relistListing(formData: FormData) {
  await updateListingStatus(formData.get("id") as string, "active");
}

// Charlie's override (2026-11-02): another 30 days on any active or
// expired listing, never charged — whatever the poster would otherwise
// owe for renewing. Same extendExpiry as a poster's own renewal
// (expired -> live for 30 days; active -> 30 days on top of what's
// left). Unlike the other actions here this one can't lean on RLS, since
// extendExpiry writes with the service-role client, so it checks admin
// itself first.
export async function grantFreeThirtyDays(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  if (!isAdminRole(profile?.role)) {
    throw new Error("That didn't go through — you may not have permission to do this.");
  }

  await extendExpiry(createAdminClient(), [formData.get("id") as string]);
  revalidatePath("/admin");
}

/** Admin → "Feature" / "Unfeature": featured listings come first in the homepage rows. */
export async function setFeatured(formData: FormData) {
  const id = formData.get("id") as string;
  const isFeatured = formData.get("isFeatured") === "true";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ is_featured: isFeatured })
    .eq("id", id)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new Error("That didn't go through — you may not have permission to do this.");
  }
  revalidatePath("/admin");
  revalidatePath("/");
}
