// src/app/admin/ads/orders/new/page.tsx
// Charlie's "email an invoice" form — who it's for, then up to
// AD_INVOICE_LINE_ROWS lines of ad spot × how many × how long. A line's
// price comes from the price list unless he types his own per-spot
// price for this deal. Submitting has Stripe email the itemized invoice
// straight away (see createAdInvoice).

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdInvoice } from "@/app/admin/ads/orders/actions";
import { AD_INVOICE_LINE_ROWS, AD_MAX_QUANTITY, AD_TERM_OPTIONS, adTermLabel, adUnitPrice } from "@/lib/ad-pricing";
import { getAdPriceList } from "@/lib/ad-pricing-queries";
import { AD_PLACEMENT_SHORT_LABELS, AD_PLACEMENTS } from "@/lib/ad-slots";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Email an ad invoice",
  robots: { index: false, follow: false },
};

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

export default async function AdminNewAdInvoicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/ads/orders/new");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  const priceList = await getAdPriceList();

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[860px] px-8">
        <Link href="/admin/ads/orders" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          ← Ad orders
        </Link>
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">Email an invoice</h1>
        <p className="mb-8 max-w-[62ch] text-ink-soft">
          Stripe emails the advertiser an itemized invoice with a Pay button as soon as you press Send,
          and emails their receipt once they pay. Their ad spots then appear in Ad slots, ready for
          their artwork. Only fill in the lines you need.
        </p>

        <form action={createAdInvoice} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="advertiserName" className={labelClass}>
                Business name
              </label>
              <input id="advertiserName" name="advertiserName" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="advertiserEmail" className={labelClass}>
                Their email (the invoice goes here)
              </label>
              <input id="advertiserEmail" name="advertiserEmail" type="email" required className={inputClass} />
            </div>
          </div>

          <fieldset className="rounded-md border border-canvas-deep bg-paper p-4">
            <legend className="px-1 font-display text-lg font-semibold text-ink">What they&apos;re buying</legend>
            <div className="hidden grid-cols-[1.4fr_0.6fr_1fr_0.8fr] gap-3 px-1 pb-1 sm:grid">
              <span className={labelClass}>Ad spot</span>
              <span className={labelClass}>How many</span>
              <span className={labelClass}>How long</span>
              <span className={labelClass}>Price each (optional)</span>
            </div>
            <div className="flex flex-col gap-3">
              {Array.from({ length: AD_INVOICE_LINE_ROWS }, (_, i) => (
                <div key={i} className="grid grid-cols-2 gap-3 border-t border-canvas-deep pt-3 sm:grid-cols-[1.4fr_0.6fr_1fr_0.8fr] sm:border-0 sm:pt-0">
                  <select name={`placement${i}`} defaultValue="site_banner" aria-label={`Line ${i + 1}: ad spot`} className={`${inputClass} col-span-2 sm:col-span-1`}>
                    {AD_PLACEMENTS.map((placement) => (
                      <option key={placement} value={placement}>
                        {AD_PLACEMENT_SHORT_LABELS[placement]}
                      </option>
                    ))}
                  </select>
                  <input
                    name={`quantity${i}`}
                    type="number"
                    min={1}
                    max={AD_MAX_QUANTITY}
                    placeholder={i === 0 ? "e.g. 10" : ""}
                    required={i === 0}
                    aria-label={`Line ${i + 1}: how many`}
                    className={inputClass}
                  />
                  <select name={`days${i}`} defaultValue={30} aria-label={`Line ${i + 1}: how long`} className={inputClass}>
                    {AD_TERM_OPTIONS.map((days) => (
                      <option key={days} value={days}>
                        {adTermLabel(days)}
                      </option>
                    ))}
                  </select>
                  <input
                    name={`unitPrice${i}`}
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="price list"
                    aria-label={`Line ${i + 1}: your own price per spot`}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <details className="rounded-md bg-canvas/50 p-4 text-sm text-ink-soft">
            <summary className="cursor-pointer font-semibold text-ink">Today&apos;s price list (per spot)</summary>
            <table className="mt-3 w-full">
              <thead>
                <tr className="text-left font-mono text-xs uppercase tracking-wider text-ink-soft/75">
                  <th className="py-1 font-medium"></th>
                  {AD_TERM_OPTIONS.slice(0, 4).map((days) => (
                    <th key={days} className="py-1 font-medium">
                      {adTermLabel(days)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AD_PLACEMENTS.map((placement) => (
                  <tr key={placement} className="border-t border-canvas-deep">
                    <td className="py-1.5 font-medium text-ink">{AD_PLACEMENT_SHORT_LABELS[placement]}</td>
                    {AD_TERM_OPTIONS.slice(0, 4).map((days) => (
                      <td key={days} className="py-1.5 font-mono">
                        {currency.format(adUnitPrice(priceList, placement, days))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2">Change these on the Pricing page. 2 years and more = that many × the 1-year price.</p>
          </details>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label htmlFor="note" className={labelClass}>
                Note on the invoice (optional)
              </label>
              <input id="note" name="note" maxLength={200} placeholder="e.g. Spring sale campaign" className={inputClass} />
            </div>
            <div>
              <label htmlFor="daysUntilDue" className={labelClass}>
                Days to pay
              </label>
              <input
                id="daysUntilDue"
                name="daysUntilDue"
                type="number"
                min={1}
                max={90}
                defaultValue={14}
                className={`${inputClass} sm:w-28`}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-fit rounded-md bg-brass px-6 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            Send invoice
          </button>
        </form>
      </div>
    </main>
  );
}
