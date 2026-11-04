// src/components/listing-form.tsx
// Shared by the self-listing flow (/post, /post-car, /post-product,
// /post-service) and the admin "add a listing" flow
// (/admin/listings/new) — same three-round-trip
// submit (create a draft row for its id -> upload photos into ${id}/... ->
// update with the photo URLs and the final status) for every listing type,
// just the field set and the insert payload branch on `kind`:
//
// - self-list always submits source="self_listed" and lands on
//   pending_review, same as any other self-submitted listing.
// - admin-add goes straight to active: an admin adding it themselves
//   *is* the review. It used to offer a "Housing office" source for
//   rentals; that's gone (2026-11-04, after Charlie and Terry met the
//   on-base Housing Office — nothing may look like the Housing Office
//   listed a home), so every listing is self_listed now.
//
// Passing `existing` switches it into edit mode (/edit-listing/[id]):
// every field starts pre-filled, current photos can be removed or added
// to, and saving updates the rows in place — status is never touched, so
// a live listing stays live (Terry's call, 2026-11-02, matching the
// auto-publish setup). Admin-variant edits keep the rental source picker.
//
// Kept as one component with variant + kind props, not several near-
// duplicates: the FormData/event.currentTarget bug found earlier this
// session was exactly the kind of thing that's easy to fix in one copy
// and forget in another.

"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { AMENITY_KEYS } from "@/lib/amenities";
import { BASE_NAMES } from "@/lib/bases";
import { CAR_BODY_TYPE_KEYS, CAR_BODY_TYPE_LABELS } from "@/lib/car-body-types";
import { classifyFormError } from "@/lib/friendly-error";
import { createListingPhotoUploads, deleteRemovedListingPhotos } from "@/lib/listing-edit";
import { publishFreeListing } from "@/lib/listing-publish";
import { NEARBY_AMENITY_KEYS } from "@/lib/nearby-amenities";
import { CONDITION_KEYS, CONDITION_LABELS, PRODUCT_CATEGORY_KEYS, PRODUCT_CATEGORY_LABELS } from "@/lib/product-categories";
import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_LABELS } from "@/lib/service-categories";
import { createClient } from "@/lib/supabase/client";
import type { Listing, ListingSource, OfferType } from "@/lib/types";

type Status = "idle" | "submitting" | "success" | "error";
type Variant = "self-list" | "admin-add";
type Kind = "rental" | "car" | "product" | "service";

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none";
// This form can run to ~18 fields for a rental with no visual grouping at
// all — just one undifferentiated wall of inputs, worse under time
// pressure on a phone. These act as lightweight section dividers, not
// real <fieldset>s, since the fields inside each "section" are already
// just consecutive sibling divs rather than a wrapped group.
const sectionHeadingClass =
  "mt-2 border-t border-canvas-deep pt-5 font-display text-sm font-semibold text-ink first:mt-0 first:border-t-0 first:pt-0";

function fileExtension(file: File) {
  return file.name.split(".").pop() || "jpg";
}

// The type-specific half of a save — one copy shared by create and edit,
// so a field added to one can't silently go missing from the other.
function detailsPayload(kind: Kind, formData: FormData) {
  if (kind === "car") {
    return {
      table: "car_details",
      values: {
        make: formData.get("make"),
        model: formData.get("model"),
        year: Number(formData.get("year")),
        mileage_km: formData.get("mileageKm") ? Number(formData.get("mileageKm")) : null,
        transmission: formData.get("transmission") || null,
        us_spec: formData.get("usSpec") ? formData.get("usSpec") === "yes" : null,
        body_type: formData.get("bodyType") || null,
        low_mileage: formData.get("lowMileage") === "on",
      } as Record<string, unknown>,
    };
  }
  if (kind === "product") {
    return {
      table: "product_details",
      values: {
        product_category: formData.get("productCategory"),
        condition: formData.get("condition"),
      } as Record<string, unknown>,
    };
  }
  if (kind === "service") {
    return {
      table: "service_details",
      values: {
        service_category: formData.get("serviceCategory"),
        price_is_estimate: formData.get("priceIsEstimate") === "on",
        pricing_note: formData.get("pricingNote") || null,
      } as Record<string, unknown>,
    };
  }
  return {
    table: "rental_details",
    values: {
      address: formData.get("address"),
      bedrooms: Number(formData.get("bedrooms")),
      bathrooms: Number(formData.get("bathrooms")),
      size_sqm: formData.get("sizeSqm") ? Number(formData.get("sizeSqm")) : null,
      available_from: (formData.get("availableFrom") as string) || null,
      amenities: formData.getAll("amenities"),
      parking_spaces: formData.get("parkingSpaces") ? Number(formData.get("parkingSpaces")) : null,
      nearby_amenities: formData.getAll("nearbyAmenities"),
      internet_type: formData.get("internetType") || null,
      internet_speed_mbps: formData.get("internetSpeedMbps") ? Number(formData.get("internetSpeedMbps")) : null,
      heat_type: formData.get("heatType") || null,
      stove_type: formData.get("stoveType") || null,
      is_new: formData.get("isNew") === "on",
      available_to: formData.get("availableTo") || null,
    } as Record<string, unknown>,
  };
}

export function ListingForm({
  variant,
  kind = "rental",
  offerType = "rent",
  priceEur = null,
  existing,
}: {
  variant: Variant;
  kind?: Kind;
  /** Homes only — a home for rent or for sale (/post vs /post?for=sale).
   * Ignored when editing: an existing listing keeps its own. */
  offerType?: OfferType;
  /** Set on /edit-listing/[id] — pre-fills every field and saves as an
   * update instead of a new listing. */
  existing?: Listing;
  /** Set when this category currently costs something to post (see
   * getPostingPrice) — instead of submitting straight to
   * pending_review, the listing is saved as a draft and added to the
   * poster's cart instead. */
  priceEur?: number | null;
}) {
  const t = useTranslations("ListingForm");
  const tErrors = useTranslations("Errors");
  const tAmenities = useTranslations("Amenities");
  const tNearbyAmenities = useTranslations("NearbyAmenities");
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // True when the save went through but "Available to" had to be left
  // out (the PGRST204 fallback below) — said out loud on the success
  // screen rather than silently dropping what the lister picked.
  const [availableToSkipped, setAvailableToSkipped] = useState(false);
  // Cars only — a dealer isn't tied to one base the way a rental is, so
  // this can be several (or "every location") instead of the single
  // <select> every other kind uses.
  const [carBases, setCarBases] = useState<string[]>(
    existing?.bases ?? (existing?.base ? [existing.base] : []),
  );
  // Edit mode only — the listing's current photos, minus any the editor
  // has clicked Remove on (Undo puts one back).
  const [keptPhotos, setKeptPhotos] = useState<string[]>(existing?.photos ?? []);
  const isEdit = !!existing;

  const isAdminAdd = variant === "admin-add";
  const isRental = kind === "rental";
  const isForSale = isRental && (existing?.offerType ?? offerType) === "sale";
  const isCar = kind === "car";
  const isProduct = kind === "product";
  const isService = kind === "service";

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
    if (existing) {
      await saveEdit(existing, formData, files);
      return;
    }
    const source: ListingSource = "self_listed";

    setProgress(t("progressSaving"));
    const basePayload = {
      type: kind,
      title: formData.get("title"),
      description: formData.get("description") || "",
      city: formData.get("city"),
      base: isCar ? (carBases[0] ?? null) : formData.get("base") || null,
      bases: isCar && carBases.length > 1 ? carBases : null,
      distance_to_base: formData.get("distanceToBase") || null,
      price_eur_month: Number(formData.get("priceEurMonth")),
      offer_type: isForSale ? "sale" : "rent",
      source,
      status: "draft",
      owner_id: user.id,
    };

    const { data: created, error: insertError } = await supabase
      .from("listings")
      .insert(basePayload)
      .select("id")
      .single();

    if (insertError || !created) {
      setStatus("error");
      setErrorMessage(insertError ? tErrors(classifyFormError(insertError.message)) : t("saveFailed"));
      return;
    }
    const listingId = created.id as string;

    // Type-specific fields live on their own details table now (one row
    // per listing, listing_id as the PK/FK) rather than on `listings`
    // itself — see supabase/migrations/20260926180000_split_listing_types_and_trust_safety.sql.
    const details = detailsPayload(kind, formData);
    let { error: detailsError } = await supabase
      .from(details.table)
      .insert({ listing_id: listingId, ...details.values });
    // PGRST204 = PostgREST doesn't know the available_to column yet,
    // i.e. 20261102120000_add_rental_available_to.sql hasn't been run on
    // this database. Save the home without it rather than failing the
    // whole post over one optional badge.
    if (detailsError?.code === "PGRST204" && isRental) {
      setAvailableToSkipped(formData.get("availableTo") !== "everyone");
      ({ error: detailsError } = await supabase
        .from(details.table)
        .insert({ listing_id: listingId, ...details.values, available_to: undefined }));
    }
    if (detailsError) {
      setStatus("error");
      setErrorMessage(tErrors(classifyFormError(detailsError.message)));
      return;
    }

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
        setErrorMessage(t("photoUploadFailed", { message: tErrors(classifyFormError(uploadError.message)) }));
        return;
      }
      const { data: publicUrlData } = supabase.storage.from("listing-photos").getPublicUrl(path);
      photoUrls.push(publicUrlData.publicUrl);
    }

    const needsPayment = !isAdminAdd && !!priceEur && priceEur > 0;
    setProgress(needsPayment ? t("progressCartRedirect") : t("progressPublishing"));
    const { error: updateError } = await supabase
      .from("listings")
      // A listing with a fee owing stays in draft — ListingForm's job
      // ends at "saved and added to your cart," /cart is what moves it
      // straight to active once payment actually goes through (see
      // settleCartPayment). A free self-listing lands on pending_review
      // here only for the instant it takes publishFreeListing (below) to
      // flip it — the DB's review-gate trigger blocks this component's
      // own session from setting status=active directly, so that runs
      // server-side instead.
      .update({ photos: photoUrls, status: needsPayment ? "draft" : isAdminAdd ? "active" : "pending_review" })
      .eq("id", listingId);

    if (updateError) {
      setStatus("error");
      setErrorMessage(tErrors(classifyFormError(updateError.message)));
      return;
    }

    if (needsPayment) {
      const { error: cartError } = await supabase
        .from("cart_items")
        .insert({ user_id: user.id, listing_id: listingId, price_eur: priceEur });
      if (cartError) {
        setStatus("error");
        setErrorMessage(tErrors(classifyFormError(cartError.message)));
        return;
      }
      router.push("/cart");
      return;
    }

    if (!isAdminAdd) {
      // Charlie's call (2026-10-15): with postings potentially reaching
      // hundreds a day, he doesn't want to manually approve every free
      // one — he'll monitor the live site and take down anything that's
      // cheating instead. No price owed, so nothing further to wait on.
      try {
        await publishFreeListing(listingId);
      } catch (error) {
        setStatus("error");
        setErrorMessage(error instanceof Error ? tErrors(classifyFormError(error.message)) : t("saveFailed"));
        return;
      }
    }

    setStatus("success");
    router.refresh();
  }

  async function saveEdit(listing: Listing, formData: FormData, files: File[]) {
    const supabase = createClient();
    setProgress(t("progressSaving"));

    // New photos first, so a failed upload leaves the listing untouched
    // rather than half-saved.
    const newPhotoUrls: string[] = [];
    try {
      const uploads = files.length > 0 ? await createListingPhotoUploads(listing.id, files.map(fileExtension)) : [];
      for (const [index, upload] of uploads.entries()) {
        setProgress(t("progressUploading", { current: index + 1, total: uploads.length }));
        const { error: uploadError } = await supabase.storage
          .from("listing-photos")
          .uploadToSignedUrl(upload.path, upload.token, files[index]);
        if (uploadError) throw uploadError;
        newPhotoUrls.push(upload.publicUrl);
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        t("photoUploadFailed", {
          message: tErrors(classifyFormError(error instanceof Error ? error.message : String(error))),
        }),
      );
      return;
    }

    // Saving any old housing-office listing turns it into a normal one.
    const sourceUpdate = { source: "self_listed" as ListingSource };
    const { error: listingError } = await supabase
      .from("listings")
      .update({
        title: formData.get("title"),
        description: formData.get("description") || "",
        city: formData.get("city"),
        base: isCar ? (carBases[0] ?? null) : formData.get("base") || null,
        bases: isCar && carBases.length > 1 ? carBases : null,
        distance_to_base: formData.get("distanceToBase") || null,
        price_eur_month: Number(formData.get("priceEurMonth")),
        photos: [...keptPhotos, ...newPhotoUrls],
        ...sourceUpdate,
      })
      .eq("id", listing.id);
    if (listingError) {
      setStatus("error");
      setErrorMessage(tErrors(classifyFormError(listingError.message)));
      return;
    }

    const details = detailsPayload(kind, formData);
    let { error: detailsError } = await supabase.from(details.table).update(details.values).eq("listing_id", listing.id);
    if (detailsError?.code === "PGRST204" && isRental) {
      setAvailableToSkipped(formData.get("availableTo") !== "everyone");
      ({ error: detailsError } = await supabase
        .from(details.table)
        .update({ ...details.values, available_to: undefined })
        .eq("listing_id", listing.id));
    }
    if (detailsError) {
      setStatus("error");
      setErrorMessage(tErrors(classifyFormError(detailsError.message)));
      return;
    }

    const removed = listing.photos.filter((url) => !keptPhotos.includes(url));
    if (removed.length > 0) {
      try {
        await deleteRemovedListingPhotos(listing.id, removed);
      } catch {
        // Cleanup only — the listing itself is already saved.
      }
    }

    setStatus("success");
    router.refresh();
  }

  if (status === "success" && existing) {
    return (
      <div className="rounded-md border border-canvas-deep bg-paper p-6 text-center">
        <p className="mb-1 font-display text-xl font-semibold text-ink">{t("successEditTitle")}</p>
        <p className="mb-4 text-sm text-ink-soft">{t("successEditBody")}</p>
        {availableToSkipped && (
          <p className="mb-4 rounded-md border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust">
            {t("availableToNotSaved")}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link
            href={`${isCar ? "/cars" : isProduct ? "/products" : isService ? "/services" : "/listings"}/${existing.id}`}
            className="text-sm font-semibold text-olive-deep hover:underline"
          >
            {t("viewListing")}
          </Link>
          {isAdminAdd ? (
            <Link href="/admin" className="text-sm font-semibold text-ink-soft hover:text-ink">
              {t("backToAdmin")}
            </Link>
          ) : (
            <Link href="/my-listings" className="text-sm font-semibold text-ink-soft hover:text-ink">
              {t("goToMyListings")}
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="rounded-md border border-canvas-deep bg-paper p-6 text-center">
        <p className="mb-1 font-display text-xl font-semibold text-ink">
          {isAdminAdd
            ? t("successAdminAddTitle")
            : isCar
              ? t("successSelfListCarTitle")
              : isProduct
                ? t("successSelfListProductTitle")
                : isService
                  ? t("successSelfListServiceTitle")
                  : t("successSelfListTitle")}
        </p>
        <p className="mb-4 text-sm text-ink-soft">
          {isAdminAdd
            ? t("successAdminAddBody")
            : isCar
              ? t("successSelfListCarBody")
              : isProduct
                ? t("successSelfListProductBody")
                : isService
                  ? t("successSelfListServiceBody")
                  : t("successSelfListBody")}
        </p>
        {availableToSkipped && (
          <p className="mb-4 rounded-md border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust">
            {t("availableToNotSaved")}
          </p>
        )}
        {isAdminAdd ? (
          <Link href="/admin" className="text-sm font-semibold text-olive-deep hover:underline">
            {t("backToAdmin")}
          </Link>
        ) : (
          // A dealer/property manager posting several at once (or anyone
          // doing the same) had no way back to the form without manually
          // navigating away — this was a dead end otherwise, especially
          // now that a free category skips the cart entirely and lands
          // here directly instead of offering "+ Add another listing"
          // on the cart page.
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link
              href={isCar ? "/post-car" : isProduct ? "/post-product" : isService ? "/post-service" : "/post"}
              className="text-sm font-semibold text-olive-deep hover:underline"
            >
              {isCar
                ? t("postAnotherCar")
                : isProduct
                  ? t("postAnotherProduct")
                  : isService
                    ? t("postAnotherService")
                    : t("postAnotherHome")}
            </Link>
            <Link href="/my-listings" className="text-sm font-semibold text-ink-soft hover:text-ink">
              {t("goToMyListings")}
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-md border border-canvas-deep bg-paper p-6 shadow-[0_8px_24px_rgba(27,42,58,0.08)]"
    >
      <p className={sectionHeadingClass}>{t("sectionBasics")}</p>

      <div>
        <label htmlFor="title" className={labelClass}>
          {t("title")}
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={existing?.title}
          placeholder={
            isCar
              ? t("carTitlePlaceholder")
              : isProduct
                ? t("productTitlePlaceholder")
                : isService
                  ? t("serviceTitlePlaceholder")
                  : t("titlePlaceholder")
          }
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
          defaultValue={existing?.description}
          placeholder={
            isCar
              ? t("carDescriptionPlaceholder")
              : isProduct
                ? t("productDescriptionPlaceholder")
                : isService
                  ? t("serviceDescriptionPlaceholder")
                  : t("descriptionPlaceholder")
          }
          className={inputClass}
        />
      </div>

      {isCar && (
        <>
          <p className={sectionHeadingClass}>{t("sectionVehicleDetails")}</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="year" className={labelClass}>
              {t("year")}
            </label>
            <input
              id="year"
              name="year"
              type="number"
              min="1900"
              max="2100"
              required
              defaultValue={existing?.year ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="make" className={labelClass}>
              {t("make")}
            </label>
            <input id="make" name="make" required defaultValue={existing?.make ?? undefined} placeholder={t("makePlaceholder")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="model" className={labelClass}>
              {t("model")}
            </label>
            <input id="model" name="model" required defaultValue={existing?.model ?? undefined} placeholder={t("modelPlaceholder")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="bodyType" className={labelClass}>
              {t("bodyType")}
            </label>
            <select id="bodyType" name="bodyType" className={inputClass} defaultValue={existing?.bodyType ?? ""}>
              <option value="">{t("notSpecified")}</option>
              {CAR_BODY_TYPE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {CAR_BODY_TYPE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mileageKm" className={labelClass}>
              {t("mileageKm")}
            </label>
            <input
              id="mileageKm"
              name="mileageKm"
              type="number"
              min="0"
              defaultValue={existing?.mileageKm ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="transmission" className={labelClass}>
              {t("transmission")}
            </label>
            <select id="transmission" name="transmission" className={inputClass} defaultValue={existing?.transmission ?? ""}>
              <option value="">{t("notSpecified")}</option>
              <option value="automatic">{t("transmissionAutomatic")}</option>
              <option value="manual">{t("transmissionManual")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="usSpec" className={labelClass}>
              {t("usSpec")}
            </label>
            <select
              id="usSpec"
              name="usSpec"
              className={inputClass}
              defaultValue={existing?.usSpec == null ? "" : existing.usSpec ? "yes" : "no"}
            >
              <option value="">{t("notSpecified")}</option>
              <option value="yes">{t("usSpecYes")}</option>
              <option value="no">{t("usSpecNo")}</option>
            </select>
          </div>
          </div>
        </>
      )}

      {isCar && (
        <label className="flex items-center gap-2 text-sm text-charcoal">
          <input type="checkbox" name="lowMileage" defaultChecked={existing?.lowMileage} className="h-4 w-4 rounded border-canvas-deep text-olive focus:ring-olive" />
          <span>{t("lowMileageLabel")}</span>
        </label>
      )}

      {isProduct && (
        <>
          <p className={sectionHeadingClass}>{t("sectionItemDetails")}</p>
          <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="productCategory" className={labelClass}>
              {t("productCategory")}
            </label>
            <select
              id="productCategory"
              name="productCategory"
              required
              className={inputClass}
              defaultValue={existing?.productCategory ?? ""}
            >
              <option value="" disabled>
                {t("chooseOne")}
              </option>
              {PRODUCT_CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {PRODUCT_CATEGORY_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="condition" className={labelClass}>
              {t("condition")}
            </label>
            <select id="condition" name="condition" required className={inputClass} defaultValue={existing?.condition ?? ""}>
              <option value="" disabled>
                {t("chooseOne")}
              </option>
              {CONDITION_KEYS.map((key) => (
                <option key={key} value={key}>
                  {CONDITION_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          </div>
        </>
      )}

      {isService && (
        <>
          <p className={sectionHeadingClass}>{t("sectionServiceDetails")}</p>
          <div>
            <label htmlFor="serviceCategory" className={labelClass}>
              {t("serviceCategory")}
            </label>
            <select
              id="serviceCategory"
              name="serviceCategory"
              required
              className={inputClass}
              defaultValue={existing?.serviceCategory ?? ""}
            >
              <option value="" disabled>
                {t("chooseOne")}
              </option>
              {SERVICE_CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SERVICE_CATEGORY_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <p className={sectionHeadingClass}>{t("sectionLocation")}</p>

      {isRental && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="address" className={labelClass}>
              {t("address")}
            </label>
            <input id="address" name="address" required defaultValue={existing?.address ?? undefined} className={inputClass} />
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>
              {t("city")}
            </label>
            <input id="city" name="city" required defaultValue={existing?.city} className={inputClass} />
          </div>
        </div>
      )}

      {!isRental && (
        <div>
          <label htmlFor="city" className={labelClass}>
            {t("city")}
          </label>
          <input id="city" name="city" required defaultValue={existing?.city} className={inputClass} />
        </div>
      )}

      {isCar ? (
        <>
          <div>
            <label htmlFor="distanceToBase" className={labelClass}>
              {t("distanceToBase")}
            </label>
            <input
              id="distanceToBase"
              name="distanceToBase"
              defaultValue={existing?.distanceToBase ?? undefined}
              placeholder={t("distanceToBasePlaceholder")}
              className={inputClass}
            />
          </div>

          <div>
            <span className={labelClass}>{t("carBasesLabel")}</span>
            <label className="mb-2 flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={carBases.length === BASE_NAMES.length}
                onChange={(e) => setCarBases(e.target.checked ? [...BASE_NAMES] : [])}
                className="h-4 w-4 rounded border-canvas-deep text-olive focus:ring-olive"
              />
              <span className="font-semibold">{t("allLocations")}</span>
            </label>
            <div className="flex flex-wrap gap-4">
              {BASE_NAMES.map((base) => (
                <label key={base} className="flex items-center gap-2 text-sm text-charcoal">
                  <input
                    type="checkbox"
                    checked={carBases.includes(base)}
                    onChange={(e) =>
                      setCarBases((prev) => (e.target.checked ? [...prev, base] : prev.filter((b) => b !== base)))
                    }
                    className="h-4 w-4 rounded border-canvas-deep text-olive focus:ring-olive"
                  />
                  <span>{base}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="base" className={labelClass}>
              {t("nearestBase")}
            </label>
            <select id="base" name="base" className={inputClass} defaultValue={existing?.base ?? ""}>
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
              defaultValue={existing?.distanceToBase ?? undefined}
              placeholder={t("distanceToBasePlaceholder")}
              className={inputClass}
            />
          </div>
        </div>
      )}

      <p className={sectionHeadingClass}>{t("sectionPriceAndDetails")}</p>

      {!isRental ? (
        <div>
          <label htmlFor="priceEurMonth" className={labelClass}>
            {isCar ? t("carPrice") : isService ? t("servicePrice") : t("productPrice")}
          </label>
          <input
            id="priceEurMonth"
            name="priceEurMonth"
            type="number"
            min="0"
            required
            defaultValue={existing?.priceEurMonth}
            className={inputClass}
          />
          {isService && (
            <>
              <label className="mt-2 flex items-center gap-2 text-sm text-charcoal">
                <input
                  type="checkbox"
                  name="priceIsEstimate"
                  defaultChecked={existing?.priceIsEstimate}
                  className="h-4 w-4 rounded border-canvas-deep text-olive focus:ring-olive"
                />
                <span>{t("priceIsEstimate")}</span>
              </label>
              <textarea
                name="pricingNote"
                rows={2}
                defaultValue={existing?.pricingNote ?? undefined}
                placeholder={t("pricingNotePlaceholder")}
                className={`${inputClass} mt-2`}
              />
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="priceEurMonth" className={labelClass}>
              {isForSale ? t("salePrice") : t("priceEurMonth")}
            </label>
            <input
              id="priceEurMonth"
              name="priceEurMonth"
              type="number"
              min="0"
              required
              defaultValue={existing?.priceEurMonth}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="bedrooms" className={labelClass}>
              {t("bedrooms")}
            </label>
            <input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="0"
              required
              defaultValue={existing?.bedrooms ?? undefined}
              className={inputClass}
            />
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
              defaultValue={existing?.bathrooms ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="sizeSqm" className={labelClass}>
              {t("sizeSqm")}
            </label>
            <input
              id="sizeSqm"
              name="sizeSqm"
              type="number"
              min="0"
              defaultValue={existing?.sizeSqm ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {isRental && (
        <div>
          <label htmlFor="availableFrom" className={labelClass}>
            {t("availableFrom")}
          </label>
          <input
            id="availableFrom"
            name="availableFrom"
            type="date"
            defaultValue={existing?.availableFrom?.slice(0, 10) ?? undefined}
            className={inputClass}
          />
        </div>
      )}

      {isRental && (
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
                  defaultChecked={existing?.amenities.includes(key)}
                  className="h-4 w-4 flex-shrink-0 rounded border-canvas-deep text-olive focus:ring-olive"
                />
                <span>{tAmenities(key)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {isRental && (
        <div>
          <label htmlFor="parkingSpaces" className={labelClass}>
            {t("parkingSpaces")}
          </label>
          <input
            id="parkingSpaces"
            name="parkingSpaces"
            type="number"
            min="0"
            defaultValue={existing?.parkingSpaces ?? undefined}
            placeholder={t("parkingSpacesPlaceholder")}
            className={inputClass}
          />
        </div>
      )}

      {isRental && (
        <div>
          <span className={labelClass}>{t("nearbyAmenities")}</span>
          <div className="grid grid-cols-2 gap-2">
            {NEARBY_AMENITY_KEYS.map((key) => (
              <label key={key} className="flex min-w-0 items-center gap-2 text-sm text-charcoal">
                <input
                  type="checkbox"
                  name="nearbyAmenities"
                  value={key}
                  defaultChecked={existing?.nearbyAmenities.includes(key)}
                  className="h-4 w-4 flex-shrink-0 rounded border-canvas-deep text-olive focus:ring-olive"
                />
                <span>{tNearbyAmenities(key)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {isRental && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="internetType" className={labelClass}>
              {t("internetType")}
            </label>
            <select id="internetType" name="internetType" className={inputClass} defaultValue={existing?.internetType ?? ""}>
              <option value="">{t("notSpecified")}</option>
              <option value="dsl">{t("internetTypeDsl")}</option>
              <option value="cable">{t("internetTypeCable")}</option>
              <option value="fiber">{t("internetTypeFiber")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="internetSpeedMbps" className={labelClass}>
              {t("internetSpeedMbps")}
            </label>
            <input
              id="internetSpeedMbps"
              name="internetSpeedMbps"
              type="number"
              min="0"
              defaultValue={existing?.internetSpeedMbps ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {isRental && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="heatType" className={labelClass}>
              {t("heatType")}
            </label>
            <select id="heatType" name="heatType" className={inputClass} defaultValue={existing?.heatType ?? ""}>
              <option value="">{t("notSpecified")}</option>
              <option value="gas">{t("heatTypeGas")}</option>
              <option value="oil">{t("heatTypeOil")}</option>
              <option value="electric">{t("heatTypeElectric")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="stoveType" className={labelClass}>
              {t("stoveType")}
            </label>
            <select id="stoveType" name="stoveType" className={inputClass} defaultValue={existing?.stoveType ?? ""}>
              <option value="">{t("notSpecified")}</option>
              <option value="induction">{t("stoveTypeInduction")}</option>
              <option value="standard">{t("stoveTypeStandard")}</option>
            </select>
          </div>
        </div>
      )}

      {isRental && (
        <label className="flex items-center gap-2 text-sm text-charcoal">
          <input type="checkbox" name="isNew" defaultChecked={existing?.isNew} className="h-4 w-4 rounded border-canvas-deep text-olive focus:ring-olive" />
          <span>{t("isNewLabel")}</span>
        </label>
      )}

      {/* Charlie's "available to" ask — a three-way toggle rather than
          checkboxes so exactly one is always picked. Defaults to Everyone
          (no badge); a lister flips it only when the home is restricted. */}
      {isRental && (
        <fieldset>
          <legend className={labelClass}>{t("availableTo")}</legend>
          <div className="grid max-w-lg grid-cols-1 divide-y divide-canvas-deep overflow-hidden rounded-md border border-canvas-deep sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {(["everyone", "military_and_expats", "military_only"] as const).map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-center justify-center px-3 py-2 text-center text-sm text-charcoal transition-colors has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-olive"
              >
                <input
                  type="radio"
                  name="availableTo"
                  value={value}
                  defaultChecked={value === (existing?.availableTo ?? "everyone")}
                  className="sr-only"
                />
                {value === "everyone"
                  ? t("availableToEveryone")
                  : value === "military_only"
                    ? t("availableToMilitaryOnly")
                    : t("availableToMilitaryAndExpats")}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <p className={sectionHeadingClass}>{t("sectionPhotos")}</p>

      {existing && existing.photos.length > 0 && (
        <div>
          <span className={labelClass}>{t("currentPhotos")}</span>
          <div className="flex flex-wrap gap-3">
            {existing.photos.map((url, index) => {
              const kept = keptPhotos.includes(url);
              return (
                <div key={url} className="flex w-24 flex-col items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- tiny preview thumbnails */}
                  <img
                    src={url}
                    alt={t("photoNumber", { number: index + 1 })}
                    className={`h-24 w-24 rounded-md border border-canvas-deep object-cover ${kept ? "" : "opacity-30 grayscale"}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setKeptPhotos((prev) =>
                        kept ? prev.filter((u) => u !== url) : existing.photos.filter((u) => u === url || prev.includes(u)),
                      )
                    }
                    className={`w-full rounded-md border px-2 py-1 text-xs font-semibold ${
                      kept
                        ? "border-canvas-deep text-ink-soft hover:border-rust hover:text-rust"
                        : "border-olive text-olive-deep"
                    }`}
                  >
                    {kept ? t("removePhoto") : t("undoRemovePhoto")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="photos" className={labelClass}>
          {isEdit ? t("addPhotos") : t("photos")}
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

      {!isAdminAdd && (
        // Same reasoning as post-business's owner-confirmation checkbox
        // (Terry: Charlie needs consent for everything — images, contact
        // info, logos, not just the listing itself). `required` blocks a
        // normal submit client-side; there's no equivalent server action
        // to re-check it in the way post-business/actions.ts does — this
        // form inserts directly via the browser's Supabase client, RLS-
        // protected, not a server action someone could post straight to.
        <label className="flex items-start gap-2 rounded-md border border-canvas-deep bg-canvas/40 p-3 text-sm text-charcoal">
          <input
            type="checkbox"
            name="rightsConfirmation"
            required
            className="mt-0.5 h-4 w-4 rounded border-canvas-deep text-olive focus:ring-olive"
          />
          <span>{t("rightsConfirmation")}</span>
        </label>
      )}

      {status === "error" && <p className="text-sm text-rust">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting"
          ? progress || t("submitting")
          : isEdit
            ? t("saveChanges")
            : isAdminAdd
            ? isCar
              ? t("submitAdminAddCar")
              : isProduct
                ? t("submitAdminAddProduct")
                : isService
                  ? t("submitAdminAddService")
                  : t("submitAdminAdd")
            : isCar
              ? t("submitSelfListCar")
              : isProduct
                ? t("submitSelfListProduct")
                : isService
                  ? t("submitSelfListService")
                  : t("submitSelfList")}
      </button>
    </form>
  );
}
