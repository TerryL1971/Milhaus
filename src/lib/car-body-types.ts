// src/lib/car-body-types.ts
// Fixed vocab for a car listing's body type — same reasoning as
// product-categories.ts/service-categories.ts: exact filtering (and,
// via search-matching.ts, exact keyword matching) over free text. Added
// because neither existed anywhere before: searching "sedan" or "truck"
// on /cars always returned nothing, even for a listing that obviously
// is one, since no car's own title/make/model/description ever happens
// to contain that literal word (see the migration that added this
// column, supabase/migrations/20261021140000_add_car_body_type.sql).

export const CAR_BODY_TYPE_LABELS = {
  sedan: "Sedan",
  suv: "SUV",
  truck: "Truck",
  van: "Van / Minivan",
  wagon: "Wagon",
  hatchback: "Hatchback",
  coupe: "Coupe",
  convertible: "Convertible",
  sports_car: "Sports car",
} as const;

export type CarBodyTypeKey = keyof typeof CAR_BODY_TYPE_LABELS;
export const CAR_BODY_TYPE_KEYS = Object.keys(CAR_BODY_TYPE_LABELS) as CarBodyTypeKey[];
