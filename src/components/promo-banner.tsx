// src/components/promo-banner.tsx
// Shows the green "Free to post for a limited time" strip only while
// the "free until" launch promo (Admin → Pricing) is running — Terry's
// ask, 2026-11-11: when free posting ends, the banner has to come down.
// It checks the date on every page load, so nobody has to remember to
// remove it. The strip itself (and its "dismiss" memory) is
// src/components/welcome-banner.tsx.

import { getTranslations } from "next-intl/server";
import { WelcomeBanner } from "@/components/welcome-banner";
import { getFreeUntilStatus } from "@/lib/site-settings";

export async function PromoBanner() {
  const { isActive } = await getFreeUntilStatus();
  if (!isActive) return null;
  const t = await getTranslations("PromoBanner");
  return <WelcomeBanner message={t("message")} dismissLabel={t("dismiss")} />;
}
