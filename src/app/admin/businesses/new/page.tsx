// src/app/admin/businesses/new/page.tsx
// Admin's "add a business" form for the Military-Friendly Businesses
// directory. Plain fields Charlie types in by hand — rating/review count
// included, since there's no real review system behind this.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createBusiness } from "@/app/admin/businesses/actions";
import { BASE_NAMES } from "@/lib/bases";
import { BUSINESS_CATEGORY_KEYS, BUSINESS_CATEGORY_LABELS, BUSINESS_TAG_KEYS, BUSINESS_TAG_LABELS } from "@/lib/businesses";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Add a business",
  robots: { index: false, follow: false },
};

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none";

export default async function AdminNewBusinessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/businesses/new");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <Link href="/admin/businesses" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          ← Back to businesses
        </Link>
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">Add a business</h1>
        <p className="mb-8 text-ink-soft">
          Shows up on the public Services page right away (unless you leave it unfeatured and it's
          not the newest — everything active shows, featured ones also get the homepage strip).
        </p>

        <form action={createBusiness} className="flex flex-col gap-5">
          <div>
            <label htmlFor="name" className={labelClass}>
              Business name
            </label>
            <input id="name" name="name" required className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className={labelClass}>
                Category
              </label>
              <select id="category" name="category" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  Choose one
                </option>
                {BUSINESS_CATEGORY_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {BUSINESS_CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="base" className={labelClass}>
                Nearest base (optional)
              </label>
              <select id="base" name="base" defaultValue="" className={inputClass}>
                <option value="">Not specific to one base</option>
                {BASE_NAMES.map((base) => (
                  <option key={base} value={base}>
                    {base}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="city" className={labelClass}>
              City
            </label>
            <input id="city" name="city" required className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rating" className={labelClass}>
                Rating (optional, 0–5)
              </label>
              <input id="rating" name="rating" type="number" min="0" max="5" step="0.1" className={inputClass} />
            </div>
            <div>
              <label htmlFor="reviewCount" className={labelClass}>
                Review count (optional)
              </label>
              <input id="reviewCount" name="reviewCount" type="number" min="0" className={inputClass} />
            </div>
          </div>

          <div>
            <span className={labelClass}>Tags</span>
            <div className="flex flex-wrap gap-4">
              {BUSINESS_TAG_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm text-charcoal">
                  <input
                    type="checkbox"
                    name={`tag_${key}`}
                    className="h-4 w-4 rounded border-canvas-deep text-olive focus:ring-olive"
                  />
                  <span>{BUSINESS_TAG_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="logoUrl" className={labelClass}>
              Logo URL (optional)
            </label>
            <input id="logoUrl" name="logoUrl" type="url" placeholder="https://…" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="websiteUrl" className={labelClass}>
                Website (optional)
              </label>
              <input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://…" className={inputClass} />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone (optional)
              </label>
              <input id="phone" name="phone" type="tel" className={inputClass} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input
              type="checkbox"
              name="isFeatured"
              className="h-4 w-4 rounded border-canvas-deep text-olive focus:ring-olive"
            />
            <span>Feature on the homepage</span>
          </label>

          <button
            type="submit"
            className="mt-2 rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            Add business
          </button>
        </form>
      </div>
    </main>
  );
}
