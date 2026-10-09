// src/app/admin/businesses/actions.ts
// Create/toggle/delete for the Military-Friendly Businesses directory.
// Authorization is enforced by the businesses RLS policies (admin-only
// writes), not re-checked here — same pattern as the other admin actions.

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BUSINESS_CATEGORY_KEYS, BUSINESS_TAG_KEYS, type BusinessCategoryKey, type BusinessTagKey } from "@/lib/businesses";
import { createClient } from "@/lib/supabase/server";

export async function createBusiness(formData: FormData) {
  const category = formData.get("category") as string;
  if (!BUSINESS_CATEGORY_KEYS.includes(category as BusinessCategoryKey)) {
    throw new Error(`Not a real category: "${category}"`);
  }

  const tags = BUSINESS_TAG_KEYS.filter((key) => formData.get(`tag_${key}`) === "on");
  const ratingRaw = formData.get("rating") as string;
  const reviewCountRaw = formData.get("reviewCount") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("businesses").insert({
    name: formData.get("name"),
    category,
    city: formData.get("city"),
    base: formData.get("base") || null,
    rating: ratingRaw ? Number(ratingRaw) : null,
    review_count: reviewCountRaw ? Number(reviewCountRaw) : null,
    tags,
    logo_url: formData.get("logoUrl") || null,
    website_url: formData.get("websiteUrl") || null,
    phone: formData.get("phone") || null,
    is_featured: formData.get("isFeatured") === "on",
  });

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/admin/businesses");
  revalidatePath("/services");
  revalidatePath("/");
  redirect("/admin/businesses");
}

/** A self-serve submission (status='pending_review', is_active=false)
 * becomes visible and marked active in one step — the admin approval
 * equivalent of ListingForm's admin-add going straight to active. */
export async function approveBusiness(formData: FormData) {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({ status: "active", is_active: true })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/businesses");
  revalidatePath("/services");
  revalidatePath("/");
}

export async function toggleBusinessActive(formData: FormData) {
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";

  const supabase = await createClient();
  const { error } = await supabase.from("businesses").update({ is_active: !isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/businesses");
  revalidatePath("/services");
  revalidatePath("/");
}

export async function toggleBusinessFeatured(formData: FormData) {
  const id = formData.get("id") as string;
  const isFeatured = formData.get("isFeatured") === "true";

  const supabase = await createClient();
  const { error } = await supabase.from("businesses").update({ is_featured: !isFeatured }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/businesses");
  revalidatePath("/services");
  revalidatePath("/");
}

export async function deleteBusiness(formData: FormData) {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("businesses").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/businesses");
  revalidatePath("/services");
  revalidatePath("/");
}
