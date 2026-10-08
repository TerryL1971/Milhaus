// src/app/actions/favorites.ts
// Toggle a listing in/out of the current user's favorites. A plain
// server action behind a <form> — no client JS needed, same pattern as
// the admin toggle actions elsewhere in this codebase.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavorite(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const wasFavorited = formData.get("wasFavorited") === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return; // heart only ever renders for a signed-in user, but no harm in a no-op guard

  if (wasFavorited) {
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listingId);
  } else {
    await supabase.from("favorites").insert({ user_id: user.id, listing_id: listingId });
  }

  // Broad revalidation rather than one exact path — this same card (and
  // its heart state) can show up on the homepage, /listings, /cars, and
  // a listing's own detail page.
  revalidatePath("/", "layout");
}
