// src/lib/service-categories.ts
// Fixed vocab for the "Services" listing type (a mechanic, a moving
// company, tutoring — no physical item) — same reasoning as
// product-categories.ts: exact filtering over free text.

export const SERVICE_CATEGORY_LABELS = {
  moving: "Moving & relocation",
  auto_repair: "Auto repair",
  tutoring: "Tutoring & lessons",
  cleaning: "Cleaning",
  childcare: "Childcare & babysitting",
  pet_care: "Pet care",
  home_repair: "Home repair & handyman",
  photography: "Photography",
  other: "Other",
} as const;

export type ServiceCategoryKey = keyof typeof SERVICE_CATEGORY_LABELS;
export const SERVICE_CATEGORY_KEYS = Object.keys(SERVICE_CATEGORY_LABELS) as ServiceCategoryKey[];
