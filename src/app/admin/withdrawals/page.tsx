// src/app/admin/withdrawals/page.tsx
// Admin → Withdrawals: every "Withdraw from contract" request a customer
// has sent through /withdraw (2026-11-09 legal pass, § 356a BGB). The
// law gives Charlie 14 days from receipt to refund, so each open request
// shows its deadline. Refund in Stripe, then "Mark handled" here.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { markWithdrawalHandled } from "@/app/admin/withdrawals/actions";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Withdrawals",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

type Row = {
  id: string;
  name: string;
  email: string;
  contract_details: string;
  ordered_on: string | null;
  status: "open" | "handled";
  admin_note: string | null;
  confirmation_sent: boolean;
  created_at: string;
  handled_at: string | null;
};

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/withdrawals");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  const { data } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];
  const open = rows.filter((row) => row.status === "open");
  const handled = rows.filter((row) => row.status === "handled");

  return (
    <main className="flex-1 py-12">
      <div className="mx-auto max-w-[900px] px-8">
        <div className="mb-10">
          <Link href="/admin" className="mb-2 inline-block text-sm text-ink-soft hover:text-ink">
            ← Admin
          </Link>
          <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Withdrawals</h1>
          <p className="max-w-[65ch] text-ink-soft">
            Customers who used &ldquo;Withdraw from contract&rdquo;. Refund each one in full within 14
            days of the date received (Stripe Dashboard → Payments → find the payment → Refund). If
            their listing or ad had already started, you may keep a share for the days it ran —
            check with your lawyer or accountant before doing that. Then mark it handled.
          </p>
        </div>

        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Open</h2>
        {open.length === 0 ? (
          <p className="mb-12 text-sm text-ink-soft">No open withdrawals.</p>
        ) : (
          <div className="mb-12 flex flex-col gap-3">
            {open.map((row) => {
              const received = new Date(row.created_at);
              const deadline = new Date(received.getTime() + 14 * 24 * 60 * 60 * 1000);
              return (
                <div key={row.id} className="rounded-md border border-canvas-deep bg-paper p-4">
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-ink">
                      {row.name} ·{" "}
                      <a href={`mailto:${row.email}`} className="text-olive-deep hover:underline">
                        {row.email}
                      </a>
                    </p>
                    <p className="font-mono text-xs text-rust">Refund by {dateFormatter.format(deadline)}</p>
                  </div>
                  <p className="mb-2 whitespace-pre-line text-sm text-charcoal">{row.contract_details}</p>
                  <p className="mb-3 text-xs text-ink-soft">
                    Received {dateFormatter.format(received)}
                    {row.ordered_on ? ` · ordered ${row.ordered_on}` : ""}
                    {row.confirmation_sent ? " · confirmation emailed" : " · confirmation email NOT sent — email them yourself"}
                  </p>
                  <form action={markWithdrawalHandled} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={row.id} />
                    <input
                      name="adminNote"
                      maxLength={1000}
                      placeholder="Note (e.g. refunded €10 on Nov 12)"
                      className="min-w-[220px] flex-1 rounded-md border border-canvas-deep bg-paper px-3 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-olive px-4 py-1.5 text-sm font-semibold text-paper hover:-translate-y-px"
                    >
                      Mark handled
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}

        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Handled</h2>
        {handled.length === 0 ? (
          <p className="text-sm text-ink-soft">Nothing handled yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {handled.map((row) => (
              <div key={row.id} className="rounded-md border border-canvas-deep bg-paper/60 px-4 py-3 text-sm">
                <p className="text-ink">
                  {row.name} · {row.email}
                </p>
                <p className="text-xs text-ink-soft">
                  Received {dateFormatter.format(new Date(row.created_at))}
                  {row.handled_at ? ` · handled ${dateFormatter.format(new Date(row.handled_at))}` : ""}
                  {row.admin_note ? ` · ${row.admin_note}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
