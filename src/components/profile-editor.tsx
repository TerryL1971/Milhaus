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
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);
  const [photoStatus, setPhotoStatus] = useState<Status>("idle");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

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

      <div className="mb-5 flex items-center gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
          <img src={photoUrl} alt="" className="h-16 w-16 rounded-full border border-canvas-deep object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-canvas-deep bg-canvas font-display text-xl font-semibold text-ink-soft">
            {(profile.displayName ?? profile.contactEmail ?? "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoStatus === "saving"}
            className="rounded-md border border-canvas-deep px-4 py-2 text-sm font-semibold text-ink-soft transition-[transform] hover:-translate-y-px hover:border-olive hover:text-olive-deep disabled:cursor-not-allowed disabled:opacity-60"
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

        {status === "error" && <p className="text-sm text-rust">{errorMessage}</p>}

        <button
          type="submit"
          disabled={status === "saving"}
          className="w-fit rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? t("saving") : status === "saved" ? t("saved") : t("save")}
        </button>
      </form>
    </div>
  );
}
