// src/app/admin/pricing/page.tsx
// Admin's Pricing page — what everyone pays to post, per category.
// Originally gated to dealer accounts only; Terry's call, reversed:
// every poster (individual or dealer) pays the listed price now.
// Prices default to €0 (free) until set here.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setFreeUntil, setListingPrice } from "@/app/admin/pricing/actions";
import { getListingPrices, type PriceableType } from "@/lib/listing-prices";
import { isAdminRole } from "@/lib/roles";
import { getFreeUntilStatus } from "@/lib/site-settings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing",
  robots: { index: false, follow: false },
};

const TYPE_LABELS: Record<PriceableType, string> = {
  rental: "Rentals",
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

  const prices = await getListingPrices();
  const { freeUntil, isActive: freeUntilIsActive } = await getFreeUntilStatus();
  // datetime-local wants "YYYY-MM-DDTHH:mm" in local time, not a full ISO
  // string — sliced from an ISO string this way lands in UTC, not the
  // viewer's own timezone, but this is a single admin-only control for a
  // date that only needs to be roughly right (a launch promo's end day),
  // not a precise-to-the-minute scheduling tool.
  const freeUntilInputValue = freeUntil ? freeUntil.toISOString().slice(0, 16) : "";

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

        <div className="mb-8 rounded-md border border-canvas-deep bg-paper p-5">
          <h2 className="mb-1 font-display text-lg font-semibold text-ink">Launch promo</h2>
          <p className="mb-4 text-sm text-ink-soft">
            One date, applies to every category above regardless of its own price — everything posts
            free until this passes. Leave it empty and this has no effect at all.
          </p>

          {freeUntil && (
            <p
              className={`mb-4 rounded-md px-3 py-2 text-sm font-semibold ${
                freeUntilIsActive ? "bg-olive/15 text-olive-deep" : "bg-canvas-deep text-ink-soft"
              }`}
            >
              {freeUntilIsActive
                ? `Active — everything is free to post until ${freeUntil.toLocaleString()}.`
                : `Ended ${freeUntil.toLocaleString()} — pricing above is back in effect.`}
            </p>
          )}

          <form action={setFreeUntil} className="flex flex-wrap items-end gap-2">
            <div>
              <label
                htmlFor="freeUntil"
                className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75"
              >
                Free until
              </label>
              <input
                id="freeUntil"
                name="freeUntil"
                type="datetime-local"
                defaultValue={freeUntilInputValue}
                className="rounded-md border border-canvas-deep bg-canvas px-3 py-1.5 text-sm text-charcoal focus:border-olive focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-brass px-4 py-1.5 text-xs font-semibold text-paper hover:bg-brass-deep"
            >
              Save
            </button>
          </form>
          {freeUntil && (
            <form action={setFreeUntil} className="mt-2">
              <input type="hidden" name="freeUntil" value="" />
              <button type="submit" className="text-xs font-semibold text-ink-soft hover:text-rust">
                Clear — stop the promo now
              </button>
            </form>
          )}
        </div>

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
      </div>
    </main>
  );
}
