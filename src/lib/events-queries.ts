// src/lib/events-queries.ts
// Server-side reads for the events table — split out from events.ts (pure
// types) for the same reason as businesses-queries.ts: needs
// @/lib/supabase/server, which would break a "use client" component's
// bundle if it ended up pulled in transitively.

import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/events";

function mapRow(row: Record<string, unknown>): Event {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    organizerName: row.organizer_name as string,
    organizerUrl: (row.organizer_url as string | null) ?? null,
    city: row.city as string,
    base: (row.base as string | null) ?? null,
    startsAt: row.starts_at as string,
    endsAt: (row.ends_at as string | null) ?? null,
    coverImageUrl: (row.cover_image_url as string | null) ?? null,
    photos: (row.photos as string[]) ?? [],
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Every active event, soonest first — the public /events calendar page.
 * RLS already restricts anon/public reads to is_active=true. */
export async function getActiveEvents(): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("getActiveEvents failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** Every event regardless of active state — the admin list, newest
 * start date first. */
export async function getAllEvents(): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*").order("starts_at", { ascending: false });

  if (error) {
    console.error("getAllEvents failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

export async function getEvent(id: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
  if (error || !data) return null;
  return mapRow(data);
}
