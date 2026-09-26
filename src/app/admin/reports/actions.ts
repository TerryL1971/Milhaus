// src/app/admin/reports/actions.ts
// Resolving a community report from the admin Reports queue.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function resolveReport(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_reports")
    .update({ status: "resolved" })
    .eq("id", id)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new Error("That didn't go through — you may not have permission to do this.");
  }
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}
