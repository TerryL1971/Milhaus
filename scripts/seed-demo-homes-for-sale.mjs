// scripts/seed-demo-homes-for-sale.mjs
// Seeds four demo homes for sale (Charlie's 2026-11-04 ask: examples of
// what a home for sale looks like on the site), each posted by its own
// demo seller account, written the way a family selling before a PCS
// move would write it. Photos are CC0 (see scripts/demo-photos/SOURCES.md)
// and uploaded to the real listing-photos bucket.
//
// Needs 20261104120000_add_homes_for_sale.sql (offer_type) and
// 20261104170000_add_home_card_highlights.sql (highlights) applied.
//
// Rerunnable: deletes the demo-seller-* accounts first (which cascades
// away their listings) along with their photos, then recreates
// everything. To remove them for good: node scripts/seed-demo-homes-for-sale.mjs --remove
//
// Usage: node scripts/seed-demo-homes-for-sale.mjs [--remove]
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
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
    // .env.local not present — rely on the real environment.
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

const DEMO_PHOTOS_DIR = fileURLToPath(new URL("./demo-photos/", import.meta.url));
const SELLER_EMAIL_PREFIX = "demo-seller-";
const DEMO_EMAIL_DOMAIN = "@milhaus.internal";

const HOMES = [
  {
    seller: { key: "morgan", name: "The Morgan family (demo)", bio: "Army family, PCSing back to Fort Liberty in spring." },
    listing: {
      title: "4-bedroom family home with garden, Böblingen",
      description:
        "We're PCSing in February and selling the house we've loved for six years. Four bedrooms, a bright open kitchen, " +
        "and a big fenced garden the kids practically lived in. Quiet street, 12 minutes to Panzer Kaserne, walking " +
        "distance to the bakery and the S-Bahn.\n\nNew gas heating in 2023, fiber internet, double garage plus a spot in " +
        "the driveway. Happy to show it any evening or weekend — and to answer questions about buying in Germany as an " +
        "American, we went through it ourselves.",
      city: "Böblingen",
      base: "Stuttgart",
      distance_to_base: "12 min to Panzer Kaserne",
      price_eur_month: 489000,
    },
    details: {
      address: "Lindenweg 7",
      bedrooms: 4,
      bathrooms: 2,
      size_sqm: 165,
      available_from: "2027-02-15",
      amenities: ["garage", "garden", "washer_dryer", "dishwasher", "basement_storage", "parking"],
      parking_spaces: 3,
      nearby_amenities: ["school", "international_school", "grocery_store", "public_transit", "park"],
      highlights: ["garden", "garage", "international_school", "public_transit"],
      internet_type: "fiber",
      internet_speed_mbps: 500,
      heat_type: "gas",
      stove_type: "induction",
    },
    photos: ["sale-exterior-blue.jpg", "sale-kitchen-white.jpg", "sale-living-grey.jpg"],
  },
  {
    seller: { key: "reyes", name: "Dan & Amy Reyes (demo)", bio: "Air Force, stationed at Ramstein since 2021." },
    listing: {
      title: "Single-story bungalow near Ramstein AB",
      description:
        "Selling our bungalow in Ramstein-Miesenbach before our next assignment. Everything is on one floor — three " +
        "bedrooms, two full baths, and a cream kitchen we redid last year. 8 minutes to the Ramstein gate.\n\nThe yard " +
        "is low maintenance, there's a carport for two cars, and the house is wired for US appliances (220V converter " +
        "outlets in the kitchen and laundry). We'd love to sell to another military or expat family.",
      city: "Ramstein-Miesenbach",
      base: "Ramstein",
      distance_to_base: "8 min to Ramstein AB",
      price_eur_month: 365000,
    },
    details: {
      address: "Am Hirtenbrunnen 22",
      bedrooms: 3,
      bathrooms: 2,
      size_sqm: 128,
      available_from: "2027-01-05",
      amenities: ["parking", "washer_dryer", "dishwasher", "garden"],
      parking_spaces: 2,
      nearby_amenities: ["grocery_store", "restaurant", "gym", "pharmacy"],
      highlights: ["parking", "dishwasher", "garden"],
      internet_type: "cable",
      internet_speed_mbps: 250,
      heat_type: "oil",
      stove_type: "standard",
    },
    photos: ["sale-exterior-bungalow.jpg", "sale-kitchen-cream.jpg", "sale-living-bright.jpg"],
  },
  {
    seller: { key: "walsh", name: "Jennifer Walsh (demo)", bio: "Civilian with USAREUR-AF, Wiesbaden." },
    listing: {
      title: "Character home with covered porch, Wiesbaden",
      description:
        "My job is moving back to the States, so my 1930s home in Wiesbaden-Biebrich is for sale. It's full of original " +
        "details — wood floors, built-in bookshelves, a covered back porch that's perfect for summer evenings.\n\n" +
        "Three bedrooms, a home office, and a finished attic. 15 minutes to Clay Kaserne, 5 minutes to the Rhine. " +
        "Energy certificate and floor plans available on request.",
      city: "Wiesbaden",
      base: "Wiesbaden",
      distance_to_base: "15 min to Clay Kaserne",
      price_eur_month: 529000,
    },
    details: {
      address: "Rheingaustraße 51",
      bedrooms: 3,
      bathrooms: 2,
      size_sqm: 142,
      available_from: "2027-03-01",
      amenities: ["garden", "basement_storage", "washer_dryer"],
      parking_spaces: 1,
      nearby_amenities: ["park", "public_transit", "restaurant", "school", "international_school"],
      highlights: ["garden", "international_school", "park"],
      internet_type: "fiber",
      internet_speed_mbps: 1000,
      heat_type: "gas",
      stove_type: "standard",
    },
    photos: ["sale-exterior-craftsman.jpg", "sale-living-bookshelves.jpg", "sale-porch.jpg"],
  },
  {
    seller: { key: "novak", name: "The Novak family (demo)", bio: "Grafenwöhr since 2019, heading to Fort Carson." },
    listing: {
      title: "3-bedroom house near Grafenwöhr, ready for winter",
      description:
        "Our house in Eschenbach is for sale — we're PCSing to Colorado next summer. Three bedrooms, a cozy living " +
        "room, a fully tiled bathroom, and a basement with plenty of storage. The heating is brand new and the house " +
        "stays warm through the Oberpfalz winters (that's our house in the snow!).\n\n18 minutes to Grafenwöhr main " +
        "post, 12 to Rose Barracks. Large lot with room for a trampoline and a vegetable garden.",
      city: "Eschenbach",
      base: "Grafenwöhr",
      distance_to_base: "18 min to Grafenwöhr",
      price_eur_month: 298000,
    },
    details: {
      address: "Waldstraße 3",
      bedrooms: 3,
      bathrooms: 1,
      size_sqm: 118,
      available_from: "2027-06-01",
      amenities: ["garage", "garden", "basement_storage"],
      parking_spaces: 2,
      nearby_amenities: ["school", "grocery_store", "park"],
      highlights: ["garage", "garden", "school"],
      internet_type: "dsl",
      internet_speed_mbps: 100,
      heat_type: "electric",
      stove_type: "standard",
    },
    photos: ["sale-exterior-winter.jpg", "bedroom-1.webp", "bathroom-1.webp"],
  },
];

async function deleteExistingSellers() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const sellers = data.users.filter((user) => user.email?.startsWith(SELLER_EMAIL_PREFIX));
  for (const seller of sellers) {
    const { data: listings } = await supabase.from("listings").select("id").eq("owner_id", seller.id);
    for (const listing of listings ?? []) {
      const { data: files } = await supabase.storage.from("listing-photos").list(listing.id);
      if (files?.length) {
        await supabase.storage.from("listing-photos").remove(files.map((file) => `${listing.id}/${file.name}`));
      }
    }
    const { error: deleteError } = await supabase.auth.admin.deleteUser(seller.id);
    if (deleteError) throw deleteError;
    console.log(`  removed ${seller.email} and ${listings?.length ?? 0} listing(s)`);
  }
}

async function uploadPhotos(listingId, files) {
  const urls = [];
  for (const [index, file] of files.entries()) {
    const ext = path.extname(file).slice(1);
    const objectPath = `${listingId}/photo-${index + 1}.${ext}`;
    const { error } = await supabase.storage
      .from("listing-photos")
      .upload(objectPath, readFileSync(path.join(DEMO_PHOTOS_DIR, file)), {
        contentType: ext === "webp" ? "image/webp" : "image/jpeg",
        upsert: true,
      });
    if (error) throw error;
    urls.push(supabase.storage.from("listing-photos").getPublicUrl(objectPath).data.publicUrl);
  }
  return urls;
}

async function main() {
  console.log("Clearing any existing demo sellers...");
  await deleteExistingSellers();
  if (process.argv.includes("--remove")) return;

  for (const home of HOMES) {
    const { data: created, error: userError } = await supabase.auth.admin.createUser({
      email: `${SELLER_EMAIL_PREFIX}${home.seller.key}${DEMO_EMAIL_DOMAIN}`,
      email_confirm: true,
    });
    if (userError) throw userError;
    const ownerId = created.user.id;
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ display_name: home.seller.name, bio: home.seller.bio, is_individual_lister: true })
      .eq("id", ownerId);
    if (profileError) throw profileError;

    // Inserted as a draft first, the same order a real post goes in:
    // photos need the listing's id for their storage path.
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({ ...home.listing, type: "rental", offer_type: "sale", source: "self_listed", status: "draft", owner_id: ownerId })
      .select("id")
      .single();
    if (listingError) throw listingError;

    const { error: detailsError } = await supabase
      .from("rental_details")
      .insert({ listing_id: listing.id, ...home.details });
    if (detailsError) throw detailsError;

    const photos = await uploadPhotos(listing.id, home.photos);
    const { error: publishError } = await supabase
      .from("listings")
      .update({ photos, status: "active", status_changed_at: new Date().toISOString() })
      .eq("id", listing.id);
    if (publishError) throw publishError;

    console.log(`  ${home.listing.title} — €${home.listing.price_eur_month.toLocaleString("en-US")} (${listing.id})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
