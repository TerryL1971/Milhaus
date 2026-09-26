// src/lib/product-categories.ts
// Fixed vocab for the "Products" listing type (general items for sale) —
// same reasoning as bases.ts/amenities.ts: exact filtering over free text.

export const PRODUCT_CATEGORY_LABELS = {
  electronics: "Electronics",
  furniture: "Furniture",
  household: "Household",
  clothing: "Clothing",
  baby_kids: "Baby & kids",
  other: "Other",
} as const;

export type ProductCategoryKey = keyof typeof PRODUCT_CATEGORY_LABELS;
export const PRODUCT_CATEGORY_KEYS = Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategoryKey[];

export const CONDITION_LABELS = {
  new: "New",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
} as const;

export type ConditionKey = keyof typeof CONDITION_LABELS;
export const CONDITION_KEYS = Object.keys(CONDITION_LABELS) as ConditionKey[];
