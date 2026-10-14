// src/app/admin/events/actions.ts
// Create/toggle/delete for the Events calendar — Charlie hand-enters
// every event himself (his ask, via Terry: no self-serve submission, no
// review queue, modeled on the businesses directory but without its
// consent-verification system — this is public event info Charlie is
// choosing to publish, not a third party's private contact details).
// Authorization is enforced by the events RLS policies (admin-only
// writes), not re-checked here — same pattern as the businesses actions.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateEventPaths() {
  revalidatePath("/admin/events");
  revalidatePath("/events");
}

async function uploadEventImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  file: File,
  name: string,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() || "jpg";
  const path = `_events/${eventId}/${name}.${ext}`;
  // Plain insert, not upsert — events have no edit page (same as
  // businesses), so every path here is fresh, and the storage policy
  // permitting this write is insert-only (see
  // 20261014110000_add_events_storage_policy.sql).
  const { error } = await supabase.storage.from("listing-photos").upload(path, file);
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function createEvent(formData: FormData) {
  const title = (formData.get("title") as string | null)?.trim();
  const organizerName = (formData.get("organizerName") as string | null)?.trim();
  const city = (formData.get("city") as string | null)?.trim();
  const startsAtRaw = formData.get("startsAt") as string | null;
  if (!title) throw new Error("Title is required.");
  if (!organizerName) throw new Error("Organizer name is required.");
  if (!city) throw new Error("City is required.");
  if (!startsAtRaw) throw new Error("Start date/time is required.");

  const supabase = await createClient();
  const eventId = crypto.randomUUID();

  const coverFile = formData.get("coverImage") as File | null;
  const coverImageUrl = coverFile ? await uploadEventImage(supabase, eventId, coverFile, "cover") : null;

  const photoFiles = formData.getAll("photos") as File[];
  const photos: string[] = [];
  for (const [index, file] of photoFiles.entries()) {
    const url = await uploadEventImage(supabase, eventId, file, `photo-${index + 1}`);
    if (url) photos.push(url);
  }

  const endsAtRaw = formData.get("endsAt") as string | null;

  const { error } = await supabase.from("events").insert({
    id: eventId,
    title,
    description: (formData.get("description") as string | null) || null,
    organizer_name: organizerName,
    organizer_url: (formData.get("organizerUrl") as string | null) || null,
    city,
    base: (formData.get("base") as string | null) || null,
    starts_at: new Date(startsAtRaw).toISOString(),
    ends_at: endsAtRaw ? new Date(endsAtRaw).toISOString() : null,
    cover_image_url: coverImageUrl,
    photos,
  });

  if (error) throw new Error(error.message);

  revalidateEventPaths();
}

export async function toggleEventActive(formData: FormData) {
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";

  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ is_active: !isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidateEventPaths();
}

export async function deleteEvent(formData: FormData) {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateEventPaths();
}
