import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ANCHOR_NEIGHBORHOODS as DATA_ANCHORS,
  type AnchorNeighborhood as DataAnchor,
} from "../src/data/neighborhoods";

export const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const STAGING_DIR = resolve(ROOT, "src/data/staging");
export const PHOTO_CACHE_DIR = resolve(ROOT, ".import-cache");
export const D1_DATABASE_NAME = "tampa-bay-guide";
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "tampa-bay-guide-images";

export type AnchorNeighborhood = DataAnchor;
export const ANCHOR_NEIGHBORHOODS: AnchorNeighborhood[] = DATA_ANCHORS;

/** Table A types for Places API (New) Text Search `includedType` (one per request). */
export const PLACE_TYPES = [
  "restaurant",
  "bar",
  "cafe",
  "bakery",
  "coffee_shop",
  "ice_cream_shop",
  "meal_takeaway",
  "night_club",
  "wine_bar",
  "store",
  "shopping_mall",
  "clothing_store",
  "book_store",
  "grocery_store",
  "gift_shop",
  "tourist_attraction",
  "museum",
  "art_gallery",
  "park",
  "movie_theater",
  "performing_arts_theater",
  "historical_landmark",
  "spa",
  "gym",
] as const;

export type StagedPhoto = {
  r2Key: string;
  attributionAuthor: string | null;
  attributionUri: string | null;
  width: number | null;
  height: number | null;
  stored: "r2" | "local" | "skipped";
};

export type StagedReview = {
  rating: number | null;
  text: string | null;
  relativePublishTimeDescription: string | null;
  authorName: string | null;
  authorUri: string | null;
  authorPhotoUri: string | null;
};

export type StagedAddressComponent = {
  type: string;
  longName: string | null;
  shortName: string | null;
};

export type StagedPlace = {
  placeId: string;
  name: string;
  formattedAddress: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  internationalPhone: string | null;
  website: string | null;
  googleMapsUri: string | null;
  rating: number | null;
  reviewCount: number | null;
  priceLevel: number | null;
  primaryType: string | null;
  types: string[];
  businessStatus: string | null;
  utcOffsetMinutes: number | null;
  delivery: boolean | null;
  takeout: boolean | null;
  dineIn: boolean | null;
  wheelchairAccessible: boolean | null;
  paymentOptions: Record<string, boolean | null> | null;
  addressComponents: StagedAddressComponent[];
  hours: {
    regularOpeningHours: unknown;
    currentOpeningHours: unknown;
  };
  photos: StagedPhoto[];
  reviews: StagedReview[];
};

export type StagingFile = {
  neighborhoodSlug: string;
  neighborhoodName: string;
  importedAt: string;
  bounds: { lat: number; lng: number; radiusMeters: number };
  skippedClosed: number;
  skippedOutsideRadius: number;
  places: StagedPlace[];
};

export function loadDotEnv() {
  const path = resolve(ROOT, ".env");
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function kebabCase(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "place";
}

export function uniqueSlug(name: string, used: Set<string>) {
  const base = kebabCase(name);
  let slug = base;
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  used.add(slug);
  return slug;
}

export function sqlString(value: string | null | undefined): string {
  if (value == null) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

export function sqlNum(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "NULL";
  return String(value);
}

export function sqlBool(value: boolean | null | undefined): string {
  if (value == null) return "NULL";
  return value ? "1" : "0";
}

export function parseCli(argv: string[]) {
  const flags = new Set<string>();
  const opts: Record<string, string> = {};
  for (const arg of argv) {
    if (arg.startsWith("--") && arg.includes("=")) {
      const [k, ...rest] = arg.slice(2).split("=");
      opts[k] = rest.join("=");
    } else if (arg.startsWith("--")) {
      flags.add(arg.slice(2));
    }
  }
  return { flags, opts };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function neighborhoodBySlug(slug: string) {
  return ANCHOR_NEIGHBORHOODS.find((n) => n.slug === slug);
}
