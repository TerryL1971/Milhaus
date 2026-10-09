// src/app/admin/pricing/page.tsx
// Admin's Pricing page — what everyone pays to post, per category.
// Originally gated to dealer accounts only; Terry's call, reversed:
// every poster (individual or dealer) pays the listed price now.
// Prices default to €0 (free) until set here.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setListingPrice } from "@/app/admin/pricing/actions";
import { getListingPrices, type PriceableType } from "@/lib/listing-prices";
import { isAdminRole } from "@/lib/roles";
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
