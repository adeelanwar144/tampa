/**
 * Load staged Places import JSON into D1. Does not call Google.
 *
 *   npx tsx scripts/load-import-to-d1.ts
 *   npx tsx scripts/load-import-to-d1.ts --remote
 *   npx tsx scripts/load-import-to-d1.ts --only=ybor-city
 */
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  ANCHOR_NEIGHBORHOODS,
  D1_DATABASE_NAME,
  ROOT,
  STAGING_DIR,
  type StagingFile,
  loadDotEnv,
  parseCli,
  sqlBool,
  sqlNum,
  sqlString,
  uniqueSlug,
} from "./lib";

const execFileAsync = promisify(execFile);

function stagingFiles(only?: string) {
  if (!existsSync(STAGING_DIR)) {
    throw new Error(`No staging directory at ${STAGING_DIR}. Run the import first.`);
  }
  const slugs = only
    ? [only]
    : ANCHOR_NEIGHBORHOODS.map((n) => n.slug).filter((slug) =>
        existsSync(join(STAGING_DIR, `${slug}.json`)),
      );
  return slugs.map((slug) => {
    const path = join(STAGING_DIR, `${slug}.json`);
    if (!existsSync(path)) {
      throw new Error(`Missing staging file ${path}`);
    }
    return JSON.parse(readFileSync(path, "utf8")) as StagingFile;
  });
}

function buildSql(files: StagingFile[]) {
  const usedSlugs = new Set<string>();
  const statements: string[] = ["PRAGMA foreign_keys = ON;"];
  const summary: Record<
    string,
    { places: number; images: number; reviews: number; skippedClosed: number }
  > = {};

  for (const file of files) {
    const operational = file.places.filter((p) => p.businessStatus === "OPERATIONAL");
    const skippedClosed = file.places.length - operational.length;
    const placeIds = operational.map((p) => sqlString(p.placeId)).join(", ");
    if (placeIds) {
      statements.push(
        `DELETE FROM place_address_components WHERE place_id IN (${placeIds});`,
        `DELETE FROM place_reviews WHERE place_id IN (${placeIds});`,
        `DELETE FROM place_images WHERE place_id IN (${placeIds});`,
        `DELETE FROM places WHERE id IN (${placeIds});`,
      );
    }

    let images = 0;
    let reviews = 0;
    for (const place of operational) {
      const slug = uniqueSlug(place.name, usedSlugs);
      statements.push(`INSERT INTO places (
  id, place_id, slug, name, neighborhood_slug, micro_area, formatted_address,
  lat, lng, phone, website, google_maps_uri, rating, review_count, price_level,
  primary_type, business_status, hours_json, utc_offset_minutes, delivery, takeout,
  dine_in, wheelchair_accessible, tagline, description, status, imported_at
) VALUES (
  ${sqlString(place.placeId)},
  ${sqlString(place.placeId)},
  ${sqlString(slug)},
  ${sqlString(place.name)},
  ${sqlString(file.neighborhoodSlug)},
  NULL,
  ${sqlString(place.formattedAddress)},
  ${sqlNum(place.lat)},
  ${sqlNum(place.lng)},
  ${sqlString(place.phone)},
  ${sqlString(place.website)},
  ${sqlString(place.googleMapsUri)},
  ${sqlNum(place.rating)},
  ${sqlNum(place.reviewCount)},
  ${sqlNum(place.priceLevel)},
  ${sqlString(place.primaryType)},
  ${sqlString(place.businessStatus)},
  ${sqlString(JSON.stringify(place.hours))},
  ${sqlNum(place.utcOffsetMinutes)},
  ${sqlBool(place.delivery)},
  ${sqlBool(place.takeout)},
  ${sqlBool(place.dineIn)},
  ${sqlBool(place.wheelchairAccessible)},
  NULL,
  NULL,
  'draft',
  ${sqlString(file.importedAt)}
);`);

      for (const component of place.addressComponents ?? []) {
        statements.push(`INSERT OR REPLACE INTO place_address_components (
  place_id, type, long_name, short_name
) VALUES (
  ${sqlString(place.placeId)},
  ${sqlString(component.type)},
  ${sqlString(component.longName)},
  ${sqlString(component.shortName)}
);`);
      }

      place.photos.forEach((photo, index) => {
        images += 1;
        statements.push(`INSERT INTO place_images (
  id, place_id, r2_key, attribution_author, attribution_uri, is_primary, sort_order
) VALUES (
  ${sqlString(`${place.placeId}-img-${index}`)},
  ${sqlString(place.placeId)},
  ${sqlString(photo.r2Key)},
  ${sqlString(photo.attributionAuthor)},
  ${sqlString(photo.attributionUri)},
  ${index === 0 ? 1 : 0},
  ${index}
);`);
      });

      place.reviews.forEach((review, index) => {
        reviews += 1;
        statements.push(`INSERT INTO place_reviews (
  id, place_id, rating, review_text, relative_time, author_name, author_uri, author_photo_uri
) VALUES (
  ${sqlString(`${place.placeId}-rev-${index}`)},
  ${sqlString(place.placeId)},
  ${sqlNum(review.rating)},
  ${sqlString(review.text)},
  ${sqlString(review.relativePublishTimeDescription)},
  ${sqlString(review.authorName)},
  ${sqlString(review.authorUri)},
  ${sqlString(review.authorPhotoUri)}
);`);
      });
    }

    summary[file.neighborhoodSlug] = {
      places: operational.length,
      images,
      reviews,
      skippedClosed,
    };
    console.log(
      `  ${file.neighborhoodSlug}: skipping ${skippedClosed} non-OPERATIONAL place(s); inserting ${operational.length}.`,
    );
  }

  return { sql: statements.join("\n"), summary };
}

async function executeSql(sql: string, remote: boolean) {
  const outDir = join(ROOT, "db");
  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, "import-generated.sql");
  writeFileSync(file, sql, "utf8");

  const args = ["wrangler", "d1", "execute", D1_DATABASE_NAME, "--file", file, "--yes"];
  if (remote) args.push("--remote");
  else args.push("--local");

  console.log(`Executing ${file} against D1 (${remote ? "remote" : "local"})…`);
  const { stdout, stderr } = await execFileAsync("npx", args, {
    cwd: ROOT,
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (stdout.trim()) console.log(stdout.trim());
  if (stderr.trim()) console.error(stderr.trim());
}

function printSummary(
  summary: Record<string, { places: number; images: number; reviews: number; skippedClosed: number }>,
) {
  console.log("\nD1 insert summary");
  console.log(
    "neighborhood".padEnd(22) +
      "places".padStart(8) +
      "skipped".padStart(9) +
      "images".padStart(8) +
      "reviews".padStart(9),
  );
  let places = 0;
  let skipped = 0;
  let images = 0;
  let reviews = 0;
  for (const [slug, row] of Object.entries(summary)) {
    console.log(
      slug.padEnd(22) +
        String(row.places).padStart(8) +
        String(row.skippedClosed).padStart(9) +
        String(row.images).padStart(8) +
        String(row.reviews).padStart(9),
    );
    places += row.places;
    skipped += row.skippedClosed;
    images += row.images;
    reviews += row.reviews;
  }
  console.log(
    "total".padEnd(22) +
      String(places).padStart(8) +
      String(skipped).padStart(9) +
      String(images).padStart(8) +
      String(reviews).padStart(9),
  );
  console.log("\ntagline, description, and status were left NULL/'draft' — write those by hand.");
  console.log("Non-OPERATIONAL businesses were not inserted.");
}

async function main() {
  loadDotEnv();
  const { flags, opts } = parseCli(process.argv.slice(2));
  const files = stagingFiles(opts.only);
  if (files.length === 0) {
    const available = existsSync(STAGING_DIR) ? readdirSync(STAGING_DIR).join(", ") : "(none)";
    throw new Error(`No staging JSON to load. Found: ${available}`);
  }

  const { sql, summary } = buildSql(files);
  await executeSql(sql, flags.has("remote"));
  printSummary(summary);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
