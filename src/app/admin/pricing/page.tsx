// src/app/admin/pricing/page.tsx
// Admin's Pricing page — what everyone pays to post, per category.
// Originally gated to dealer accounts only; Terry's call, reversed:
// every poster (individual or dealer) pays the listed price now.
// Prices default to €0 (free) until set here.
//
// Below that, the advertising price list (/advertise and Charlie's
// emailed ad invoices): a 30-day price per ad spot, a discount for
// longer terms, and an optional fixed price for any spot + term.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  setAdMonthlyPrice,
  setAdPriceOverride,
  setAdTermDiscount,
  setListingPrice,
} from "@/app/admin/pricing/actions";
import { AD_BASE_TERMS, adTermLabel, calculatedTermPrice } from "@/lib/ad-pricing";
import { getAdPriceList } from "@/lib/ad-pricing-queries";
import { AD_PLACEMENT_SHORT_LABELS, AD_PLACEMENTS } from "@/lib/ad-slots";
import { getListingPrices, type PriceableType } from "@/lib/listing-prices";
import { isAdminRole } from "@/lib/roles";
import { getPromotion } from "@/lib/site-settings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing",
  robots: { index: false, follow: false },
};

const TYPE_LABELS: Record<PriceableType, string> = {
  rental: "Homes for rent",
  rental_sale: "Homes for sale",
  car: "Cars",
  product: "Items for sale",
  service: "Services",
  business: "Business listings",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});

export default async function AdminPricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/pricing");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  const [prices, adPrices] = await Promise.all([getListingPrices(), getAdPriceList()]);
  const promotion = await getPromotion();

  return (
    <main className="flex-1 py-12">
      <div className="mx-auto max-w-[700px] px-8">
        <Link href="/admin" className="mb-2 inline-block text-sm text-ink-soft hover:text-ink">
          ← Admin
        </Link>
        <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Pricing</h1>
        <p className="mb-8 text-ink-soft">
          What everyone pays to post, per category — a family listing their own home, car, or item
          pays the same price as anyone else. Set a price to €0 to make that category free.
        </p>

        {/* The "Launch promo" date box that was here moved to its own page,
            Admin → Promotion, on 2026-11-11 (Terry's ask): it now has an
            on/off switch, categories, dates and the banner text. */}
        <p className="mb-2 rounded-md border border-canvas-deep bg-paper px-4 py-3 text-sm text-ink-soft">
          {promotion.isActive
            ? "A promotion is running — some or all categories are free to post right now. "
            : "Want to make posting free for a while? "}
          <Link href="/admin/promotion" className="font-semibold text-olive-deep hover:underline">
            Admin → Promotion
          </Link>
        </p>

        <div className="mt-6 overflow-x-auto rounded-md border border-canvas-deep bg-paper">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-canvas-deep text-left font-mono text-xs uppercase tracking-wider text-ink-soft/75">
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Current price</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(TYPE_LABELS) as PriceableType[]).map((type) => (
                <tr key={type} className="border-b border-canvas-deep last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{TYPE_LABELS[type]}</td>
                  <td className="px-4 py-3 font-mono text-ink-soft">
                    {currencyFormatter.format(prices[type])}
                  </td>
                  <td className="px-4 py-3">
                    <form action={setListingPrice} className="flex justify-end gap-2">
                      <input type="hidden" name="type" value={type} />
                      <input
                        type="number"
                        name="priceEur"
                        min="0"
                        step="0.50"
                        defaultValue={prices[type]}
                        className="w-24 rounded-md border border-canvas-deep bg-canvas px-3 py-1.5 text-sm text-charcoal focus:border-olive focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* ---------- ADVERTISING ---------- */}
        <h2 id="advertising" className="mb-1 mt-14 font-display text-2xl font-semibold text-ink">
          Advertising prices
        </h2>
        <p className="mb-6 text-ink-soft">
          What a business pays per ad spot on the{" "}
          <Link href="/advertise" className="font-semibold text-olive-deep hover:underline">
            Advertise page
          </Link>{" "}
          and on invoices you send. Three steps: set each spot&apos;s 30-day price, set how much cheaper
          longer runs are, then check the price list — type a price in any box there to charge exactly
          that instead. A spot left at €0 shows &quot;Ask us&quot; and can&apos;t be bought online.
        </p>

        <div className="mb-6 rounded-md border border-canvas-deep bg-paper p-5">
          <h3 className="mb-3 font-display text-lg font-semibold text-ink">1. Price for 30 days</h3>
          <div className="flex flex-col gap-3">
            {AD_PLACEMENTS.map((placement) => (
              <form key={placement} action={setAdMonthlyPrice} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="placement" value={placement} />
                <span className="w-48 font-medium text-ink">{AD_PLACEMENT_SHORT_LABELS[placement]}</span>
                <input
                  type="number"
                  name="monthlyEur"
                  min="0"
                  step="0.50"
                  defaultValue={adPrices.monthlyEur[placement]}
                  aria-label={`${AD_PLACEMENT_SHORT_LABELS[placement]} price for 30 days`}
                  className="w-28 rounded-md border border-canvas-deep bg-canvas px-3 py-1.5 text-sm text-charcoal focus:border-olive focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep"
                >
                  Save
                </button>
              </form>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-md border border-canvas-deep bg-paper p-5">
          <h3 className="mb-1 font-display text-lg font-semibold text-ink">2. Discount for longer runs</h3>
          <p className="mb-3 text-sm text-ink-soft">
            Off the 30-day price × the number of months. 10 means 10 % cheaper. Over a year is charged
            as that many years at the 1-year price.
          </p>
          <div className="flex flex-col gap-3">
            {AD_BASE_TERMS.filter((days) => days !== 30).map((days) => (
              <form key={days} action={setAdTermDiscount} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="days" value={days} />
                <span className="w-48 font-medium text-ink">{adTermLabel(days)}</span>
                <input
                  type="number"
                  name="discountPct"
                  min="0"
                  max="100"
                  step="1"
                  defaultValue={adPrices.discountPct[days]}
                  aria-label={`Discount for ${adTermLabel(days)}`}
                  className="w-20 rounded-md border border-canvas-deep bg-canvas px-3 py-1.5 text-sm text-charcoal focus:border-olive focus:outline-none"
                />
                <span className="text-sm text-ink-soft">% off</span>
                <button
                  type="submit"
                  className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep"
                >
                  Save
                </button>
              </form>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-canvas-deep bg-paper p-5">
          <h3 className="mb-1 font-display text-lg font-semibold text-ink">3. The price list</h3>
          <p className="mb-4 text-sm text-ink-soft">
            The grey number is what steps 1 and 2 work out. Leave a box empty to use it, or type your
            own price and press Save. Empty the box and Save again to go back.
          </p>
          <div className="flex flex-col gap-5">
            {AD_PLACEMENTS.map((placement) => (
              <div key={placement}>
                <p className="mb-2 font-medium text-ink">{AD_PLACEMENT_SHORT_LABELS[placement]}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {AD_BASE_TERMS.map((days) => {
                    const override = adPrices.overrides[placement]?.[days];
                    return (
                      <form
                        key={days}
                        action={setAdPriceOverride}
                        className="flex items-center gap-2 rounded-md bg-canvas/50 px-3 py-2"
                      >
                        <input type="hidden" name="placement" value={placement} />
                        <input type="hidden" name="days" value={days} />
                        <span className="w-20 text-sm text-ink-soft">{adTermLabel(days)}</span>
                        <input
                          type="number"
                          name="priceEur"
                          min="0"
                          step="0.50"
                          defaultValue={override ?? ""}
                          placeholder={String(calculatedTermPrice(adPrices, placement, days))}
                          aria-label={`${AD_PLACEMENT_SHORT_LABELS[placement]}, ${adTermLabel(days)}: fixed price`}
                          className="w-24 rounded-md border border-canvas-deep bg-paper px-2 py-1 text-sm text-charcoal placeholder:text-ink-soft/50 focus:border-olive focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-canvas-deep px-2 py-1 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep"
                        >
                          Save
                        </button>
                        {override !== undefined && (
                          <span className="font-mono text-[0.62rem] uppercase tracking-wider text-olive-deep">
                            Fixed
                          </span>
                        )}
                      </form>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
