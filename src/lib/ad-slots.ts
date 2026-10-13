// src/lib/ad-slots.ts
// Pure types/constants for the ad slots Charlie sells — split out the
// same way src/lib/businesses.ts is, in case a client component ever
// needs these without pulling in @/lib/supabase/server.

export const AD_PLACEMENT_LABELS = {
  site_banner: "Site banner (homepage + every category page)",
  cars_sidebar: "Cars sidebar (/cars only)",
} as const;

export type AdPlacement = keyof typeof AD_PLACEMENT_LABELS;
export const AD_PLACEMENTS = Object.keys(AD_PLACEMENT_LABELS) as AdPlacement[];

export interface AdSlot {
  id: string;
  placement: AdPlacement;
  advertiserName: string;
  imageUrl: string | null;
  heading: string | null;
  bodyText: string | null;
  linkUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}
