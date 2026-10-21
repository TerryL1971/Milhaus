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

        <form action={createBusiness} encType="multipart/form-data" className="flex flex-col gap-5">
          <div>
            <label htmlFor="name" className={labelClass}>
              Business name
            </label>
            <input id="name" name="name" required className={inputClass} />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Business email
            </label>
            <input id="email" name="email" type="email" required className={inputClass} />
            <p className="mt-1 text-xs text-ink-soft/75">
              Used for the consent confirmation link if you pick the email method below.
            </p>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="logo" className={labelClass}>
                Upload your logo (optional)
              </label>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                className="w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-canvas-deep file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
              />
              <p className="mt-1 text-xs text-ink-soft/75">Shown as a small badge/profile picture.</p>
            </div>
            <div>
              <label htmlFor="coverImage" className={labelClass}>
                Upload your cover image (optional)
              </label>
              <input
                id="coverImage"
                name="coverImage"
                type="file"
                accept="image/*"
                className="w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-canvas-deep file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
              />
              <p className="mt-1 text-xs text-ink-soft/75">Wide banner shown on the tile and profile page.</p>
            </div>
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              About the business (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="What do you offer, and what should someone know before reaching out?"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="promotion" className={labelClass}>
              Current promotion/discount (optional)
            </label>
            <input
              id="promotion"
              name="promotion"
              placeholder="e.g. 10% off for military ID holders"
              className={inputClass}
            />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="instagramUrl" className={labelClass}>
                Instagram (optional)
              </label>
              <input
                id="instagramUrl"
                name="instagramUrl"
                type="url"
                placeholder="https://instagram.com/…"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="facebookUrl" className={labelClass}>
                Facebook (optional)
              </label>
              <input
                id="facebookUrl"
                name="facebookUrl"
                type="url"
                placeholder="https://facebook.com/…"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="whatsappNumber" className={labelClass}>
              WhatsApp number (optional)
            </label>
            <input
              id="whatsappNumber"
              name="whatsappNumber"
              type="tel"
              placeholder="+49…"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-ink-soft/75">
              Full international format (e.g. +49 170 1234567) — this builds the wa.me link.
            </p>
          </div>

          <div className="rounded-md border border-canvas-deep bg-canvas/40 p-4">
            <p className="mb-3 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-ink-soft/75">
              Consent — required before this can go live
            </p>
            <div>
              <label htmlFor="consentMethod" className={labelClass}>
                How was consent obtained?
              </label>
              <select id="consentMethod" name="consentMethod" defaultValue="email" className={inputClass}>
                <option value="email">Email confirmation link (send one now)</option>
                <option value="paper_form">Signed paper form</option>
                <option value="verbal_in_person">Verbal, in person</option>
              </select>
              <p className="mt-1 text-xs text-ink-soft/75">
                Picking email sends the confirmation link now and leaves this pending until clicked.
                Picking either other option marks consent as already confirmed — fill in the note (and
                proof, if you have a scan) below.
              </p>
            </div>
            <div className="mt-3">
              <label htmlFor="consentNote" className={labelClass}>
                Note (required unless using email)
              </label>
              <textarea
                id="consentNote"
                name="consentNote"
                rows={2}
                placeholder="e.g. Signed in person at the vendor fair, 2026-10-13"
                className={inputClass}
              />
            </div>
            <div className="mt-3">
              <label htmlFor="consentProof" className={labelClass}>
                Proof document (optional — a scanned signed form, etc.)
              </label>
              <input
                id="consentProof"
                name="consentProof"
                type="file"
                accept="image/*,application/pdf"
                className="w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-canvas-deep file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
              />
              <p className="mt-1 text-xs text-ink-soft/75">Stored privately — never shown on the public site.</p>
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
