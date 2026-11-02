// src/app/admin/ads/orders/page.tsx
// Every ad order that's been paid for or invoiced — self-serve ones from
// /advertise and Charlie's own emailed invoices — newest first. Opening
// the page checks Stripe for any invoice paid since, so Charlie never
// has to wait for the daily cron to see a payment land.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelAdOrder, markAdOrderPaid } from "@/app/admin/ads/orders/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { syncOpenAdInvoices } from "@/lib/ad-orders";
import { getAllAdOrders, type AdOrder } from "@/lib/ad-orders-queries";
import { adLineDescription } from "@/lib/ad-pricing";
import { isAdminRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ad orders",
  robots: { index: false, follow: false },
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

const STATUS: Record<AdOrder["status"], { label: string; className: string }> = {
  open: { label: "Waiting for payment", className: "bg-brass/15 text-brass-deep" },
  paid: { label: "Paid", className: "bg-olive/15 text-olive-deep" },
  void: { label: "Cancelled", className: "bg-canvas-deep text-ink-soft" },
  cart: { label: "In cart", className: "bg-canvas-deep text-ink-soft" },
};

export default async function AdminAdOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/ads/orders");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  await syncOpenAdInvoices(createAdminClient());
  const orders = await getAllAdOrders();

  return (
    <main className="flex-1 py-12">
      <div className="mx-auto max-w-[1000px] px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/admin/ads" className="mb-2 inline-block text-sm text-ink-soft hover:text-ink">
              ← Ad slots
            </Link>
            <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Ad orders &amp; invoices</h1>
            <p className="max-w-[60ch] text-ink-soft">
              Everything bought on the Advertise page, and every invoice you&apos;ve emailed. When one is
              paid, its ad spots appear in Ad slots marked &quot;Needs artwork&quot;.
            </p>
          </div>
          <Link
            href="/admin/ads/orders/new"
            className="whitespace-nowrap rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            Email an invoice
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-ink-soft">No ad orders yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-md border border-canvas-deep bg-paper p-5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{order.advertiserName}</p>
                    <p className="text-sm text-ink-soft">
                      {order.advertiserEmail} ·{" "}
                      {order.source === "invoice" ? "Invoice you sent" : "Bought on the Advertise page"} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </p>
                  </div>
                  <span
                    className={`rounded-[3px] px-2 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-wider ${STATUS[order.status].className}`}
                  >
                    {STATUS[order.status].label}
                  </span>
                </div>

                <table className="mb-3 w-full text-sm">
                  <tbody>
                    {order.lines.map((line) => (
                      <tr key={line.id} className="border-t border-canvas-deep">
                        <td className="py-1.5 text-ink-soft">
                          {adLineDescription(line.placement, line.days, line.quantity)}
                          <span className="text-ink-soft/60"> · {currency.format(line.unitPriceEur)} each</span>
                        </td>
                        <td className="py-1.5 text-right font-mono text-ink">
                          {currency.format(line.unitPriceEur * line.quantity)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-canvas-deep">
                      <td className="py-1.5 font-semibold text-ink">Total</td>
                      <td className="py-1.5 text-right font-mono font-semibold text-ink">
                        {currency.format(order.totalEur)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {order.note && <p className="mb-3 text-sm text-ink-soft">Note: {order.note}</p>}

                <div className="flex flex-wrap items-center gap-2">
                  {order.stripeInvoiceUrl && (
                    <a
                      href={order.stripeInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep"
                    >
                      View invoice
                    </a>
                  )}
                  {order.status === "open" && (
                    <>
                      <form action={markAdOrderPaid}>
                        <input type="hidden" name="id" value={order.id} />
                        <ConfirmSubmitButton
                          confirmMessage="Mark this as paid? Only do this if they paid you another way (bank transfer, cash). Their ad spots are created straight away."
                          className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep"
                        >
                          Paid another way
                        </ConfirmSubmitButton>
                      </form>
                      <form action={cancelAdOrder}>
                        <input type="hidden" name="id" value={order.id} />
                        <ConfirmSubmitButton
                          confirmMessage="Cancel this invoice? The advertiser won't be able to pay it any more."
                          className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-rust hover:text-rust"
                        >
                          Cancel invoice
                        </ConfirmSubmitButton>
                      </form>
                    </>
                  )}
                  {order.status === "paid" && (
                    <Link href="/admin/ads" className="text-xs font-semibold text-olive-deep hover:underline">
                      Set up the artwork in Ad slots →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
