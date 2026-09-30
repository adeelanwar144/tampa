import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const STAGING_DIR = resolve(ROOT, "src/data/staging");
export const PHOTO_CACHE_DIR = resolve(ROOT, ".import-cache");
export const D1_DATABASE_NAME = "tampa-bay-guide";
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "tampa-bay-guide-images";

export type AnchorNeighborhood = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
};

/** 14 anchor neighborhoods — coords are approximate centers, radius in meters. */
export const ANCHOR_NEIGHBORHOODS: AnchorNeighborhood[] = [
  { slug: "ybor-city", name: "Ybor City", lat: 27.9606, lng: -82.4378, radiusM: 1400 },
  { slug: "downtown", name: "Downtown", lat: 27.9478, lng: -82.4572, radiusM: 1600 },
  { slug: "channel-district", name: "Channel District", lat: 27.9428, lng: -82.4455, radiusM: 1100 },
  { slug: "hyde-park", name: "Hyde Park", lat: 27.9355, lng: -82.476, radiusM: 1300 },
  { slug: "soho", name: "SoHo", lat: 27.9305, lng: -82.4829, radiusM: 900 },
  { slug: "davis-islands", name: "Davis Islands", lat: 27.9208, lng: -82.4578, radiusM: 1600 },
  { slug: "seminole-heights", name: "Seminole Heights", lat: 27.9935, lng: -82.461, radiusM: 2000 },
  { slug: "tampa-heights", name: "Tampa Heights", lat: 27.9668, lng: -82.4595, radiusM: 1300 },
  { slug: "palma-ceia", name: "Palma Ceia", lat: 27.9215, lng: -82.4935, radiusM: 1600 },
  { slug: "westshore", name: "Westshore", lat: 27.958, lng: -82.5255, radiusM: 2200 },
  { slug: "riverwalk", name: "Riverwalk", lat: 27.9455, lng: -82.4598, radiusM: 1200 },
  { slug: "sulphur-springs", name: "Sulphur Springs", lat: 28.0212, lng: -82.4515, radiusM: 1600 },
  { slug: "temple-terrace", name: "Temple Terrace", lat: 28.0353, lng: -82.3893, radiusM: 2800 },
  { slug: "ballast-point", name: "Ballast Point", lat: 27.889, lng: -82.481, radiusM: 1600 },
];

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
