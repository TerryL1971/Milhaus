// src/app/cart/page.tsx
// The cart — every draft listing/business still waiting on payment,
// with one checkout for all of them. Outside the [locale] segment on
// purpose, same as /checkout and /admin — a short transactional flow
// doesn't need i18n routing, matching that existing precedent.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { removeFromCart, startCartStripeCheckout } from "@/app/cart/actions";
import { PaypalCartCheckoutButton } from "@/components/paypal-cart-checkout-button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/cart");

  const { data: items } = await supabase
    .from("cart_items")
    .select("id, listing_id, business_id, price_eur, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const listingIds = (items ?? []).filter((i) => i.listing_id).map((i) => i.listing_id as string);
  const businessIds = (items ?? []).filter((i) => i.business_id).map((i) => i.business_id as string);

  const [{ data: listings }, { data: businesses }] = await Promise.all([
    listingIds.length > 0
      ? supabase.from("listings").select("id, title, type").in("id", listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string; type: string }[] }),
    businessIds.length > 0
      ? supabase.from("businesses").select("id, name, category").in("id", businessIds)
      : Promise.resolve({ data: [] as { id: string; name: string; category: string }[] }),
  ]);

  const rows = (items ?? []).map((item) => {
    const listing = item.listing_id ? listings?.find((l) => l.id === item.listing_id) : null;
    const business = item.business_id ? businesses?.find((b) => b.id === item.business_id) : null;
    return {
      cartItemId: item.id as string,
      name: listing?.title ?? business?.name ?? "Untitled",
      category: listing?.type ?? business?.category ?? "",
      priceEur: Number(item.price_eur),
    };
  });

  const total = rows.reduce((sum, row) => sum + row.priceEur, 0);

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">Your cart</h1>

        {rows.length === 0 ? (
          <div className="rounded-md border border-canvas-deep bg-paper p-6 text-center">
            <p className="mb-2 text-ink-soft">Nothing waiting on payment right now.</p>
            <Link href="/post-ad" className="text-sm font-semibold text-olive-deep hover:underline">
              Post something →
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-8 text-ink-soft">
              Each of these is saved and ready — they're submitted for review as soon as you pay.
            </p>

            <div className="mb-6 flex flex-col gap-3">
              {rows.map((row) => (
                <div
                  key={row.cartItemId}
                  className="flex items-center justify-between gap-4 rounded-md border border-canvas-deep bg-paper px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{row.name}</p>
                    <p className="font-mono text-xs uppercase tracking-wider text-ink-soft/75">{row.category}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-ink">
                      {currencyFormatter.format(row.priceEur)}
                    </span>
                    <form action={removeFromCart}>
                      <input type="hidden" name="cartItemId" value={row.cartItemId} />
                      <button type="submit" className="text-xs font-semibold text-ink-soft hover:text-rust">
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6 flex items-center justify-between border-t border-canvas-deep pt-4">
              <span className="font-display text-lg font-semibold text-ink">Total</span>
              <span className="font-mono text-lg font-semibold text-ink">{currencyFormatter.format(total)}</span>
            </div>

            <div className="flex flex-col gap-3 rounded-md border border-canvas-deep bg-paper p-6 shadow-[0_8px_24px_rgba(27,42,58,0.08)]">
              <form action={startCartStripeCheckout}>
                <button
                  type="submit"
                  className="w-full rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
                >
                  Pay with card ({currencyFormatter.format(total)})
                </button>
              </form>

              <div className="flex items-center gap-3 text-xs text-ink-soft/60">
                <span className="h-px flex-1 bg-canvas-deep" />
                or
                <span className="h-px flex-1 bg-canvas-deep" />
              </div>

              <PaypalCartCheckoutButton />
            </div>

            <p className="mt-4 text-center text-xs text-ink-soft/60">
              Test mode — no real money changes hands yet.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
