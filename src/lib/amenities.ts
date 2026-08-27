// src/lib/amenities.ts
// Property features a lister checks off and a renter can filter by —
// requested directly by Charlie ("pet friendly, garage, garden, etc.").
// Kept as a fixed, small set rather than free-text tags, same reasoning as
// BASE_NAMES: filtering stays exact instead of fuzzy-matching whatever
// string someone typed. Extending the list later is a line here plus
// widening the matching CHECK constraint in a new migration.

export const AMENITY_LABELS = {
  pet_friendly: "Pet friendly",
  garage: "Garage",
  garden: "Garden",
  balcony: "Balcony",
  parking: "Parking",
  furnished: "Furnished",
  elevator: "Elevator",
  washer_dryer: "Washer/dryer",
  dishwasher: "Dishwasher",
  basement_storage: "Basement/storage",
} as const;

export type AmenityKey = keyof typeof AMENITY_LABELS;

export const AMENITY_KEYS = Object.keys(AMENITY_LABELS) as AmenityKey[];
