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
import { TAKEDOWN_REASONS, isTakedownReason, listingOwnerEmail, sendTakedownNotice } from "@/lib/moderation";
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
  await takeDown(formData, true);
}

/** Admin → Live listings → "Mark rented / sold / unavailable". */
export async function markRented(formData: FormData) {
  await updateListingStatus(formData.get("id") as string, "rented");
}

/** Admin → "Archive": takes a listing off the site but keeps it (Relist brings it back). */
export async function archiveListing(formData: FormData) {
  await takeDown(formData, false);
}

// Reject and Archive both ask for a reason now (src/components/takedown-form.tsx)
// and, unless it's "no_notice", email the owner a statement of reasons —
// Digital Services Act Art. 17, added in the 2026-11-09 legal pass (see
// src/lib/moderation.ts). The status change still goes through Charlie's
// own session so RLS stays the gate; the email lookup needs the
// service-role client, which is only reached after that update succeeded
// (i.e. after RLS has confirmed he's an admin). The email is
// best-effort: the listing comes down even if Resend is down, and the
// page says nothing either way — the reason is saved on the listing.
async function takeDown(formData: FormData, rejected: boolean) {
  const id = formData.get("id") as string;
  const reason = formData.get("reason");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;
  if (!isTakedownReason(reason)) throw new Error("Choose a reason first.");
  if (TAKEDOWN_REASONS[reason].noteRequired && !note) {
    throw new Error(`"${TAKEDOWN_REASONS[reason].label}" needs a short explanation — it's what the poster is told.`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({
      status: "archived",
      moderation_reason: reason,
      moderation_note: note,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, title, owner_id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("That didn't go through — you may not have permission to do this.");
  }

  if (reason !== "no_notice") {
    const admin = createAdminClient();
    const to = await listingOwnerEmail(admin, data[0].owner_id as string);
    if (to) {
      await sendTakedownNotice({
        to,
        listingTitle: data[0].title as string,
        reason,
        note,
        fromReport: formData.get("fromReport") === "on",
        rejected,
      });
    }
  }
  revalidatePath("/admin");
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
