// scripts/seed-demo-listings.mjs
// Seeds demo listings for showing the site to Charlie before real housing
// office / self-listed data exists. Creates two demo auth accounts (one
// "housing office", one "family") as the owners of the demo rows, then
// inserts six active listings under them.
//
// Cleanup is one step: delete the two demo accounts in the dashboard
// (Authentication -> Users, search "demo-"), or run
// scripts/delete-demo-listings.mjs. Both auth.users -> profiles and
// profiles -> listings cascade on delete, so removing the two accounts
// removes every demo listing with them — nothing to hunt down by hand.
//
// Usage: node scripts/seed-demo-listings.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
// environment (reads .env.local automatically).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    const content = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // .env.local not present — rely on the real environment (e.g. CI).
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_HOUSING_OFFICE_EMAIL = "demo-housing-office@milhaus.internal";
const DEMO_FAMILY_EMAIL = "demo-family@milhaus.internal";

async function getOrCreateDemoUser(email) {
  // listUsers + filter client-side: the admin API has no "get by email".
  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  const existing = list.users.find((u) => u.email === email);
  if (existing) return existing.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  console.log("Creating/finding demo accounts...");
  const housingOfficeId = await getOrCreateDemoUser(DEMO_HOUSING_OFFICE_EMAIL);
  const familyId = await getOrCreateDemoUser(DEMO_FAMILY_EMAIL);

  const { error: roleError } = await supabase
    .from("profiles")
    .update({ role: "housing_office_partner", display_name: "Panzer Kaserne Housing Office (demo)" })
    .eq("id", housingOfficeId);
  if (roleError) throw roleError;

  const { error: familyNameError } = await supabase
    .from("profiles")
    .update({ display_name: "Demo family" })
    .eq("id", familyId);
  if (familyNameError) throw familyNameError;

  console.log("Demo accounts ready:", { housingOfficeId, familyId });

  const listings = [
    {
      title: "3-bedroom house near Panzer Kaserne",
      description:
        "Bright, recently renovated house a short drive from Panzer Kaserne. Fenced yard, attached garage.",
      address: "Hauptstraße 14",
      city: "Böblingen",
      base: "Stuttgart",
      distance_to_base: "12 min to Panzer Kaserne",
      price_eur_month: 1180,
      bedrooms: 3,
      bathrooms: 2,
      size_sqm: 110,
      available_from: "2026-09-15",
      source: "housing_office",
      owner_id: housingOfficeId,
    },
    {
      title: "2-bedroom apartment, PCS move-out",
      description:
        "Our family is PCSing in October — clean, well-kept 2-bed apartment close to shopping and the Autobahn on-ramp.",
      address: "Gartenweg 7",
      city: "Sindelfingen",
      base: "Stuttgart",
      distance_to_base: "9 min to Panzer Kaserne",
      price_eur_month: 950,
      bedrooms: 2,
      bathrooms: 1,
      size_sqm: 78,
      available_from: "2026-10-01",
      source: "self_listed",
      owner_id: familyId,
    },
    {
      title: "4-bedroom family home",
      description: "Spacious 4-bedroom home with a large garden, close to Panzer Kaserne.",
      address: "Lindenallee 22",
      city: "Herrenberg",
      base: "Stuttgart",
      distance_to_base: "18 min to Panzer Kaserne",
      price_eur_month: 1420,
      bedrooms: 4,
      bathrooms: 2,
      size_sqm: 142,
      available_from: "2026-09-01",
      source: "housing_office",
      owner_id: housingOfficeId,
    },
    {
      title: "3-bedroom townhouse near Ramstein",
      description:
        "Modern townhouse in a quiet neighborhood, easy commute to Ramstein AB. Listed by an outgoing family.",
      address: "Bahnhofstraße 41",
      city: "Kaiserslautern",
      base: "Kaiserslautern",
      distance_to_base: "14 min to Ramstein",
      price_eur_month: 1050,
      bedrooms: 3,
      bathrooms: 1,
      size_sqm: 95,
      available_from: "2026-09-01",
      source: "self_listed",
      owner_id: familyId,
    },
    {
      title: "3-bedroom house, walk to base",
      description: "Housing office listing just minutes from the gate — 3 bed, 2 bath, move-in ready.",
      address: "Schulstraße 5",
      city: "Ramstein-Miesenbach",
      base: "Ramstein",
      distance_to_base: "6 min to base",
      price_eur_month: 1290,
      bedrooms: 3,
      bathrooms: 2,
      size_sqm: 118,
      available_from: "2026-09-01",
      source: "housing_office",
      owner_id: housingOfficeId,
    },
    {
      title: "2-bedroom apartment near Clay Kaserne",
      description: "Cozy 2-bedroom apartment close to Clay Kaserne. Outgoing family moving stateside in September.",
      address: "Goethestraße 9",
      city: "Wiesbaden",
      base: "Wiesbaden",
      distance_to_base: "11 min to Clay Kaserne",
      price_eur_month: 890,
      bedrooms: 2,
      bathrooms: 1,
      size_sqm: 72,
      available_from: "2026-09-20",
      source: "self_listed",
      owner_id: familyId,
    },
  ].map((listing) => ({ ...listing, status: "active" }));

  console.log(`Inserting ${listings.length} demo listings...`);
  const { data, error } = await supabase.from("listings").insert(listings).select("id, title");
  if (error) throw error;

  console.log("Done:");
  for (const row of data) console.log(` - ${row.id}  ${row.title}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
