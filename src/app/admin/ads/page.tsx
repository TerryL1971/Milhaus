// src/app/admin/ads/page.tsx
// Admin's Ad Slots page — Charlie manages the banner ads he charges
// advertisers for here, instead of asking for a code change every time
// someone buys or drops a spot. Covers both real placements: the
// site-wide banner carousel (homepage + every category page) and the
// single /cars sidebar slot.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteAdSlot, toggleAdSlotActive } from "@/app/admin/ads/actions";
import { AD_PLACEMENT_LABELS, AD_PLACEMENT_SIZES, AD_PLACEMENTS } from "@/lib/ad-slots";
import { getAllAdSlots } from "@/lib/ad-slots-queries";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ad slots",
  robots: { index: false, follow: false },
};

export default async function AdminAdsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/ads");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  const ads = await getAllAdSlots();

  return (
    <main className="flex-1 py-12">
      <div className="mx-auto max-w-[1000px] px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/admin" className="mb-2 inline-block text-sm text-ink-soft hover:text-ink">
              ← Admin
            </Link>
            <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Ad slots</h1>
            <p className="max-w-[60ch] text-ink-soft">
              The banner ads advertisers pay for — the site-wide strip above every category page&apos;s
              grid, and the sidebar slot on /cars. Hide one without losing its details (a lapsed
              payment), or delete it for good.
            </p>
          </div>
          <Link
            href="/admin/ads/new"
            className="whitespace-nowrap rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            Add an ad
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {AD_PLACEMENTS.map((placement) => (
            <div key={placement} className="rounded-md border border-canvas-deep bg-paper p-4">
              <p className="mb-1 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-ink-soft/75">
                {AD_PLACEMENT_LABELS[placement]}
              </p>
              <p className="text-sm text-ink-soft">{AD_PLACEMENT_SIZES[placement]}</p>
            </div>
          ))}
        </div>

        {ads.length === 0 ? (
          <p className="text-ink-soft">
            None added yet — the public site falls back to an &quot;Advertise here&quot; placeholder.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-canvas-deep bg-paper">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-canvas-deep text-left font-mono text-xs uppercase tracking-wider text-ink-soft/75">
                  <th className="px-4 py-3 font-medium">Advertiser</th>
                  <th className="px-4 py-3 font-medium">Placement</th>
                  <th className="px-4 py-3 font-medium">Creative</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id} className="border-b border-canvas-deep last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{ad.advertiserName}</td>
                    <td className="px-4 py-3 text-ink-soft">{AD_PLACEMENT_LABELS[ad.placement]}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {ad.imageUrl ? "Image" : ad.heading ? `Text: "${ad.heading}"` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-[3px] px-2 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-wider ${
                          ad.isActive ? "bg-olive/15 text-olive-deep" : "bg-rust/15 text-rust"
                        }`}
                      >
                        {ad.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <form action={toggleAdSlotActive}>
                          <input type="hidden" name="id" value={ad.id} />
                          <input type="hidden" name="isActive" value={String(ad.isActive)} />
                          <button
                            type="submit"
                            className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep"
                          >
                            {ad.isActive ? "Hide" : "Unhide"}
                          </button>
                        </form>
                        <form action={deleteAdSlot}>
                          <input type="hidden" name="id" value={ad.id} />
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
