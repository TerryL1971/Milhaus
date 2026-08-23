// src/lib/profiles.ts
// Server-side reads for user/role management (admin's Users page). Same
// pattern as listings.ts: RLS already scopes what the caller can see
// (profiles: admins read all rows), this just shapes the query.

import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/lib/types";

export interface Profile {
  id: string;
  role: ProfileRole;
  displayName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
}

// Human-readable labels for the role dropdown — so nobody has to remember
// the exact enum string (the problem that prompted building this page).
export const ROLE_LABELS: Record<ProfileRole, string> = {
  admin: "Admin",
  housing_office_partner: "Housing office partner",
  landlord: "Landlord",
  individual_lister: "Individual lister",
};

function mapProfileRow(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    role: row.role as ProfileRole,
    displayName: (row.display_name as string | null) ?? null,
    contactEmail: (row.contact_email as string | null) ?? null,
    contactPhone: (row.contact_phone as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

/** Admin's Users page: everyone with an account, oldest first. Non-admin
 * callers naturally get just their own row back (RLS: "read own row"),
 * rather than needing a separate check here. */
export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, display_name, contact_email, contact_phone, created_at")
    .order("created_at");

  if (error) {
    console.error("getAllProfiles failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapProfileRow);
}
