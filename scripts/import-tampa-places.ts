/**
 * One-time local Places API import. Never imported by the Next.js app.
 * Never deployed. After a successful full run, discard GOOGLE_PLACES_API_KEY.
 *
 *   npx tsx scripts/import-tampa-places.ts --only=ybor-city
 *   npx tsx scripts/import-tampa-places.ts --only=ybor-city --go
 *   npx tsx scripts/import-tampa-places.ts --all --go
 *   npx tsx scripts/import-tampa-places.ts --only=ybor-city --force --go
 */
import { execFile } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import {
  ANCHOR_NEIGHBORHOODS,
  PHOTO_CACHE_DIR,
  PLACE_TYPES,
  R2_BUCKET_NAME,
  ROOT,
  STAGING_DIR,
  type AnchorNeighborhood,
  type StagedAddressComponent,
  type StagedPhoto,
  type StagedPlace,
  type StagedReview,
  type StagingFile,
  loadDotEnv,
  neighborhoodBySlug,
  parseCli,
  sleep,
} from "./lib";

const execFileAsync = promisify(execFile);

const PLACES_BASE = "https://places.googleapis.com/v1";
const SEARCH_FIELD_MASK = "places.id,places.location";
const DETAILS_CORE_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "regularOpeningHours",
  "currentOpeningHours",
  "priceLevel",
  "primaryType",
  "types",
  "photos",
  "reviews",
  "googleMapsUri",
  "businessStatus",
  "addressComponents",
  "utcOffsetMinutes",
  "delivery",
  "takeout",
  "dineIn",
];
const DETAILS_OPTIONAL_FIELDS = ["accessibilityOptions", "paymentOptions"];
let detailsOptionalFields = [...DETAILS_OPTIONAL_FIELDS];

function detailsFieldMask() {
  return [...DETAILS_CORE_FIELDS, ...detailsOptionalFields].join(",");
}

const MAX_PHOTOS = 5;
const MAX_REVIEWS = 5;
const PHOTO_MAX_WIDTH = 1600;
const PAGE_SIZE = 20;
const RATE_LIMIT_MS = 350;
const EST_PAGES_PER_TYPE = 2;
const EST_PLACES_PER_NHOOD = 120;
const EST_PHOTOS_PER_PLACE = 3;

type SearchPlace = { id?: string; location?: { latitude?: number; longitude?: number } };
type SearchResponse = { places?: SearchPlace[]; nextPageToken?: string };

type PhotoAttribution = {
  displayName?: string;
  uri?: string;
  photoUri?: string;
};

type PlacePhoto = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: PhotoAttribution[];
};

type PlaceReview = {
  rating?: number;
  text?: { text?: string };
  relativePublishTimeDescription?: string;
  authorAttribution?: PhotoAttribution;
};

type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

type PlaceDetails = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: unknown;
  currentOpeningHours?: unknown;
  priceLevel?: string | number;
  primaryType?: string;
  types?: string[];
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  googleMapsUri?: string;
  businessStatus?: string;
  addressComponents?: AddressComponent[];
  utcOffsetMinutes?: number;
  delivery?: boolean;
  takeout?: boolean;
  dineIn?: boolean;
  accessibilityOptions?: {
    wheelchairAccessibleEntrance?: boolean;
    wheelchairAccessibleParking?: boolean;
    wheelchairAccessibleRestroom?: boolean;
    wheelchairAccessibleSeating?: boolean;
  };
  paymentOptions?: {
    acceptsCreditCards?: boolean;
    acceptsDebitCards?: boolean;
    acceptsCashOnly?: boolean;
    acceptsNfc?: boolean;
  };
};

const totals = {
  searches: 0,
  details: 0,
  photos: 0,
  places: 0,
  reviews: 0,
  photosR2: 0,
  photosLocal: 0,
};

function apiKey() {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY is missing. Add it to .env and re-run. This script is the only consumer — the app never calls Google.",
    );
  }
  return key;
}

async function placesFetch(url: string, init: RequestInit, attempt = 1): Promise<Response> {
  const res = await fetch(url, init);
  if (res.status !== 429) return res;

  const text = await res.text();
  const dailyQuota =
    /per day/i.test(text) ||
    (/RESOURCE_EXHAUSTED/i.test(text) && /GetPlaceRequestPerDay|Quota exceeded/i.test(text));
  if (dailyQuota) {
    throw new Error(
      `Places daily quota exhausted (no more retries — further 429s still count). ${text.slice(0, 500)}`,
    );
  }

  if (attempt <= 6) {
    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt;
    console.warn(`  429 rate-limited, backing off ${waitMs}ms (attempt ${attempt})`);
    await sleep(waitMs);
    return placesFetch(url, init, attempt + 1);
  }

  return new Response(text, { status: 429, headers: res.headers });
}

function circleToViewport(lat: number, lng: number, radiusMeters: number) {
  const earth = 6378137;
  const dLat = (radiusMeters / earth) * (180 / Math.PI);
  const dLng = (radiusMeters / (earth * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
  return {
    rectangle: {
      low: { latitude: lat - dLat, longitude: lng - dLng },
      high: { latitude: lat + dLat, longitude: lng + dLng },
    },
  };
}

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const earth = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

let useCircleRestriction = true;

function locationRestrictionFor(neighborhood: AnchorNeighborhood) {
  if (useCircleRestriction) {
    return {
      circle: {
        center: { latitude: neighborhood.lat, longitude: neighborhood.lng },
        radius: neighborhood.radiusM,
      },
    };
  }
  return circleToViewport(neighborhood.lat, neighborhood.lng, neighborhood.radiusM);
}

async function searchPage(
  neighborhood: AnchorNeighborhood,
  includedType: string,
  pageToken?: string,
): Promise<SearchResponse> {
  const body: Record<string, unknown> = {
    textQuery: `${includedType.replaceAll("_", " ")} in ${neighborhood.name}, Tampa, Florida`,
    includedType,
    strictTypeFiltering: true,
    languageCode: "en",
    regionCode: "US",
    pageSize: PAGE_SIZE,
    locationRestriction: locationRestrictionFor(neighborhood),
  };
  if (pageToken) body.pageToken = pageToken;

  const res = await placesFetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  totals.searches += 1;
  if (!res.ok) {
    const text = await res.text();
    if (
      useCircleRestriction &&
      res.status === 400 &&
      /circle|location_restriction|locationRestriction/i.test(text)
    ) {
      console.warn(
        "  Text Search rejected locationRestriction.circle — retrying with the equivalent viewport rectangle (Places Text Search only accepts a rectangle for restriction).",
      );
      useCircleRestriction = false;
      totals.searches -= 1;
      return searchPage(neighborhood, includedType, pageToken);
    }
    throw new Error(`Text Search failed (${res.status}) for ${neighborhood.slug}/${includedType}: ${text}`);
  }
  return (await res.json()) as SearchResponse;
}

async function searchNeighborhood(neighborhood: AnchorNeighborhood, seenGlobal: Set<string>) {
  const ids: string[] = [];
  for (const type of PLACE_TYPES) {
    let pageToken: string | undefined;
    let pages = 0;
    do {
      await sleep(RATE_LIMIT_MS);
      const data = await searchPage(neighborhood, type, pageToken);
      pages += 1;
      for (const place of data.places ?? []) {
        if (!place.id) continue;
        if (seenGlobal.has(place.id)) continue;
        const lat = place.location?.latitude;
        const lng = place.location?.longitude;
        if (lat != null && lng != null) {
          const distance = haversineMeters(
            { lat: neighborhood.lat, lng: neighborhood.lng },
            { lat, lng },
          );
          if (distance > neighborhood.radiusM) continue;
        }
        seenGlobal.add(place.id);
        ids.push(place.id);
      }
      pageToken = data.nextPageToken;
      process.stdout.write(
        `\r  search ${neighborhood.slug} · ${type} p${pages} · unique so far ${ids.length}   `,
      );
    } while (pageToken && pages < 3);
  }
  process.stdout.write("\n");
  return ids;
}

async function getDetails(placeId: string): Promise<PlaceDetails> {
  await sleep(RATE_LIMIT_MS);
  const res = await placesFetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": detailsFieldMask(),
    },
  });
  totals.details += 1;
  if (!res.ok) {
    const text = await res.text();
    const unsupported = detailsOptionalFields.filter((field) => text.includes(field));
    if (res.status === 400 && unsupported.length > 0) {
      detailsOptionalFields = detailsOptionalFields.filter((field) => !unsupported.includes(field));
      console.warn(`  Dropping unsupported Place Details fields: ${unsupported.join(", ")}`);
      totals.details -= 1;
      return getDetails(placeId);
    }
    throw new Error(`Place Details failed (${res.status}) for ${placeId}: ${text}`);
  }
  return (await res.json()) as PlaceDetails;
}

function mapPriceLevel(value: string | number | undefined): number | null {
  if (typeof value === "number" && value >= 0 && value <= 4) {
    return value === 0 ? 1 : value;
  }
  switch (value) {
    case "PRICE_LEVEL_FREE":
    case "PRICE_LEVEL_INEXPENSIVE":
      return 1;
    case "PRICE_LEVEL_MODERATE":
      return 2;
    case "PRICE_LEVEL_EXPENSIVE":
      return 3;
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return 4;
    default:
      return null;
  }
}

function mapAddressComponents(components: AddressComponent[] | undefined): StagedAddressComponent[] {
  const rows: StagedAddressComponent[] = [];
  const seen = new Set<string>();
  for (const component of components ?? []) {
    for (const type of component.types ?? []) {
      if (!type || seen.has(type)) continue;
      seen.add(type);
      rows.push({
        type,
        longName: component.longText ?? null,
        shortName: component.shortText ?? null,
      });
    }
  }
  return rows;
}

function mapPaymentOptions(
  options: PlaceDetails["paymentOptions"],
): Record<string, boolean | null> | null {
  if (!options) return null;
  const entries = Object.entries(options).filter(([, value]) => value != null);
  if (entries.length === 0) return null;
  return Object.fromEntries(entries) as Record<string, boolean | null>;
}

function mapWheelchair(options: PlaceDetails["accessibilityOptions"]): boolean | null {
  if (!options) return null;
  const flags = [
    options.wheelchairAccessibleEntrance,
    options.wheelchairAccessibleParking,
    options.wheelchairAccessibleRestroom,
    options.wheelchairAccessibleSeating,
  ].filter((value): value is boolean => value != null);
  if (flags.length === 0) return null;
  return flags.some(Boolean);
}

function mapReviews(reviews: PlaceReview[] | undefined): StagedReview[] {
  return (reviews ?? []).slice(0, MAX_REVIEWS).map((review) => ({
    rating: review.rating ?? null,
    text: review.text?.text ?? null,
    relativePublishTimeDescription: review.relativePublishTimeDescription ?? null,
    authorName: review.authorAttribution?.displayName ?? null,
    authorUri: review.authorAttribution?.uri ?? null,
    authorPhotoUri: review.authorAttribution?.photoUri ?? null,
  }));
}

async function downloadPhotoBytes(photoName: string): Promise<Buffer> {
  await sleep(RATE_LIMIT_MS);
  const url = `${PLACES_BASE}/${photoName}/media?maxWidthPx=${PHOTO_MAX_WIDTH}&key=${encodeURIComponent(apiKey())}`;
  const res = await placesFetch(url, {});
  totals.photos += 1;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Photo download failed (${res.status}) for ${photoName}: ${text.slice(0, 300)}`);
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("json")) {
    const text = await res.text();
    throw new Error(`Photo endpoint returned JSON for ${photoName}: ${text.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function r2Configured() {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY,
  );
}

function wranglerOauthToken(): string | null {
  const candidates = [
    join(process.env.APPDATA ?? "", "xdg.config/.wrangler/config/default.toml"),
    join(process.env.HOME ?? "", ".config/.wrangler/config/default.toml"),
    join(process.env.HOME ?? "", ".wrangler/config/default.toml"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const token = readFileSync(path, "utf8").match(/oauth_token = "([^"]+)"/)?.[1];
    if (token) return token;
  }
  return process.env.CLOUDFLARE_API_TOKEN?.trim() || null;
}

async function uploadToR2Api(key: string, bytes: Buffer) {
  const token = wranglerOauthToken();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (!token || !accountId) {
    throw new Error("missing Cloudflare account id or Wrangler OAuth token for R2 API");
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "image/jpeg",
    },
    body: bytes,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 API ${res.status}: ${text.slice(0, 200)}`);
  }
}

async function uploadToR2S3(key: string, bytes: Buffer) {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: bytes,
      ContentType: "image/jpeg",
    }),
  );
}

async function uploadToR2Wrangler(localPath: string, key: string) {
  await execFileAsync(
    "npx",
    ["wrangler", "r2", "object", "put", `${R2_BUCKET_NAME}/${key}`, "--file", localPath, "--remote"],
    { cwd: ROOT, windowsHide: true },
  );
}

function writeLocalPhoto(key: string, bytes: Buffer) {
  const dest = join(PHOTO_CACHE_DIR, key);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, bytes);
  return dest;
}

async function storePhoto(placeId: string, index: number, bytes: Buffer): Promise<"r2" | "local"> {
  const key = `places/${placeId}/${index}.jpg`;
  const localPath = writeLocalPhoto(key, bytes);
  const errors: string[] = [];

  if (r2Configured()) {
    try {
      await uploadToR2S3(key, bytes);
      totals.photosR2 += 1;
      return "r2";
    } catch (err) {
      errors.push(`S3: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  try {
    await uploadToR2Api(key, bytes);
    totals.photosR2 += 1;
    return "r2";
  } catch (err) {
    errors.push(`API: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    await uploadToR2Wrangler(localPath, key);
    totals.photosR2 += 1;
    return "r2";
  } catch (err) {
    errors.push(`wrangler: ${err instanceof Error ? err.message : String(err)}`);
  }

  throw new Error(
    `R2 upload failed for ${key} (photos must land in the bucket at import time, not as live Google URLs). ${errors.join(" | ")}`,
  );
}

async function importPhotos(placeId: string, photos: PlacePhoto[] | undefined): Promise<StagedPhoto[]> {
  const staged: StagedPhoto[] = [];
  for (const [index, photo] of (photos ?? []).slice(0, MAX_PHOTOS).entries()) {
    if (!photo.name) continue;
    const attribution = photo.authorAttributions?.[0];
    let stored: StagedPhoto["stored"] = "skipped";
    try {
      const bytes = await downloadPhotoBytes(photo.name);
      stored = await storePhoto(placeId, index, bytes);
    } catch (err) {
      console.warn(
        `  photo ${placeId}[${index}] failed:`,
        err instanceof Error ? err.message : err,
      );
    }
    staged.push({
      r2Key: `places/${placeId}/${index}.jpg`,
      attributionAuthor: attribution?.displayName ?? null,
      attributionUri: attribution?.uri ?? null,
      width: photo.widthPx ?? null,
      height: photo.heightPx ?? null,
      stored,
    });
  }
  return staged;
}

function printEstimate(neighborhoods: AnchorNeighborhood[]) {
  const n = neighborhoods.length;
  const searches = n * PLACE_TYPES.length * EST_PAGES_PER_TYPE;
  const details = n * EST_PLACES_PER_NHOOD;
  const photos = n * EST_PLACES_PER_NHOOD * EST_PHOTOS_PER_PLACE;
  const reviews = details;
  const total = searches + details + photos;
  console.log("");
  console.log("Estimated request total (before starting — this is the only paid run):");
  console.log(`  Neighborhoods:           ${n}`);
  console.log(`  Types per neighborhood:  ${PLACE_TYPES.length}`);
  console.log(`  Text Search (2 pages × type, assumed): ${searches}`);
  console.log(`  Place Details (~${EST_PLACES_PER_NHOOD} unique / neighborhood): ${details}`);
  console.log(`  Photo downloads (~${EST_PHOTOS_PER_PLACE} × place, cap ${MAX_PHOTOS}): ${photos}`);
  console.log(`  Review payloads (bundled in Place Details, up to ${MAX_REVIEWS}/place — no extra HTTP): ${reviews}`);
  console.log(`  Estimated request total: ${total}`);
  console.log("  Actual unique-place + photo counts are logged after each neighborhood's search.");
  console.log("");
}

function writeStaging(
  neighborhood: AnchorNeighborhood,
  places: StagedPlace[],
  skippedClosed: number,
  skippedOutsideRadius: number,
) {
  const staging: StagingFile = {
    neighborhoodSlug: neighborhood.slug,
    neighborhoodName: neighborhood.name,
    importedAt: new Date().toISOString(),
    bounds: {
      lat: neighborhood.lat,
      lng: neighborhood.lng,
      radiusMeters: neighborhood.radiusM,
    },
    skippedClosed,
    skippedOutsideRadius,
    places,
  };
  mkdirSync(STAGING_DIR, { recursive: true });
  const dest = join(STAGING_DIR, `${neighborhood.slug}.json`);
  writeFileSync(dest, JSON.stringify(staging, null, 2));
  return dest;
}

async function importNeighborhood(neighborhood: AnchorNeighborhood, seenGlobal: Set<string>) {
  console.log(`\n=== ${neighborhood.name} (${neighborhood.slug}) ===`);
  const ids = await searchNeighborhood(neighborhood, seenGlobal);
  const photoCap = ids.length * MAX_PHOTOS;
  console.log(
    `  ${ids.length} unique places. Next: ${ids.length} Place Details + up to ${photoCap} photo downloads.`,
  );

  const places: StagedPlace[] = [];
  let skippedClosed = 0;
  let skippedOutsideRadius = 0;
  const fieldPresence = {
    accessibilityOptions: 0,
    paymentOptions: 0,
  };

  const flush = () => writeStaging(neighborhood, places, skippedClosed, skippedOutsideRadius);

  try {
    for (const [i, placeId] of ids.entries()) {
      process.stdout.write(`\r  details+photos ${i + 1}/${ids.length}   `);
      const details = await getDetails(placeId);
      const name = details.displayName?.text?.trim();
      if (!name) {
        console.warn(`\n  skipping ${placeId}: missing displayName`);
        continue;
      }

      const lat = details.location?.latitude ?? null;
      const lng = details.location?.longitude ?? null;
      if (lat != null && lng != null) {
        const distance = haversineMeters(
          { lat: neighborhood.lat, lng: neighborhood.lng },
          { lat, lng },
        );
        if (distance > neighborhood.radiusM) {
          skippedOutsideRadius += 1;
          continue;
        }
      }

      if (details.accessibilityOptions) fieldPresence.accessibilityOptions += 1;
      if (details.paymentOptions && Object.values(details.paymentOptions).some((v) => v != null)) {
        fieldPresence.paymentOptions += 1;
      }

      const operational = details.businessStatus === "OPERATIONAL";
      const photos = operational ? await importPhotos(placeId, details.photos) : [];
      if (!operational) skippedClosed += 1;

      const reviews = mapReviews(details.reviews);
      totals.reviews += reviews.length;
      places.push({
        placeId,
        name,
        formattedAddress: details.formattedAddress ?? null,
        lat,
        lng,
        phone: details.nationalPhoneNumber ?? null,
        internationalPhone: details.internationalPhoneNumber ?? null,
        website: details.websiteUri ?? null,
        googleMapsUri: details.googleMapsUri ?? null,
        rating: details.rating ?? null,
        reviewCount: details.userRatingCount ?? null,
        priceLevel: mapPriceLevel(details.priceLevel),
        primaryType: details.primaryType ?? null,
        types: details.types ?? [],
        businessStatus: details.businessStatus ?? null,
        utcOffsetMinutes: details.utcOffsetMinutes ?? null,
        delivery: details.delivery ?? null,
        takeout: details.takeout ?? null,
        dineIn: details.dineIn ?? null,
        wheelchairAccessible: mapWheelchair(details.accessibilityOptions),
        paymentOptions: mapPaymentOptions(details.paymentOptions),
        addressComponents: mapAddressComponents(details.addressComponents),
        hours: {
          regularOpeningHours: details.regularOpeningHours ?? null,
          currentOpeningHours: details.currentOpeningHours ?? null,
        },
        photos,
        reviews,
      });
      totals.places += 1;
      flush();
    }
  } catch (err) {
    const dest = flush();
    console.warn(
      `\n  stopped early — flushed ${places.length} places to ${dest}. ${err instanceof Error ? err.message.slice(0, 240) : err}`,
    );
    throw err;
  }
  process.stdout.write("\n");

  const dest = flush();
  console.log(
    `  wrote ${dest} (${places.length} places, ${places.reduce((n, p) => n + p.photos.length, 0)} photos, ${places.reduce((n, p) => n + p.reviews.length, 0)} reviews)`,
  );
  console.log(
    `  skipped closed/non-operational: ${skippedClosed}; skipped outside ${neighborhood.radiusM}m circle: ${skippedOutsideRadius}`,
  );
  console.log(
    `  field presence — accessibilityOptions: ${fieldPresence.accessibilityOptions}/${ids.length}, paymentOptions: ${fieldPresence.paymentOptions}/${ids.length}`,
  );
  if (fieldPresence.paymentOptions === 0) {
    console.log("  paymentOptions empty across the board — not stored as D1 columns.");
  }
  if (fieldPresence.accessibilityOptions === 0) {
    console.log("  accessibilityOptions empty across the board — wheelchair_accessible will be NULL.");
  }
  return JSON.parse(readFileSync(dest, "utf8")) as StagingFile;
}

function resolveTargets(opts: Record<string, string>, flags: Set<string>) {
  if (flags.has("all") && opts.only) {
    throw new Error("Pass --only=<slug> or --all, not both.");
  }
  if (flags.has("all")) return ANCHOR_NEIGHBORHOODS;
  if (opts.only) {
    const found = neighborhoodBySlug(opts.only);
    if (!found) {
      const slugs = ANCHOR_NEIGHBORHOODS.map((n) => n.slug).join(", ");
      throw new Error(`Unknown neighborhood '${opts.only}'. Expected one of: ${slugs}`);
    }
    return [found];
  }
  throw new Error(
    "Refusing to start. Pass --only=<neighborhood-slug> (try --only=ybor-city first) or --all.",
  );
}

async function main() {
  loadDotEnv();
  const { flags, opts } = parseCli(process.argv.slice(2));
  const force = flags.has("force");
  const targets = resolveTargets(opts, flags);

  console.log("Tampa Bay Guide — one-time Places import (local only, never deployed).");
  apiKey();
  printEstimate(targets);

  if (!flags.has("go")) {
    console.log("No billed calls yet. Waiting for you to say go.");
    console.log(
      `When ready, reply go or re-run: npx tsx scripts/import-tampa-places.ts ${flags.has("all") ? "--all" : `--only=${targets.map((t) => t.slug).join(",")}`} --go`,
    );
    process.exit(0);
  }

  if (!r2Configured()) {
    console.log(
      "R2 S3 credentials are not set (CLOUDFLARE_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY).",
    );
    console.log(
      `Photos will be saved under .import-cache/ at the intended keys (places/{place_id}/{n}.jpg) and wrangler R2 put will be tried. Enable R2 in the Cloudflare dashboard if uploads fail.`,
    );
    console.log("");
  }

  const seenGlobal = new Set<string>();
  for (const neighborhood of ANCHOR_NEIGHBORHOODS) {
    if (!targets.some((t) => t.slug === neighborhood.slug)) continue;
    const stagingPath = join(STAGING_DIR, `${neighborhood.slug}.json`);
    if (existsSync(stagingPath) && !force) {
      console.log(`Skipping ${neighborhood.slug} — ${stagingPath} already exists (pass --force to redo).`);
      const existing = JSON.parse(readFileSync(stagingPath, "utf8")) as StagingFile;
      for (const place of existing.places) seenGlobal.add(place.placeId);
      continue;
    }
    await importNeighborhood(neighborhood, seenGlobal);
  }

  console.log("\nImport finished.");
  console.log(`  Text Search calls:  ${totals.searches}`);
  console.log(`  Place Details:      ${totals.details}`);
  console.log(`  Photo downloads:    ${totals.photos}`);
  console.log(`  Places staged:      ${totals.places}`);
  console.log(`  Reviews staged:     ${totals.reviews}`);
  console.log(`  Photos → R2:        ${totals.photosR2}`);
  console.log(`  Photos → local:     ${totals.photosLocal}`);
  console.log("\ntagline, description, and status were not written (remain empty/draft).");
  console.log("Review the staging JSON, then load D1 with: npx tsx scripts/load-import-to-d1.ts");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
