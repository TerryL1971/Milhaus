// src/lib/roles.ts
// Single choke point for "does this role get admin-level access" — mirrors
// is_admin() on the SQL side (see the profiles_role_as_enum migration).
// 'owner' (Charlie) and 'admin' (whoever's actually operating the site,
// e.g. Terry) are functionally equal today: every /admin page and the
// header's Admin link goes through this instead of comparing to "admin"
// directly, so there's one place to touch if that ever needs to change —
// not five page guards that drifted out of sync.

import type { ProfileRole } from "@/lib/types";

export function isAdminRole(role: ProfileRole | null | undefined): boolean {
  return role === "admin" || role === "owner";
}
