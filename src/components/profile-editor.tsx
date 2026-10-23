// src/components/profile-editor.tsx
// "Your public profile" editor on /my-listings — photo, display name,
// bio, phone. This is what shows on SellerCard/the /sellers/[id] page for
// every listing this person posts, so it lives here rather than a
// separate settings page: one place a poster sets up how they look to
// buyers, right next to the listings that profile appears on.

"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deleteMyAccount } from "@/app/[locale]/my-listings/actions";
import { Avatar } from "@/components/avatar";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/profiles";

type Status = "idle" | "saving" | "saved" | "error";

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none";

export function ProfileEditor({ profile }: { profile: Profile }) {
  const t = useTranslations("ProfileEditor");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);
  const [photoStatus, setPhotoStatus] = useState<Status>("idle");
  const [coverImageUrl, setCoverImageUrl] = useState(profile.coverImageUrl);
  const [coverStatus, setCoverStatus] = useState<Status>("idle");
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [businessLogoUrl, setBusinessLogoUrl] = useState(profile.businessLogoUrl);
  const [logoStatus, setLogoStatus] = useState<Status>("idle");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoStatus("saving");

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/photo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setPhotoStatus("error");
      return;
    }
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    // Cache-bust — same filename every time (upsert), so the browser
    // would otherwise keep showing the old photo from cache.
    const url = `${data.publicUrl}?v=${Date.now()}`;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ photo_url: url })
      .eq("id", profile.id);
    if (updateError) {
      setPhotoStatus("error");
      return;
    }
    setPhotoUrl(url);
    setPhotoStatus("saved");
    router.refresh();
  }

  async function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverStatus("saving");

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/cover.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setCoverStatus("error");
      return;
    }
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ cover_image_url: url })
      .eq("id", profile.id);
    if (updateError) {
      setCoverStatus("error");
      return;
    }
    setCoverImageUrl(url);
    setCoverStatus("saved");
    router.refresh();
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoStatus("saving");

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setLogoStatus("error");
      return;
    }
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ business_logo_url: url })
      .eq("id", profile.id);
    if (updateError) {
      setLogoStatus("error");
      return;
    }
    setBusinessLogoUrl(url);
    setLogoStatus("saved");
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: formData.get("displayName") || null,
        contact_phone: formData.get("contactPhone") || null,
        bio: formData.get("bio") || null,
        website_url: formData.get("websiteUrl") || null,
        is_individual_lister: formData.get("isIndividualLister") === "on",
      })
      .eq("id", profile.id);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("saved");
    router.refresh();
  }

  return (
    <div className="rounded-md border border-canvas-deep bg-paper p-6 shadow-[0_8px_24px_rgba(27,42,58,0.08)]">
      <h2 className="mb-1 font-display text-xl font-semibold text-ink">{t("heading")}</h2>
      <p className="mb-5 text-sm text-ink-soft">{t("body")}</p>

      {/* Cover photo + avatar, LinkedIn-style (Terry's reference) — this
          is what shows behind the avatar on /sellers/[id], same
          relationship as a business's cover image to its logo. */}
      <div className="relative mb-5 h-28 overflow-hidden rounded-md bg-canvas-deep sm:h-36">
        {coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL, own account's cover photo
          <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
        )}
        <button
          type="button"
          onClick={() => coverFileInputRef.current?.click()}
          disabled={coverStatus === "saving"}
          className="absolute bottom-2 right-2 rounded-md border border-paper/50 bg-ink/70 px-3 py-1.5 text-xs font-semibold text-paper backdrop-blur-sm transition-opacity hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {coverStatus === "saving" ? t("uploadingPhoto") : t("changeCoverPhoto")}
        </button>
        <input
          ref={coverFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverChange}
        />
      </div>

      {/* relative z-10 — this already paints in front of the cover box
          by plain DOM order (it's a later sibling, not nested inside
          the cover's overflow-hidden container), but that default
          stacking is easy to second-guess at a glance in a negative-
          margin overlap like this one; making the priority explicit
          costs nothing and settles it for good. w-fit matters here,
          not just cosmetically: a flex row with no width constraint is
          still a full-width block box even where it has no visible
          content, so without it this row's empty right-hand side sat
          on top of (and ate clicks meant for) the cover photo's own
          "change cover photo" button occupying that same corner. */}
      <div className="relative z-10 -mt-12 mb-5 flex w-fit items-end gap-4 pl-1">
        <Avatar
          name={profile.displayName ?? profile.contactEmail ?? "?"}
          photoUrl={photoUrl}
          size="md"
          className="border-4 border-paper shadow-md"
        />
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoStatus === "saving"}
            className="rounded-md border border-canvas-deep bg-paper px-4 py-2 text-sm font-semibold text-ink-soft transition-[transform] hover:-translate-y-px hover:border-olive hover:text-olive-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {photoStatus === "saving" ? t("uploadingPhoto") : t("changePhoto")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="displayName" className={labelClass}>
            {t("displayName")}
          </label>
          <input
            id="displayName"
            name="displayName"
            defaultValue={profile.displayName ?? ""}
            placeholder={t("displayNamePlaceholder")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contactPhone" className={labelClass}>
            {t("contactPhone")}
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            defaultValue={profile.contactPhone ?? ""}
            placeholder={t("contactPhonePlaceholder")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="bio" className={labelClass}>
            {t("bio")}
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={profile.bio ?? ""}
            placeholder={t("bioPlaceholder")}
            className={inputClass}
          />
        </div>

        <div className="rounded-md border border-canvas-deep bg-canvas/40 p-3">
          <p className="mb-1 text-sm font-semibold text-charcoal">{t("businessLinkHeading")}</p>
          <p className="mb-3 text-sm text-ink-soft">{t("businessLinkHint")}</p>

          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-md border border-canvas-deep bg-paper">
              {businessLogoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL, own account's business logo
                <img src={businessLogoUrl} alt="" className="h-full w-full object-contain" />
              )}
            </div>
            <button
              type="button"
              onClick={() => logoFileInputRef.current?.click()}
              disabled={logoStatus === "saving"}
              className="rounded-md border border-canvas-deep bg-paper px-4 py-2 text-sm font-semibold text-ink-soft transition-[transform] hover:-translate-y-px hover:border-olive hover:text-olive-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {logoStatus === "saving" ? t("uploadingPhoto") : t("changeBusinessLogo")}
            </button>
            <input
              ref={logoFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>

          <label htmlFor="websiteUrl" className={labelClass}>
            {t("websiteUrl")}
          </label>
          <input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            defaultValue={profile.websiteUrl ?? ""}
            placeholder={t("websiteUrlPlaceholder")}
            className={inputClass}
          />
        </div>

        <label className="flex items-start gap-2 rounded-md border border-canvas-deep bg-canvas/40 p-3 text-sm text-charcoal">
          <input
            type="checkbox"
            name="isIndividualLister"
            defaultChecked={profile.isIndividualLister}
            className="mt-0.5 h-4 w-4 rounded border-canvas-deep text-olive focus:ring-olive"
          />
          <span>
            <span className="block font-semibold">{t("individualListerLabel")}</span>
            <span className="text-ink-soft">{t("individualListerHint")}</span>
          </span>
        </label>

        {status === "error" && <p className="text-sm text-rust">{errorMessage}</p>}

        <button
          type="submit"
          disabled={status === "saving"}
          className="w-fit rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? t("saving") : status === "saved" ? t("saved") : t("save")}
        </button>
      </form>

      {/* Consumer-protection requirement (GDPR's right to erasure), not
          a nice-to-have — a visitor needs a real way to delete their own
          account, not just an email address to ask with. Outside the
          profile-save form above on purpose: a different action
          entirely, not a field on "save my profile". Typing the
          confirmation word gates the button instead of a browser
          confirm() dialog, which is easy to dismiss without reading. */}
      <div className="mt-8 rounded-md border border-rust/30 bg-rust/5 p-4">
        <p className="mb-1 text-sm font-semibold text-rust">{t("dangerZoneHeading")}</p>
        <p className="mb-3 text-sm text-ink-soft">{t("dangerZoneBody")}</p>
        <form action={deleteMyAccount} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(event) => setDeleteConfirmText(event.target.value)}
            placeholder={t("deleteConfirmPlaceholder")}
            className="w-full max-w-[220px] rounded-md border border-canvas-deep bg-paper px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-rust focus:outline-none"
          />
          <button
            type="submit"
            disabled={deleteConfirmText !== t("deleteConfirmWord")}
            className="rounded-md bg-rust px-4 py-2 text-sm font-semibold text-paper transition-[transform] hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("deleteAccountButton")}
          </button>
        </form>
      </div>
    </div>
  );
}
