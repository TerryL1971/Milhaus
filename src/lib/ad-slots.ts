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

// What to tell an advertiser to design at, per placement — shown on
// /admin/ads and /admin/ads/new so Charlie never has to guess or ask.
export const AD_PLACEMENT_SIZES: Record<AdPlacement, string> = {
  site_banner:
    "Fluid width × fixed height — up to 1336px wide on desktop (96px tall; 80px tall on phones, narrower). Design at roughly 1336×96px, 2672×192px for retina. A smaller/differently-shaped image still works — it just won't fill the full width.",
  cars_sidebar: '300×600px (IAB "Half Page Ad"). Design at 2x for retina: 600×1200px.',
};

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
