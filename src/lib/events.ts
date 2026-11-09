// src/lib/events.ts
// Pure types for the Events category (Charlie's ideas slide, 2026-10-14)
// — no Supabase import here, same split as businesses.ts/businesses-queries.ts:
// a "use client" grid/calendar component can import this file without
// pulling in @/lib/supabase/server transitively.

// Event categories — Charlie's ask (2026-11-09): "sports, cultural, fests
// etc". One per event, set in Admin → Events, filtered on /events under
// "Type". The keys must match the CHECK in
// supabase/migrations/20261109150000_add_event_categories.sql; the
// labels shown to visitors are EventCategories.<key> in messages/*.json.
// Terry's first draft of the list — Charlie can ask for it to change.
export const EVENT_CATEGORIES = ["sports", "culture", "festival", "family", "food", "community", "other"] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export function isEventCategory(value: unknown): value is EventCategory {
  return typeof value === "string" && (EVENT_CATEGORIES as readonly string[]).includes(value);
}

/** English labels for the English-only admin pages; visitors see the
 * translated ones from messages/*.json. */
export const EVENT_CATEGORY_ADMIN_LABELS: Record<EventCategory, string> = {
  sports: "Sports",
  culture: "Culture (music, art, theatre)",
  festival: "Fests & markets (Volksfest, Christmas market…)",
  family: "Family & kids",
  food: "Food & drink",
  community: "Community & base events",
  other: "Other",
};

export interface Event {
  id: string;
  title: string;
  description: string | null;
  /** Shown publicly — the whole point of "links to the organiser". */
  organizerName: string;
  organizerUrl: string | null;
  city: string;
  base: string | null;
  /** null for events added before categories existed (2026-11-09). */
  category: EventCategory | null;
  startsAt: string;
  endsAt: string | null;
  coverImageUrl: string | null;
  /** The gallery Charlie asked for ("Pictures") — additional photos
   * beyond the cover image, same array-of-storage-URLs shape as
   * listings.photos. */
  photos: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
