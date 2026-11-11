// src/app/admin/pricing/actions.ts
// Setting the per-category posting price, and the advertising price
// list, from the admin Pricing page.

"use server";

import { revalidatePath } from "next/cache";
import { AD_BASE_TERMS, type AdBaseTerm } from "@/lib/ad-pricing";
import { AD_PLACEMENTS, type AdPlacement } from "@/lib/ad-slots";
import { createClient } from "@/lib/supabase/server";
import type { PriceableType } from "@/lib/listing-prices";

const VALID_TYPES: PriceableType[] = ["rental", "rental_sale", "car", "product", "service", "business"];

export type SavePriceResult = { ok: true } | { ok: false; message: string } | null;

/** One category's posting price — each row on Admin → Pricing has its
 * own Save button (src/components/admin-price-field.tsx). Returns a
 * result rather than throwing, so the row can say "✓ Saved" or what
 * went wrong (the live site hides a thrown error's message). */
export async function setListingPrice(_previous: SavePriceResult, formData: FormData): Promise<SavePriceResult> {
  const type = formData.get("type") as string;
  const raw = formData.get("priceEur");
  const priceEur = Number(raw);

  if (!VALID_TYPES.includes(type as PriceableType)) {
    return { ok: false, message: `Not a real listing type: "${type}"` };
  }
  if (raw === null || raw === "" || !Number.isFinite(priceEur) || priceEur < 0) {
    return { ok: false, message: "Price must be a number, 0 or more." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_prices")
    .update({ price_eur: priceEur, updated_at: new Date().toISOString() })
    .eq("type", type)
    .select("type");

  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) {
    return { ok: false, message: "That didn't save — you may need to sign in again." };
  }
  // The prices also show on the posting pages and in the footer.
  revalidatePath("/", "layout");
  return { ok: true };
}

// The "free until" launch-promo date that used to be saved here is now
// part of Admin → Promotion (src/app/admin/promotion/actions.ts,
// 2026-11-11).

// ---------- Advertising prices (/advertise, ad invoices) ----------
// See src/lib/ad-pricing.ts for how these three combine.

/** Runs one ad-price save and turns any problem into a message for the
 * row (src/components/admin-price-field.tsx) instead of an error screen —
 * the live site hides a thrown error's message. Added 2026-11-11 when
 * these rows got the same "Not saved yet" highlight as the posting
 * prices (Terry's ask). */
async function asResult(save: () => Promise<void>): Promise<SavePriceResult> {
  try {
    await save();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "That didn't save — try again." };
  }
}

function revalidateAdPricing() {
  revalidatePath("/admin/pricing");
  revalidatePath("/advertise");
  revalidatePath("/de/advertise");
}

function parseEuro(raw: FormDataEntryValue | null, what: string): number {
  const value = Number(raw);
  if (raw === null || raw === "" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${what} must be a number, 0 or more.`);
  }
  return value;
}

function assertPlacement(placement: string) {
  if (!AD_PLACEMENTS.includes(placement as AdPlacement)) throw new Error(`Not a real placement: "${placement}"`);
}

function assertTerm(days: number) {
  if (!AD_BASE_TERMS.includes(days as AdBaseTerm)) throw new Error(`Not a real term: ${days} days`);
}

async function expectRow(result: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>) {
  const { data, error } = await result;
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("That didn't go through — you may not have permission to do this.");
  }
}

export async function setAdMonthlyPrice(_previous: SavePriceResult, formData: FormData): Promise<SavePriceResult> {
  return asResult(async () => {
    const placement = formData.get("placement") as string;
    assertPlacement(placement);
    const monthlyEur = parseEuro(formData.get("monthlyEur"), "The 30-day price");

    const supabase = await createClient();
    await expectRow(
      supabase
        .from("ad_prices")
        .update({ monthly_eur: monthlyEur, updated_at: new Date().toISOString() })
        .eq("placement", placement)
        .select("placement"),
    );
    revalidateAdPricing();
  });
}

export async function setAdTermDiscount(_previous: SavePriceResult, formData: FormData): Promise<SavePriceResult> {
  return asResult(async () => {
    const days = Number(formData.get("days"));
    assertTerm(days);
    const discountPct = Number(formData.get("discountPct"));
    if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) {
      throw new Error("The discount must be between 0 and 100 %.");
    }

    const supabase = await createClient();
    await expectRow(
      supabase
        .from("ad_term_discounts")
        .update({ discount_pct: discountPct, updated_at: new Date().toISOString() })
        .eq("days", days)
        .select("days"),
    );
    revalidateAdPricing();
  });
}

/** A fixed price for one placement + term. Saving it empty goes back to
 * the 30-day price × months − discount. */
export async function setAdPriceOverride(_previous: SavePriceResult, formData: FormData): Promise<SavePriceResult> {
  return asResult(async () => {
    const placement = formData.get("placement") as string;
    assertPlacement(placement);
    const days = Number(formData.get("days"));
    assertTerm(days);
    const raw = formData.get("priceEur");

    const supabase = await createClient();
    if (raw === null || raw === "") {
      const { error } = await supabase.from("ad_price_overrides").delete().eq("placement", placement).eq("days", days);
      if (error) throw new Error(error.message);
    } else {
      await expectRow(
        supabase
          .from("ad_price_overrides")
          .upsert({
            placement,
            days,
            price_eur: parseEuro(raw, "The fixed price"),
            updated_at: new Date().toISOString(),
          })
          .select("placement"),
      );
    }
    revalidateAdPricing();
  });
}
