// src/app/admin/messages/actions.ts
// Admin → Messages: "Mark handled" and "Delete" for Contact-page
// messages (2026-11-09). RLS lets only an admin update or delete these
// rows (supabase/migrations/20261109180000_add_popup_ad_and_contact.sql);
// .select("id") turns a silently-skipped row into a visible error.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateMessagePaths() {
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function markMessageHandled(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .update({ status: "handled", handled_at: new Date().toISOString() })
    .eq("id", formData.get("id") as string)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("That didn't go through — you may need to sign in again.");
  revalidateMessagePaths();
}

/** Contact messages hold someone's name and email, so Charlie can delete
 * one once it's dealt with (GDPR: don't keep personal data longer than
 * needed). */
export async function deleteMessage(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .delete()
    .eq("id", formData.get("id") as string)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("That didn't go through — you may need to sign in again.");
  revalidateMessagePaths();
}
