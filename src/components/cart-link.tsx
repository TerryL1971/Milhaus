// src/components/cart-link.tsx
// The way back into the cart from the two places people shop — /post-ad
// (paid listings) and /advertise (ad spots). Deliberately not in the
// site header: most visitors never buy anything, so it only shows where
// a cart actually matters. Shows the item count once there's something
// in it; signed-out visitors see it too (the cart page asks them to
// sign in).

import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export async function CartLink() {
  const t = await getTranslations("CartLink");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { count } = user
    ? await supabase.from("cart_items").select("id", { count: "exact", head: true }).eq("user_id", user.id)
    : { count: 0 };
  const items = count ?? 0;

  return (
    // /cart lives outside the [locale] segment, so a plain link rather
    // than the i18n Link (which would prefix /de).
    <NextLink
      href="/cart"
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-semibold transition-[transform] hover:-translate-y-px ${
        items > 0 ? "bg-ink text-paper hover:bg-ink-soft" : "border border-canvas-deep text-ink-soft hover:border-ink hover:text-ink"
      }`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L22 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {items > 0 ? t("withItems", { count: items }) : t("empty")}
    </NextLink>
  );
}
