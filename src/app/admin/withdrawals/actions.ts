// src/app/admin/withdrawals/actions.ts
// Admin → Withdrawals → "Mark handled": Charlie has refunded the customer
// (in the Stripe Dashboard — there's no refund button here on purpose:
// a refund moves real money and Stripe's own screen shows him exactly
// which payment it is). RLS lets only an admin update these rows (see
// supabase/migrations/20261109120000_add_legal_compliance.sql).

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markWithdrawalHandled(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("withdrawal_requests")
    .update({
      status: "handled",
      handled_at: new Date().toISOString(),
      admin_note: String(formData.get("adminNote") ?? "").trim().slice(0, 1000) || null,
    })
    .eq("id", formData.get("id") as string)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("That didn't go through — you may not have permission to do this.");
  }
  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin");
}
