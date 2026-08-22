// scripts/seed-demo-listings.mjs
// Seeds demo listings for showing the site to Charlie before real housing
// office / self-listed data exists. Creates two demo auth accounts (one
// "housing office", one "family") as the owners, uploads a small set of
// real (CC0, see scripts/demo-photos/SOURCES.md) stock photos per listing
// to the real listing-photos bucket, then the listings themselves.
//
// Rerunnable: deletes any existing demo-* accounts first (which cascades
// away their listings and storage objects), then recreates everything from
// scratch. That's also how to remove the demo data for good — delete the
// two demo-* accounts in the dashboard (Authentication -> Users) and don't
// rerun this script.
//
// Usage: node scripts/seed-demo-listings.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
// environment (reads .env.local automatically).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const DEMO_EMAIL_DOMAIN = "@milhaus.internal";
const DEMO_HOUSING_OFFICE_EMAIL = "demo-housing-office" + DEMO_EMAIL_DOMAIN;
const DEMO_FAMILY_EMAIL = "demo-family" + DEMO_EMAIL_DOMAIN;

const DEMO_PHOTOS_DIR = fileURLToPath(new URL("./demo-photos/", import.meta.url));
const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".png": "image/png",
};

async function deleteExistingDemoUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  const demoUsers = data.users.filter((u) => u.email?.endsWith(DEMO_EMAIL_DOMAIN));
  for (const user of demoUsers) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;
  }
  if (demoUsers.length) console.log(`Removed ${demoUsers.length} existing demo account(s).`);
}

async function createDemoUser(email) {
  const { data, error } = await supabase.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw error;
  return data.user.id;
}

async function uploadDemoPhotos(listingId, filenames) {
  const urls = [];
  for (const [index, filename] of filenames.entries()) {
    const bytes = readFileSync(path.join(DEMO_PHOTOS_DIR, filename));
    const ext = path.extname(filename).toLowerCase();
    const storagePath = `${listingId}/photo-${index + 1}${ext}`;
    const { error } = await supabase.storage
      .from("listing-photos")
      .upload(storagePath, bytes, {
        contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
        upsert: true,
      });
    if (error) throw error;
    const { data } = supabase.storage.from("listing-photos").getPublicUrl(storagePath);
    urls.push(data.publicUrl);
  }
  return urls;
}

async function main() {
  console.log("Clearing any existing demo accounts (and their listings)...");
  await deleteExistingDemoUsers();

  console.log("Creating demo accounts...");
  const housingOfficeId = await createDemoUser(DEMO_HOUSING_OFFICE_EMAIL);
  const familyId = await createDemoUser(DEMO_FAMILY_EMAIL);

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
      photoSet: ["exterior-1.jpg", "kitchen-1.webp", "bathroom-1.webp"],
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
      photoSet: ["exterior-2.webp", "living-room-1.webp"],
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
      photoSet: ["exterior-1.jpg", "bedroom-1.webp", "living-room-1.webp"],
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
      photoSet: ["exterior-2.webp", "kitchen-1.webp"],
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
      photoSet: ["exterior-1.jpg", "bathroom-1.webp"],
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
      photoSet: ["exterior-2.webp", "bedroom-1.webp"],
    },
    {
      title: "3-bedroom house near Rose Barracks",
      description:
        "Quiet residential street close to Rose Barracks, recently updated kitchen and bath.",
      address: "Amberger Straße 12",
      city: "Grafenwöhr",
      base: "Grafenwöhr",
      distance_to_base: "8 min to Rose Barracks",
      price_eur_month: 1020,
      bedrooms: 3,
      bathrooms: 2,
      size_sqm: 102,
      available_from: "2026-09-10",
      source: "housing_office",
      owner_id: housingOfficeId,
      photoSet: ["exterior-1.jpg", "kitchen-1.webp", "living-room-1.webp"],
    },
    {
      title: "2-bedroom apartment near Spangdahlem AB",
      description: "Family PCSing this fall — well-kept 2-bed apartment a short drive from the gate.",
      address: "Eifelstraße 3",
      city: "Spangdahlem",
      base: "Spangdahlem",
      distance_to_base: "10 min to Spangdahlem AB",
      price_eur_month: 870,
      bedrooms: 2,
      bathrooms: 1,
      size_sqm: 68,
      available_from: "2026-10-05",
      source: "self_listed",
      owner_id: familyId,
      photoSet: ["exterior-2.webp", "bathroom-1.webp"],
    },
  ].map((listing) => ({ ...listing, id: randomUUID(), status: "active" }));

  console.log(`Uploading photos for ${listings.length} demo listings...`);
  for (const listing of listings) {
    listing.photos = await uploadDemoPhotos(listing.id, listing.photoSet);
    delete listing.photoSet;
  }

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
