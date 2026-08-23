// src/app/admin/users/page.tsx
// Admin's Users page — change what role someone has without needing to
// remember the exact role strings (admin/housing_office_partner/landlord/
// individual_lister) or touch the database directly.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setUserRole } from "@/app/admin/users/actions";
import { getAllProfiles, ROLE_LABELS } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/lib/types";

export const metadata: Metadata = {
  title: "Users",
  robots: { index: false, follow: false },
};

const ROLE_OPTIONS = Object.entries(ROLE_LABELS) as [ProfileRole, string][];

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/users");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const profiles = await getAllProfiles();

  return (
    <main className="flex-1 py-12">
      <div className="mx-auto max-w-[900px] px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/admin" className="mb-2 inline-block text-sm text-ink-soft hover:text-ink">
              ← Admin
            </Link>
            <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Users</h1>
            <p className="text-ink-soft">Change what someone can do — no need to remember the role names.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-canvas-deep bg-paper">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-canvas-deep text-left font-mono text-xs uppercase tracking-wider text-ink-soft/75">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const isSelf = p.id === user.id;
                return (
                  <tr key={p.id} className="border-b border-canvas-deep last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{p.displayName || p.contactEmail || p.id}</p>
                      {p.displayName && p.contactEmail && (
                        <p className="text-xs text-ink-soft">{p.contactEmail}</p>
                      )}
                    </td>
                    {isSelf ? (
                      <>
                        <td className="px-4 py-3">
                          <span className="rounded-[3px] bg-brass/15 px-2 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-wider text-brass-deep">
                            {ROLE_LABELS[p.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-ink-soft">You</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3" colSpan={2}>
                          <form action={setUserRole} className="flex justify-end gap-2">
                            <input type="hidden" name="id" value={p.id} />
                            {/* key={p.role} forces React to remount this
                                select after Save — otherwise the server's
                                fresh defaultValue is ignored (defaultValue
                                only applies on mount) and the dropdown
                                keeps showing the pre-save role even though
                                the database updated correctly. */}
                            <select
                              key={p.role}
                              name="role"
                              defaultValue={p.role}
                              className="rounded-md border border-canvas-deep bg-paper px-2 py-1.5 text-sm text-charcoal"
                            >
                              {ROLE_OPTIONS.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep"
                            >
                              Save
                            </button>
                          </form>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
