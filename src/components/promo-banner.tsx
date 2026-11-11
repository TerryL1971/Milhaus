// src/components/promo-banner.tsx
// The green strip at the top of every page while a free-posting
// promotion runs. Terry's asks: it comes down by itself when the
// promotion ends (2026-11-11), and Charlie switches it on or off and
// writes its text himself in Admin → Promotion (same day) — e.g. "Post
// your car free all July". Before, it was fixed English text that stayed
// up whatever the prices were.
//
// German site: Charlie's German text if he wrote one; otherwise his
// English text (better than a standard German line that might promise
// the wrong thing); otherwise the standard text in messages/*.json.
// The strip itself, and remembering who closed it, is
// src/components/welcome-banner.tsx.

import { getLocale, getTranslations } from "next-intl/server";
import { WelcomeBanner } from "@/components/welcome-banner";
import { getPromotion } from "@/lib/site-settings";

export async function PromoBanner() {
  const promotion = await getPromotion();
  if (!promotion.isActive || !promotion.showBanner) return null;

  const t = await getTranslations("PromoBanner");
  const custom = (await getLocale()) === "de" ? (promotion.bannerDe ?? promotion.bannerEn) : promotion.bannerEn;
  return <WelcomeBanner message={custom ?? t("message")} dismissLabel={t("dismiss")} />;
}
