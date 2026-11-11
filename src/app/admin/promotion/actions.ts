// src/app/admin/promotion/actions.ts
// Saves Admin → Promotion (Terry's ask for Charlie, 2026-11-11): the
// free-posting promotion's on/off switch, categories, dates and banner
// text, all in the one site_settings row
// (supabase/migrations/20261111120000_promotion_settings.sql). Dates are
// whole days in German time — see berlinDayStart in
// src/lib/site-settings.ts. Problems come back as a message on the page
// (?error=…) rather than an error screen, so Charlie can fix and resave.

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/roles";
import { berlinDayStart, PROMO_TYPES } from "@/lib/site-settings";
import { createClient } from "@/lib/supabase/server";

const BANNER_MAX = 200;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function fail(message: string): never {
  redirect(`/admin/promotion?error=${encodeURIComponent(message)}`);
}

function text(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value === "" ? null : value;
}

export async function savePromotion(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/promotion");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) fail("You don't have permission to change this.");

  const enabled = formData.get("enabled") === "on";
  const types = PROMO_TYPES.filter((type) => formData.getAll("types").includes(type));
  const from = text(formData, "from");
  const until = text(formData, "until");
  const bannerEn = text(formData, "bannerEn");
  const bannerDe = text(formData, "bannerDe");

  if ((from && !DAY.test(from)) || (until && !DAY.test(until))) fail("Please pick the dates from the calendar.");
  if (from && until && until < from) fail("The last free day can't be before the first one.");
  if (enabled && types.length === 0) fail("Tick at least one category to make free.");
  if ((bannerEn?.length ?? 0) > BANNER_MAX || (bannerDe?.length ?? 0) > BANNER_MAX) {
    fail(`The banner text can be at most ${BANNER_MAX} characters.`);
  }

  const { data, error } = await supabase
    .from("site_settings")
    .update({
      promo_enabled: enabled,
      promo_types: types,
      promo_starts_at: from ? berlinDayStart(from).toISOString() : null,
      // Stops at midnight after the last free day.
      free_until: until ? berlinDayStart(until, 1).toISOString() : null,
      promo_banner: formData.get("showBanner") === "on",
      promo_banner_en: bannerEn,
      promo_banner_de: bannerDe,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true)
    .select("id");

  if (error) {
    // 42703 = a column doesn't exist: the migration hasn't been run.
    fail(
      error.code === "42703"
        ? "The database needs a small update first (supabase/migrations/20261111120000_promotion_settings.sql)."
        : error.message,
    );
  }
  if (!data || data.length === 0) fail("That didn't save — you may need to sign in again.");

  // The banner is on every page and the prices on the posting pages.
  revalidatePath("/", "layout");
  redirect("/admin/promotion?saved=1");
}

/** The "Switch it off now" button: keeps everything else as it is, so
 * Charlie can switch the same promotion back on later. */
export async function stopPromotion() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .update({ promo_enabled: false, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("id");
  if (error) fail(error.message);
  if (!data || data.length === 0) fail("That didn't save — you may need to sign in again.");
  revalidatePath("/", "layout");
  redirect("/admin/promotion?saved=1");
}
