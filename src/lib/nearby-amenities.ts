// src/lib/nearby-amenities.ts
// What's nearby a rental — schools, groceries, etc. Distinct from
// src/lib/amenities.ts (in-unit features like "garage" or "furnished"):
// this is neighborhood context, requested separately by Charlie. Same
// reasoning as AMENITY_KEYS for keeping it a fixed list rather than free
// text — exact filtering, not fuzzy-matching whatever someone typed.

export const NEARBY_AMENITY_LABELS = {
  school: "School",
  grocery_store: "Grocery store",
  movie_theater: "Movie theater",
  restaurant: "Restaurants",
  gym: "Gym",
  public_transit: "Public transit",
  park: "Park",
  pharmacy: "Pharmacy",
} as const;

export type NearbyAmenityKey = keyof typeof NEARBY_AMENITY_LABELS;

export const NEARBY_AMENITY_KEYS = Object.keys(NEARBY_AMENITY_LABELS) as NearbyAmenityKey[];
