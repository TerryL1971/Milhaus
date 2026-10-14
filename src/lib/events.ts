// src/lib/events.ts
// Pure types for the Events category (Charlie's ideas slide, 2026-10-14)
// — no Supabase import here, same split as businesses.ts/businesses-queries.ts:
// a "use client" grid/calendar component can import this file without
// pulling in @/lib/supabase/server transitively.

export interface Event {
  id: string;
  title: string;
  description: string | null;
  /** Shown publicly — the whole point of "links to the organiser". */
  organizerName: string;
  organizerUrl: string | null;
  city: string;
  base: string | null;
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
