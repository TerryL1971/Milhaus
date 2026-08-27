// src/components/listing-form.tsx
// Shared by the self-listing flow (/post) and the admin "add a listing"
// flow (/admin/listings/new) — same fields, same three-round-trip submit
// (create a draft row for its id -> upload photos into ${id}/... -> update
// with the photo URLs and the final status), just two differences:
//
// - self-list always submits source="self_listed" and lands on
//   pending_review, same as any other self-submitted home.
// - admin-add lets the admin pick the source (defaulting to
//   housing_office, since that's the actual reason this exists — Charlie
//   entering a housing-office home directly) and goes straight to active:
//   an admin adding it themselves *is* the review.
//
// Kept as one component with a variant, not two near-duplicates: the
// FormData/event.currentTarget bug found earlier this session was exactly
// the kind of thing that's easy to fix in one copy and forget in another.

"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { AMENITY_KEYS } from "@/lib/amenities";
import { BASE_NAMES } from "@/lib/bases";
import { createClient } from "@/lib/supabase/client";
import type { ListingSource } from "@/lib/types";

type Status = "idle" | "submitting" | "success" | "error";
type Variant = "self-list" | "admin-add";

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none";

export function ListingForm({ variant }: { variant: Variant }) {
  const t = useTranslations("ListingForm");
  const tAmenities = useTranslations("Amenities");
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isAdminAdd = variant === "admin-add";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React nulls out event.currentTarget once the synchronous dispatch of
    // this event finishes — capture it now, before the first `await`, or
    // `new FormData(event.currentTarget)` below throws after resuming.
    const formData = new FormData(event.currentTarget);
    setStatus("submitting");
    setErrorMessage("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("error");
      setErrorMessage(t("sessionExpired"));
      return;
    }

    const files = (formData.getAll("photos") as File[]).filter((file) => file.size > 0);
    const sizeSqmRaw = formData.get("sizeSqm") as string;
    const availableFromRaw = formData.get("availableFrom") as string;
    const source: ListingSource = isAdminAdd
      ? ((formData.get("source") as ListingSource) ?? "housing_office")
      : "self_listed";

    setProgress(t("progressSaving"));
    const { data: created, error: insertError } = await supabase
      .from("listings")
      .insert({
        title: formData.get("title"),
        description: formData.get("description") || "",
        address: formData.get("address"),
        city: formData.get("city"),
        base: formData.get("base") || null,
        distance_to_base: formData.get("distanceToBase") || null,
        price_eur_month: Number(formData.get("priceEurMonth")),
        bedrooms: Number(formData.get("bedrooms")),
        bathrooms: Number(formData.get("bathrooms")),
        size_sqm: sizeSqmRaw ? Number(sizeSqmRaw) : null,
        available_from: availableFromRaw || null,
        amenities: formData.getAll("amenities"),
        source,
        status: "draft",
        owner_id: user.id,
      })
      .select("id")
      .single();

    if (insertError || !created) {
      setStatus("error");
      setErrorMessage(insertError?.message ?? t("saveFailed"));
      return;
    }
    const listingId = created.id as string;

    const photoUrls: string[] = [];
    for (const [index, file] of files.entries()) {
      setProgress(t("progressUploading", { current: index + 1, total: files.length }));
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${listingId}/photo-${index + 1}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-photos")
        .upload(path, file, { upsert: true });
      if (uploadError) {
        setStatus("error");
        setErrorMessage(t("photoUploadFailed", { message: uploadError.message }));
        return;
      }
      const { data: publicUrlData } = supabase.storage.from("listing-photos").getPublicUrl(path);
      photoUrls.push(publicUrlData.publicUrl);
    }

    setProgress(isAdminAdd ? t("progressPublishing") : t("progressReview"));
    const { error: updateError } = await supabase
      .from("listings")
      .update({ photos: photoUrls, status: isAdminAdd ? "active" : "pending_review" })
      .eq("id", listingId);

    if (updateError) {
      setStatus("error");
      setErrorMessage(updateError.message);
      return;
    }

    setStatus("success");
    router.refresh();
  }

  if (status === "success") {
    return (
      <div className="rounded-md border border-canvas-deep bg-paper p-6 text-center">
        <p className="mb-1 font-display text-xl font-semibold text-ink">
          {isAdminAdd ? t("successAdminAddTitle") : t("successSelfListTitle")}
        </p>
        <p className="mb-4 text-sm text-ink-soft">
          {isAdminAdd ? t("successAdminAddBody") : t("successSelfListBody")}
        </p>
        {isAdminAdd && (
          <Link href="/admin" className="text-sm font-semibold text-olive-deep hover:underline">
            {t("backToAdmin")}
          </Link>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-md border border-canvas-deep bg-paper p-6 shadow-[0_8px_24px_rgba(27,42,58,0.08)]"
    >
      {isAdminAdd && (
        <div>
          <label htmlFor="source" className={labelClass}>
            {t("source")}
          </label>
          <select id="source" name="source" className={inputClass} defaultValue="housing_office">
            <option value="housing_office">{t("sourceHousingOffice")}</option>
            <option value="self_listed">{t("sourceSelfListed")}</option>
          </select>
        </div>
      )}

      <div>
        <label htmlFor="title" className={labelClass}>
          {t("title")}
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder={t("titlePlaceholder")}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          {t("description")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder={t("descriptionPlaceholder")}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="address" className={labelClass}>
            {t("address")}
          </label>
          <input id="address" name="address" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="city" className={labelClass}>
            {t("city")}
          </label>
          <input id="city" name="city" required className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="base" className={labelClass}>
            {t("nearestBase")}
          </label>
          <select id="base" name="base" className={inputClass} defaultValue="">
            <option value="" disabled>
              {t("chooseOne")}
            </option>
            {BASE_NAMES.map((base) => (
              <option key={base} value={base}>
                {base}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="distanceToBase" className={labelClass}>
            {t("distanceToBase")}
          </label>
          <input
            id="distanceToBase"
            name="distanceToBase"
            placeholder={t("distanceToBasePlaceholder")}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="priceEurMonth" className={labelClass}>
            {t("priceEurMonth")}
          </label>
          <input
            id="priceEurMonth"
            name="priceEurMonth"
            type="number"
            min="0"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="bedrooms" className={labelClass}>
            {t("bedrooms")}
          </label>
          <input id="bedrooms" name="bedrooms" type="number" min="0" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="bathrooms" className={labelClass}>
            {t("bathrooms")}
          </label>
          <input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min="0"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="sizeSqm" className={labelClass}>
            {t("sizeSqm")}
          </label>
          <input id="sizeSqm" name="sizeSqm" type="number" min="0" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="availableFrom" className={labelClass}>
          {t("availableFrom")}
        </label>
        <input id="availableFrom" name="availableFrom" type="date" className={inputClass} />
      </div>

      <div>
        <span className={labelClass}>{t("features")}</span>
        {/* Fixed at 2 columns, not 3 — German compounds ("Waschmaschine/
            Trockner") run long enough that a 3rd column left too little
            width per cell and the label overflowed into its neighbor. */}
        <div className="grid grid-cols-2 gap-2">
          {AMENITY_KEYS.map((key) => (
            <label key={key} className="flex min-w-0 items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                name="amenities"
                value={key}
                className="h-4 w-4 flex-shrink-0 rounded border-canvas-deep text-olive focus:ring-olive"
              />
              <span>{tAmenities(key)}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="photos" className={labelClass}>
          {t("photos")}
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-canvas-deep file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
        />
      </div>

      {status === "error" && <p className="text-sm text-rust">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting"
          ? progress || t("submitting")
          : isAdminAdd
            ? t("submitAdminAdd")
            : t("submitSelfList")}
      </button>
    </form>
  );
}
