// src/app/admin/users/actions.ts
// Role and status changes from the admin Users page.

"use server";

import { revalidatePath } from "next/cache";
import type { ProfileRole, ProfileStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

const VALID_ROLES: ProfileRole[] = [
  "owner",
  "admin",
  "housing_office_partner",
  "landlord",
  "individual_lister",
];

const VALID_STATUSES: ProfileStatus[] = ["active", "suspended", "banned"];

export async function setUserRole(formData: FormData) {
  const id = formData.get("id") as string;
  const role = formData.get("role") as string;

  if (!VALID_ROLES.includes(role as ProfileRole)) {
    throw new Error(`Not a real role: "${role}"`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The database *allows* an admin to demote themselves (the
  // self-escalation trigger only blocks non-admins editing their own row —
  // see profiles_prevent_role_self_escalation) — but there's no UI reason
  // to let that happen by accident. The Users page already hides the
  // dropdown on your own row for the same reason; this is the second,
  // trusted layer in case that's ever bypassed.
  if (user?.id === id) {
    throw new Error("You can't change your own role from here.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new Error("That didn't go through — you may not have permission to do this.");
  }
  revalidatePath("/admin/users");
}

// Suspended/banned only blocks *new* listing creation (see the "listings:
// authenticated users create their own listings" RLS policy) — it
// deliberately doesn't touch sign-in, browsing, or a user's existing
// listings. Charlie archives those by hand if he wants them down too.
export async function setUserStatus(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  if (!VALID_STATUSES.includes(status as ProfileStatus)) {
    throw new Error(`Not a real status: "${status}"`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id === id) {
    throw new Error("You can't change your own status from here.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", id)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new Error("That didn't go through — you may not have permission to do this.");
  }
  revalidatePath("/admin/users");
}
