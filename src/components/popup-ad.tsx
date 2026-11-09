// src/components/popup-ad.tsx
// The pop-up ad — Charlie's ask (via Terry, 2026-11-09): "a pop up ad
// that doesn't show for the first 30 seconds… and then pops up". Until
// then the site had a no-pop-ups rule (Charlie's own earlier
// preference); this is the one exception he asked for. Everything else
// still uses on-page messages and banners.
//
// Terry's decisions, same day: it's a fourth paid ad spot ("popup" in
// ad_slots), bought on /advertise and priced in Admin → Pricing like the
// other three; and it shows at most once per visit (first built as
// once a day — Charlie changed it to once per visit the same day). When no
// pop-up ad is live, nothing appears at all — no "Advertise here"
// placeholder, which would just be an interruption for nothing.
//
// This server part only fetches the live pop-up ads; the timing, the
// once-per-visit rule and the dialog itself are in popup-ad-dialog.tsx.

import { PopupAdDialog, type PopupAdContent } from "@/components/popup-ad-dialog";
import { getActiveAdSlots } from "@/lib/ad-slots-queries";

export async function PopupAd() {
  const ads = await getActiveAdSlots("popup");
  if (ads.length === 0) return null;

  const content: PopupAdContent[] = ads.map((ad) => ({
    id: ad.id,
    advertiserName: ad.advertiserName,
    imageUrl: ad.imageUrl,
    heading: ad.heading,
    bodyText: ad.bodyText,
    linkUrl: ad.linkUrl,
  }));
  return <PopupAdDialog ads={content} />;
}
