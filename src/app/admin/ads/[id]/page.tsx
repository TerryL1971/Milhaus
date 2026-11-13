// src/app/admin/ads/[id]/page.tsx
// Edit one ad — mostly for putting an invoiced advertiser's artwork
// (which they email to Charlie) on the spots they paid for, but works
// for any ad. Same fields as /admin/ads/new, plus a real file upload so
// Charlie doesn't need the image hosted somewhere first.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateAdSlot } from "@/app/admin/ads/actions";
import { adTermLabel } from "@/lib/ad-pricing";
import { mapAdSlotRow } from "@/lib/ad-slots-queries";
import { AD_PLACEMENT_LABELS, AD_PLACEMENT_SIZES } from "@/lib/ad-slots";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit ad",
  robots: { index: false, follow: false },
};

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none";

export default async function AdminEditAdPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/admin/ads/${id}`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  const { data: row } = await supabase.from("ad_slots").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();
  const ad = mapAdSlotRow(row);
  const neverLive = Boolean(ad.durationDays) && !ad.endsAt;

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <Link href="/admin/ads" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          ← Back to ad slots
        </Link>
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">
          {neverLive ? "Add artwork" : "Edit ad"}
        </h1>
        <p className="mb-2 text-ink-soft">{AD_PLACEMENT_LABELS[ad.placement]}</p>
        {ad.durationDays && (
          <p className="mb-8 text-sm text-ink-soft">
            {neverLive
              ? `Bought for ${adTermLabel(ad.durationDays)}. It goes live when you save, and the ${adTermLabel(ad.durationDays)} start then.`
              : `Runs until ${new Date(ad.endsAt!).toLocaleDateString("en-US", { dateStyle: "long" })}.`}
          </p>
        )}

        {error && (
          <p role="alert" className="mb-6 rounded-md bg-rust/10 px-3 py-2 text-sm font-semibold text-rust">
            {error}
          </p>
        )}

        <form action={updateAdSlot} className="flex flex-col gap-5">
          <input type="hidden" name="id" value={ad.id} />
          <div>
            <label htmlFor="advertiserName" className={labelClass}>
              Advertiser (for your own records — not shown publicly)
            </label>
            <input id="advertiserName" name="advertiserName" required defaultValue={ad.advertiserName} className={inputClass} />
          </div>

          <div>
            <label htmlFor="linkUrl" className={labelClass}>
              Where it links to
            </label>
            <input
              id="linkUrl"
              name="linkUrl"
              type="url"
              required
              placeholder="https://…"
              defaultValue={ad.linkUrl}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="image" className={labelClass}>
              Upload the image
            </label>
            {ad.imageUrl && (
              <div className="relative mb-2 h-24 w-full overflow-hidden rounded bg-canvas">
                <Image src={ad.imageUrl} alt="" fill sizes="600px" className="object-contain" />
              </div>
            )}
            <input id="image" name="image" type="file" accept="image/*" className="text-sm text-ink-soft" />
            <p className="mt-1 text-xs text-ink-soft">{AD_PLACEMENT_SIZES[ad.placement]} Up to 3 MB.</p>
          </div>

          <div>
            <label htmlFor="imageUrl" className={labelClass}>
              …or an image URL
            </label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              placeholder="https://…"
              defaultValue={ad.imageUrl ?? ""}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="heading" className={labelClass}>
                Heading (for a text ad)
              </label>
              <input id="heading" name="heading" defaultValue={ad.heading ?? ""} className={inputClass} />
            </div>
            <div>
              <label htmlFor="bodyText" className={labelClass}>
                Body (for a text ad)
              </label>
              <input id="bodyText" name="bodyText" defaultValue={ad.bodyText ?? ""} className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="sortOrder" className={labelClass}>
              Order (lower shows first)
            </label>
            <input id="sortOrder" name="sortOrder" type="number" defaultValue={ad.sortOrder} className={inputClass} />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {neverLive ? "Save and put live" : "Save"}
          </button>
        </form>
      </div>
    </main>
  );
}
