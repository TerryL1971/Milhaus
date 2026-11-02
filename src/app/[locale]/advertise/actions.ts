// src/app/[locale]/advertise/actions.ts
// "Add to cart" on /advertise — one ad order (one line: placement ×
// quantity × term) per press, priced here on the server from Charlie's
// price list so the buyer can't send their own price. Pays through the
// same cart + Stripe Checkout as every listing (src/app/cart/actions.ts),
// which turns the order into hidden ad spots once it's paid.

"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { AD_MAX_QUANTITY, adUnitPrice, isAdTerm } from "@/lib/ad-pricing";
import { getAdPriceList } from "@/lib/ad-pricing-queries";
import { AD_PLACEMENTS, type AdPlacement } from "@/lib/ad-slots";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function addAdToCart(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const locale = await getLocale();
    redirect(`/sign-in?next=${getPathname({ href: "/advertise", locale })}`);
  }

  const placement = formData.get("placement") as string;
  const days = Number(formData.get("days"));
  const quantity = Number(formData.get("quantity"));
  const advertiserName = ((formData.get("advertiserName") as string | null) ?? "").trim();

  if (!AD_PLACEMENTS.includes(placement as AdPlacement)) throw new Error(`Not a real placement: "${placement}"`);
  if (!isAdTerm(days)) throw new Error("Pick how long the ads should run.");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > AD_MAX_QUANTITY) {
    throw new Error(`Buy between 1 and ${AD_MAX_QUANTITY} spots at a time.`);
  }
  if (!advertiserName || advertiserName.length > 120) throw new Error("Enter your business name.");

  const unitPrice = adUnitPrice(await getAdPriceList(), placement as AdPlacement, days);
  // €0 means Charlie hasn't priced this placement yet, not "free" —
  // Stripe can't take a €0 checkout anyway.
  if (unitPrice <= 0) throw new Error("This ad spot isn't on sale yet — email info@milhaus.de.");

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("ad_orders")
    .insert({
      user_id: user.id,
      advertiser_name: advertiserName,
      advertiser_email: user.email,
      source: "cart",
      status: "cart",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: lineError } = await admin
    .from("ad_order_lines")
    .insert({ order_id: order.id, placement, days, quantity, unit_price_eur: unitPrice });
  const { error: cartError } = lineError
    ? { error: lineError }
    : await admin
        .from("cart_items")
        .insert({ user_id: user.id, ad_order_id: order.id, price_eur: unitPrice * quantity });
  if (cartError) {
    await admin.from("ad_orders").delete().eq("id", order.id);
    throw new Error(cartError.message);
  }

  redirect("/cart");
}
