// src/app/admin/businesses/page.tsx
// Admin's Businesses page — the Military-Friendly Businesses directory
// that the public /services page now shows. Charlie adds/edits/removes
// each one by hand here; there's no self-registration flow and no real
// review system, so rating/review count are plain numbers he types in.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteBusiness, toggleBusinessActive, toggleBusinessFeatured } from "@/app/admin/businesses/actions";
import { BUSINESS_CATEGORY_LABELS, getAllBusinesses, type BusinessCategoryKey } from "@/lib/businesses";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Businesses",
  robots: { index: false, follow: false },
};

export default async function AdminBusinessesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/businesses");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  const businesses = await getAllBusinesses();

  return (
    <main className="flex-1 py-12">
      <div className="mx-auto max-w-[1000px] px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/admin" className="mb-2 inline-block text-sm text-ink-soft hover:text-ink">
              ← Admin
            </Link>
            <h1 className="mb-1 font-display text-3xl font-semibold text-ink">
              Military-Friendly Businesses
            </h1>
            <p className="max-w-[60ch] text-ink-soft">
              What the public Services page shows — you add these by hand, there's no
              self-registration. Featured ones also show in the homepage's 4-card strip.
            </p>
          </div>
          <Link
            href="/admin/businesses/new"
            className="whitespace-nowrap rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            Add a business
          </Link>
        </div>

        {businesses.length === 0 ? (
          <p className="text-ink-soft">None added yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-canvas-deep bg-paper">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-canvas-deep text-left font-mono text-xs uppercase tracking-wider text-ink-soft/75">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">City / base</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b.id} className="border-b border-canvas-deep last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{b.name}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {BUSINESS_CATEGORY_LABELS[b.category as BusinessCategoryKey]}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {b.city}
                      {b.base ? ` · ${b.base}` : ""}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-soft">
                      {b.rating != null ? `★ ${b.rating} (${b.reviewCount ?? 0})` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`rounded-[3px] px-2 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-wider ${
                            b.isActive ? "bg-olive/15 text-olive-deep" : "bg-rust/15 text-rust"
                          }`}
                        >
                          {b.isActive ? "Active" : "Hidden"}
                        </span>
                        {b.isFeatured && (
                          <span className="rounded-[3px] bg-brass/15 px-2 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-wider text-brass-deep">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <form action={toggleBusinessActive}>
                          <input type="hidden" name="id" value={b.id} />
                          <input type="hidden" name="isActive" value={String(b.isActive)} />
                          <button
                            type="submit"
                            className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep"
                          >
                            {b.isActive ? "Hide" : "Unhide"}
                          </button>
                        </form>
                        <form action={toggleBusinessFeatured}>
                          <input type="hidden" name="id" value={b.id} />
                          <input type="hidden" name="isFeatured" value={String(b.isFeatured)} />
                          <button
                            type="submit"
                            className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-brass hover:text-brass-deep"
                          >
                            {b.isFeatured ? "Unfeature" : "Feature"}
                          </button>
                        </form>
                        <form action={deleteBusiness}>
                          <input type="hidden" name="id" value={b.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-rust hover:text-rust"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
