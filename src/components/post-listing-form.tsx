// src/components/post-listing-form.tsx
// The post-a-listing form. Submit does three round trips under one button:
// 1) create the listing as a `draft` row (so it has an id to own a photo
//    folder — the storage policy checks that a listings row with this id
//    and owner_id exists before allowing an upload into it),
// 2) upload each selected photo into `${listingId}/...`,
// 3) update the row with the resulting photo URLs and flip it to
//    `pending_review`, where it sits until an admin approves it.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BASE_NAMES } from "@/lib/bases";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "submitting" | "success" | "error";

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none";

export function PostListingForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
      setErrorMessage("Your session expired — please sign in again.");
      return;
    }

    const files = (formData.getAll("photos") as File[]).filter((file) => file.size > 0);

    const sizeSqmRaw = formData.get("sizeSqm") as string;
    const availableFromRaw = formData.get("availableFrom") as string;

    setProgress("Saving details…");
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
        source: "self_listed",
        status: "draft",
        owner_id: user.id,
      })
      .select("id")
      .single();

    if (insertError || !created) {
      setStatus("error");
      setErrorMessage(insertError?.message ?? "Could not save the listing.");
      return;
    }
    const listingId = created.id as string;

    const photoUrls: string[] = [];
    for (const [index, file] of files.entries()) {
      setProgress(`Uploading photo ${index + 1} of ${files.length}…`);
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${listingId}/photo-${index + 1}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-photos")
        .upload(path, file, { upsert: true });
      if (uploadError) {
        setStatus("error");
        setErrorMessage(`Photo upload failed: ${uploadError.message}`);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from("listing-photos").getPublicUrl(path);
      photoUrls.push(publicUrlData.publicUrl);
    }

    setProgress("Submitting for review…");
    const { error: updateError } = await supabase
      .from("listings")
      .update({ photos: photoUrls, status: "pending_review" })
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
        <p className="mb-1 font-display text-xl font-semibold text-ink">Submitted for review</p>
        <p className="text-sm text-ink-soft">
          We&apos;ll take a look, usually the same day. It&apos;ll show up on the site as soon as
          it&apos;s approved.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-md border border-canvas-deep bg-paper p-6 shadow-[0_8px_24px_rgba(27,42,58,0.08)]"
    >
      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="e.g. 3-bedroom house near Panzer Kaserne"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="What should someone know about this place?"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="address" className={labelClass}>
            Address
          </label>
          <input id="address" name="address" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="city" className={labelClass}>
            City
          </label>
          <input id="city" name="city" required className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="base" className={labelClass}>
            Nearest base
          </label>
          <select id="base" name="base" className={inputClass} defaultValue="">
            <option value="" disabled>
              Choose one
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
            Distance to base
          </label>
          <input
            id="distanceToBase"
            name="distanceToBase"
            placeholder="e.g. 12 min to Panzer Kaserne"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="priceEurMonth" className={labelClass}>
            € / month
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
            Bedrooms
          </label>
          <input id="bedrooms" name="bedrooms" type="number" min="0" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="bathrooms" className={labelClass}>
            Bathrooms
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
            Size (m²)
          </label>
          <input id="sizeSqm" name="sizeSqm" type="number" min="0" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="availableFrom" className={labelClass}>
          Available from
        </label>
        <input id="availableFrom" name="availableFrom" type="date" className={inputClass} />
      </div>

      <div>
        <label htmlFor="photos" className={labelClass}>
          Photos
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
        {status === "submitting" ? progress || "Submitting…" : "Post home"}
      </button>
    </form>
  );
}
