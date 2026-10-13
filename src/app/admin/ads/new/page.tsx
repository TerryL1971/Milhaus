// src/app/admin/ads/new/page.tsx
// Admin's "add an ad" form. Either an image (the real creative an
// advertiser supplies) or a plain heading/body text fallback — same
// either/or shape the old hardcoded SponsorBannerCarousel SLIDES array
// used, now a real row Charlie can add without a code change.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdSlot } from "@/app/admin/ads/actions";
import { AD_PLACEMENTS, AD_PLACEMENT_LABELS, AD_PLACEMENT_SIZES } from "@/lib/ad-slots";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Add an ad",
  robots: { index: false, follow: false },
};

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none";

export default async function AdminNewAdPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/ads/new");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <Link href="/admin/ads" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          ← Back to ad slots
        </Link>
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">Add an ad</h1>
        <p className="mb-8 text-ink-soft">
          Give it an image for the real creative, or leave the image blank and just fill in the
          heading/body for a plain text slide (what &quot;Advertise here&quot; already is — just a row of this
          same table).
        </p>

        <form action={createAdSlot} className="flex flex-col gap-5">
          <div>
            <label htmlFor="advertiserName" className={labelClass}>
              Advertiser (for your own records — not shown publicly)
            </label>
            <input id="advertiserName" name="advertiserName" required className={inputClass} />
          </div>

          <div>
            <label htmlFor="placement" className={labelClass}>
              Placement
            </label>
            <select id="placement" name="placement" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Choose one
              </option>
              {AD_PLACEMENTS.map((key) => (
                <option key={key} value={key}>
                  {AD_PLACEMENT_LABELS[key]}
                </option>
              ))}
            </select>
            <div className="mt-2 rounded-md bg-canvas/50 p-3 text-xs text-ink-soft">
              {AD_PLACEMENTS.map((key) => (
                <p key={key} className="mb-1 last:mb-0">
                  <span className="font-semibold text-charcoal">{AD_PLACEMENT_LABELS[key]}:</span>{" "}
                  {AD_PLACEMENT_SIZES[key]}
                </p>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="linkUrl" className={labelClass}>
              Where it links to
            </label>
            <input id="linkUrl" name="linkUrl" type="url" required placeholder="https://…" className={inputClass} />
          </div>

          <div>
            <label htmlFor="imageUrl" className={labelClass}>
              Image URL (optional — leave blank for a text slide instead)
            </label>
            <input id="imageUrl" name="imageUrl" type="url" placeholder="https://…" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="heading" className={labelClass}>
                Heading (for a text slide)
              </label>
              <input id="heading" name="heading" className={inputClass} />
            </div>
            <div>
              <label htmlFor="bodyText" className={labelClass}>
                Body (for a text slide)
              </label>
              <input id="bodyText" name="bodyText" className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="sortOrder" className={labelClass}>
              Order (lower shows first in the site banner&apos;s rotation; doesn&apos;t matter for the cars
              sidebar, which only shows one)
            </label>
            <input id="sortOrder" name="sortOrder" type="number" defaultValue={0} className={inputClass} />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            Add ad
          </button>
        </form>
      </div>
    </main>
  );
}
