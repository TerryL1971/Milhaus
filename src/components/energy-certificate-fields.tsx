// src/components/energy-certificate-fields.tsx
// The "Energy certificate" section of the home form (for rent and for
// sale). Added 2026-11-09 after the legal review: § 87 GEG requires a
// property ad to state, from the energy certificate (Energieausweis),
// its type, the energy value, the efficiency class (on certificates
// issued since 1 May 2014), the main heating energy source and the year
// built. Landlords who leave these out get formal warnings (Abmahnungen)
// from Deutsche Umwelthilfe — so the form asks for them and won't post
// a home without them. Only a home that needs no certificate (e.g. a
// listed building) can skip the figures. Shown on the listing page by
// src/app/[locale]/listings/[id]/page.tsx.

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Listing } from "@/lib/types";

export const ENERGY_CLASSES = ["A+", "A", "B", "C", "D", "E", "F", "G", "H"] as const;
export const ENERGY_SOURCES = [
  "gas",
  "oil",
  "electricity",
  "district_heating",
  "heat_pump",
  "wood",
  "liquid_gas",
  "solar",
  "coal",
  "other",
] as const;

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none";

export function EnergyCertificateFields({ existing }: { existing?: Listing }) {
  const t = useTranslations("EnergyCertificate");
  const [type, setType] = useState<string>(existing?.energyCertificateType ?? "");
  const hasFigures = type === "demand" || type === "consumption";

  return (
    <div className="flex flex-col gap-4 rounded-md border border-canvas-deep bg-canvas/40 p-4">
      <div>
        <p className="font-display text-sm font-semibold text-ink">{t("heading")}</p>
        <p className="mt-1 text-xs text-ink-soft">{t("hint")}</p>
      </div>

      <div>
        <label htmlFor="energyCertificateType" className={labelClass}>
          {t("type")}
        </label>
        <select
          id="energyCertificateType"
          name="energyCertificateType"
          required
          value={type}
          onChange={(event) => setType(event.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            {t("choose")}
          </option>
          <option value="demand">{t("typeDemand")}</option>
          <option value="consumption">{t("typeConsumption")}</option>
          <option value="exempt">{t("typeExempt")}</option>
        </select>
      </div>

      {hasFigures && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="energyValueKwh" className={labelClass}>
              {type === "demand" ? t("valueDemand") : t("valueConsumption")}
            </label>
            <input
              id="energyValueKwh"
              name="energyValueKwh"
              type="number"
              min="0"
              max="9999"
              step="0.1"
              required
              inputMode="decimal"
              defaultValue={existing?.energyValueKwh ?? undefined}
              placeholder="e.g. 120.5"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="energyClass" className={labelClass}>
              {t("class")}
            </label>
            <select id="energyClass" name="energyClass" defaultValue={existing?.energyClass ?? ""} className={inputClass}>
              <option value="">{t("classNone")}</option>
              {ENERGY_CLASSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="energySource" className={labelClass}>
              {t("source")}
            </label>
            <select
              id="energySource"
              name="energySource"
              required
              defaultValue={existing?.energySource ?? ""}
              className={inputClass}
            >
              <option value="" disabled>
                {t("choose")}
              </option>
              {ENERGY_SOURCES.map((value) => (
                <option key={value} value={value}>
                  {t(`sources.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="yearBuilt" className={labelClass}>
              {t("yearBuilt")}
            </label>
            <input
              id="yearBuilt"
              name="yearBuilt"
              type="number"
              min="1000"
              max="2100"
              required
              inputMode="numeric"
              defaultValue={existing?.yearBuilt ?? undefined}
              placeholder="e.g. 1998"
              className={inputClass}
            />
          </div>
        </div>
      )}
    </div>
  );
}
