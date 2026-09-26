// src/lib/profiles.ts
// Server-side reads for user/role management (admin's Users page). Same
// pattern as listings.ts: RLS already scopes what the caller can see
// (profiles: admins read all rows), this just shapes the query.

import { createClient } from "@/lib/supabase/server";
import type { ProfileRole, ProfileStatus } from "@/lib/types";

// Human-readable labels for the status dropdown on the admin Users page —
// same reasoning as ROLE_LABELS below.
export const STATUS_LABELS: Record<ProfileStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  banned: "Banned",
};

export interface Profile {
  id: string;
  role: ProfileRole;
  status: ProfileStatus;
  displayName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  photoUrl: string | null;
  bio: string | null;
  createdAt: string;
}

// Human-readable labels for the role dropdown — so nobody has to remember
// the exact enum string (the problem that prompted building this page).
export const ROLE_LABELS: Record<ProfileRole, string> = {
  owner: "Owner",
  admin: "Admin",
  housing_office_partner: "Housing office partner",
  landlord: "Landlord",
  individual_lister: "Individual lister",
};

function mapProfileRow(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    role: row.role as ProfileRole,
    status: row.status as ProfileStatus,
    displayName: (row.display_name as string | null) ?? null,
    contactEmail: (row.contact_email as string | null) ?? null,
    contactPhone: (row.contact_phone as string | null) ?? null,
    photoUrl: (row.photo_url as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
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
    .select("id, role, status, display_name, contact_email, contact_phone, photo_url, bio, created_at")
    .order("created_at");

  if (error) {
    console.error("getAllProfiles failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapProfileRow);
}

/** /my-listings' "your public profile" editor — the signed-in caller's
 * own row. RLS ("read own row") scopes this; a mismatched id just comes
 * back null rather than needing its own check. */
export async function getProfile(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, status, display_name, contact_email, contact_phone, photo_url, bio, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfileRow(data);
}
