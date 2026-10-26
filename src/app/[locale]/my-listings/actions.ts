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

// GDPR Article 15 (access) + Article 20 (portability) — every table that
// mattered for deleteMyAccount above, read back instead of erased. The
// admin client is used throughout, not just where there's no
// RLS-respecting alternative like deleteMyAccount — listing_reports and
// business_consent_log only grant SELECT to admins (see their own
// migrations), not to the row's own reporter/business owner, so there's
// no single client that could read everything here. Every query is
// still hardcoded to the caller's own user.id (or the business ids that
// belong to it) — never a value a client could influence — so this
// doesn't actually widen what a caller can reach, unlike a general-
// purpose admin-client endpoint would.
export async function exportMyData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/my-listings");

  const admin = createAdminClient();

  const [profileRes, listingsRes, favoritesRes, reportsRes, businessesRes, cartRes] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    admin.from("listings").select("*").eq("owner_id", user.id),
    admin.from("favorites").select("*").eq("user_id", user.id),
    admin.from("listing_reports").select("*").eq("reporter_id", user.id),
    admin.from("businesses").select("*").eq("owner_id", user.id),
    admin.from("cart_items").select("*").eq("user_id", user.id),
  ]);

  const businessIds = (businessesRes.data ?? []).map((business) => business.id as string);
  const consentLogRes =
    businessIds.length > 0
      ? await admin.from("business_consent_log").select("*").in("business_id", businessIds)
      : { data: [] as Record<string, unknown>[] };

  return {
    exportedAt: new Date().toISOString(),
    account: profileRes.data,
    listings: listingsRes.data ?? [],
    favorites: favoritesRes.data ?? [],
    reportsFiled: reportsRes.data ?? [],
    businesses: businessesRes.data ?? [],
    businessConsentLog: consentLogRes.data ?? [],
    cartItems: cartRes.data ?? [],
  };
}
