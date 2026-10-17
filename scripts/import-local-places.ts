/**
 * Import local GMB/OSM place folders into D1 + R2. Does not call Google.
 * Source zip/folder is read-only.
 *
 *   npx tsx scripts/import-local-places.ts --dir=<extracted-folder> --only=slug-a,slug-b
 *   npx tsx scripts/import-local-places.ts --dir=<extracted-folder> --dry-run
 *   npx tsx scripts/import-local-places.ts --dir=<extracted-folder> --remote
 *   npx tsx scripts/import-local-places.ts --dir=<extracted-folder> --remote --skip-photos
 */
import { execFile } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { promisify } from "node:util";
import { ANCHOR_NEIGHBORHOODS } from "../src/data/neighborhoods";
import {
  D1_DATABASE_NAME,
  PHOTO_CACHE_DIR,
  R2_BUCKET_NAME,
  ROOT,
  loadDotEnv,
  parseCli,
  sqlNum,
  sqlString,
} from "./lib";

const execFileAsync = promisify(execFile);
const WRANGLER_BIN =
  process.platform === "win32"
    ? join(ROOT, "node_modules", ".bin", "wrangler.cmd")
    : join(ROOT, "node_modules", ".bin", "wrangler");

const SOURCE_ROOT = "C:\\Users\\adeel\\Downloads\\Tampa Shop";
const DEFAULT_EXTRACT_DIR = SOURCE_ROOT;
const RADIUS_TOLERANCE_M = 100;
const BLOCK_BEACH_PARK_SLUGS = new Set([
  "hancock-whitney-2",
  "kfb-law-car-accident-and-personal-injury-lawyers",
]);

const SERVICE_CATEGORIES = new Set([
  "gas station",
  "personal injury attorney",
  "bank",
  "credit union",
  "auto insurance agency",
  "law firm",
  "divorce lawyer",
  "social security attorney",
  "criminal justice attorney",
]);
const ATTRACTION_CATEGORIES = new Set(["public library"]);
const HOTEL_CATEGORIES = new Set(["hotel"]);

const ADDR_TYPE: Record<string, string> = {
  "addr:housenumber": "street_number",
  "addr:street": "route",
  "addr:unit": "subpremise",
  "addr:city": "locality",
  "addr:state": "administrative_area_level_1",
  "addr:postcode": "postal_code",
  "addr:country": "country",
};

const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const OSM_DAY: Record<string, number> = {
  Su: 0,
  Mo: 1,
  Tu: 2,
  We: 3,
  Th: 4,
  Fr: 5,
  Sa: 6,
};

type LocalReview = {
  reviewer_display_name?: string;
  rating?: number;
  date?: string;
  text?: string;
};

type LocalPhoto = { file?: string };

type LocalJson = {
  name?: string;
  category?: string;
  address?: string;
  phone?: string | null;
  website?: string | null;
  rating?: number | null;
  review_count?: number | null;
  hours?: Record<string, string> | null;
  opening_hours_osm?: string | null;
  maps_url?: string | null;
  attributes?: Record<string, unknown>;
  coords?: { lat?: number; lon?: number };
  photos?: LocalPhoto[];
  reviews?: LocalReview[];
};

type HoursJson = {
  regularOpeningHours: {
    periods: Array<{
      open: { day: number; hour: number; minute: number };
      close: { day: number; hour: number; minute: number };
    }>;
  };
  closedDays: number[];
};

type SkipReason =
  | "missing_required_field"
  | "unmapped_category"
  | "not_in_only_list"
  | "already_imported";

type SummaryRow = {
  slug: string;
  name: string;
  category: string;
  neighborhood: string | null;
  images: number;
  reviews: number;
  status: "imported" | "skipped";
  reason?: SkipReason | string;
};

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
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

function assignNeighborhood(slug: string, lat: number, lng: number): string | null {
  const hits = ANCHOR_NEIGHBORHOODS.filter((n) => {
    const distance = haversineMeters({ lat, lng }, { lat: n.lat, lng: n.lng });
    return distance <= n.radiusM + RADIUS_TOLERANCE_M;
  }).sort((a, b) => {
    const da = haversineMeters({ lat, lng }, { lat: a.lat, lng: a.lng });
    const db = haversineMeters({ lat, lng }, { lat: b.lat, lng: b.lng });
    return da - db;
  });
  const nearest = hits[0]?.slug ?? null;
  if (nearest === "beach-park-macdill" && BLOCK_BEACH_PARK_SLUGS.has(slug)) {
    return null;
  }
  return nearest;
}

function kebabType(category: string) {
  return category
    .toLowerCase()
    .replace(/^shop:/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

type SiteCategory =
  | "food-drink"
  | "bars-nightlife"
  | "beaches-outdoors"
  | "attractions"
  | "shopping"
  | "services"
  | "hotels-lodging";

function siteCategory(category: string): SiteCategory | null {
  const key = category.trim().toLowerCase();
  if (!key) return null;
  if (
    key === "apartment complex" ||
    key === "apartment rental agency" ||
    key === "manufacturer" ||
    key === "post office"
  ) {
    return null;
  }
  if (HOTEL_CATEGORIES.has(key) || /\b(hotel|lodging|resort)\b/.test(key)) return "hotels-lodging";
  if (
    ATTRACTION_CATEGORIES.has(key) ||
    /\b(museum|art gallery|movie theater|video arcade|bowling alley|pottery classes)\b/.test(key)
  ) {
    return "attractions";
  }
  if (
    key === "bar" ||
    key === "brewery" ||
    /\b(cocktail bar|wine bar|lounge bar|gay bar|night club|irish pub)\b/.test(key)
  ) {
    return "bars-nightlife";
  }
  if (
    key === "fast_food" ||
    key === "ice_cream" ||
    key === "cafe" ||
    /\b(restaurant|cafe|coffee|bakery|ice cream|pizza|donut|dessert|juice|poke|bagel|yogurt|diner|gastropub|steak|ramen|shawarma|sandwich shop|bar & grill|bar and grill)\b/.test(
      key,
    )
  ) {
    return "food-drink";
  }
  if (
    SERVICE_CATEGORIES.has(key) ||
    key === "shop:car_repair" ||
    key === "shop:tyres" ||
    key === "shop:shoe_repair" ||
    key === "shop:laundry" ||
    key === "shop:hairdresser" ||
    key === "shop:beauty" ||
    /\b(gas station|attorney|lawyer|law firm|bank|credit union|insurance|repair|mechanic|oil change|tire shop|towing|plumber|electrician|hvac|salon|barber|clinic|hospital|dentist|doctor|veterinar|groomer|gym|spa|fitness|yoga|pilates|chiropract|therapist|urgent care|storage|real estate|contractor|car dealer|auto body|auto glass|auto auction|truck dealer|wheel store|shipping|mailing|print shop|piercing|tattoo|waxing|personal trainer|addiction|medical|surgeon|orthodont|pediatric|optometr|optician|audiolog|car wash|nail salon|hair salon|beauty|wellness|acupuncture|mental health|physical therapist|home health|shooting range|tennis club|climbing gym|emergency room)\b/.test(
      key,
    )
  ) {
    return "services";
  }
  if (
    key.startsWith("shop:") ||
    /\b(store|shop|boutique|mall|supermarket|pharmacy|florist|nursery|liquor|tobacco|cannabis|thrift|tailor|uniform)\b/.test(
      key,
    )
  ) {
    return "shopping";
  }
  return "services";
}

function primaryTypeFor(category: string, mapped: SiteCategory) {
  const kebab = kebabType(category);
  if (mapped === "food-drink") {
    if (kebab.endsWith("restaurant") || kebab === "cafe" || kebab.endsWith("shop") || kebab === "bar_and_grill") {
      return kebab === "cafe" ? "cafe" : kebab;
    }
    if (kebab.includes("coffee")) return "coffee_shop";
    if (kebab.includes("ice_cream") || kebab.includes("yogurt")) return "ice_cream_shop";
    if (kebab.includes("pizza")) return "pizza_restaurant";
    return "restaurant";
  }
  if (mapped === "bars-nightlife") {
    if (kebab.includes("wine")) return "wine_bar";
    if (kebab.includes("cocktail")) return "cocktail_bar";
    if (kebab.includes("night")) return "night_club";
    if (kebab.includes("pub")) return "pub";
    return "bar";
  }
  if (mapped === "shopping") {
    if (kebab.endsWith("store") || kebab === "supermarket" || kebab === "shopping_mall") return kebab;
    if (kebab.includes("grocery") || kebab.includes("supermarket")) return "grocery_store";
    if (kebab.includes("convenience")) return "convenience_store";
    if (kebab.includes("cloth")) return "clothing_store";
    if (kebab.includes("book")) return "book_store";
    if (kebab.includes("gift")) return "gift_shop";
    if (kebab.includes("shoe")) return "shoe_store";
    return `${kebab}_store`;
  }
  if (mapped === "hotels-lodging") return kebab.includes("hotel") ? kebab : "hotel";
  if (mapped === "attractions") {
    if (kebab.includes("library")) return "public_library";
    if (kebab.includes("museum")) return "museum";
    if (kebab.includes("theater") || kebab.includes("theatre")) return "movie_theater";
    if (kebab.includes("gallery")) return "art_gallery";
    return "tourist_attraction";
  }
  return kebab || "point_of_interest";
}

function parseClock(raw: string): { hour: number; minute: number } | null {
  const cleaned = raw.replace(/\u202f|\u00a0/g, " ").trim();
  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const period = match[3].toUpperCase();
  if (period === "AM") {
    if (hour === 12) hour = 0;
  } else if (hour !== 12) {
    hour += 12;
  }
  return { hour, minute };
}

function googleHoursToJson(hours: Record<string, string>): HoursJson {
  const periods: HoursJson["regularOpeningHours"]["periods"] = [];
  const closedDays: number[] = [];
  for (const [name, value] of Object.entries(hours)) {
    const day = DAY_NAME_TO_INDEX[name.trim().toLowerCase()];
    if (day === undefined) continue;
    const text = value.replace(/\u202f|\u00a0/g, " ").trim();
    if (/^closed$/i.test(text)) {
      closedDays.push(day);
      continue;
    }
    const parts = text.split(/\s*[–—-]\s*/);
    if (parts.length !== 2) continue;
    const open = parseClock(parts[0]);
    const close = parseClock(parts[1]);
    if (!open || !close) continue;
    let closeDay = day;
    if (close.hour * 60 + close.minute <= open.hour * 60 + open.minute) {
      closeDay = (day + 1) % 7;
    }
    periods.push({
      open: { day, hour: open.hour, minute: open.minute },
      close: { day: closeDay, hour: close.hour, minute: close.minute },
    });
  }
  return { regularOpeningHours: { periods }, closedDays };
}

function expandOsmDays(token: string): number[] {
  if (token.includes("-")) {
    const [start, end] = token.split("-") as [string, string];
    const a = OSM_DAY[start];
    const b = OSM_DAY[end];
    if (a === undefined || b === undefined) return [];
    const days: number[] = [];
    for (let d = a; ; d = (d + 1) % 7) {
      days.push(d);
      if (d === b) break;
    }
    return days;
  }
  const one = OSM_DAY[token];
  return one === undefined ? [] : [one];
}

function parseOsmRange(range: string): { hour: number; minute: number }[] | null {
  const match = range.trim().match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
  if (!match) return null;
  return [
    { hour: Number(match[1]), minute: Number(match[2]) },
    { hour: Number(match[3]), minute: Number(match[4]) },
  ];
}

function osmHoursToJson(raw: string): HoursJson {
  const periods: HoursJson["regularOpeningHours"]["periods"] = [];
  const closedDays: number[] = [];
  const text = raw.trim();
  if (text === "24/7") {
    for (let day = 0; day < 7; day += 1) {
      periods.push({
        open: { day, hour: 0, minute: 0 },
        close: { day, hour: 23, minute: 59 },
      });
    }
    return { regularOpeningHours: { periods }, closedDays };
  }

  const chunks = text.split(";").map((part) => part.trim()).filter(Boolean);
  if (chunks.length === 0 && text.includes(",")) {
    chunks.push(...text.split(",").map((part) => part.trim()));
  }
  const expanded: string[] = [];
  for (const chunk of chunks) {
    if (chunk.includes(",") && !chunk.includes(";")) {
      expanded.push(...chunk.split(",").map((part) => part.trim()));
    } else {
      expanded.push(chunk);
    }
  }

  for (const chunk of expanded) {
    const off = chunk.match(/^([A-Za-z]{2}(?:-[A-Za-z]{2})?)\s+off$/i);
    if (off) {
      closedDays.push(...expandOsmDays(off[1]));
      continue;
    }
    const timed = chunk.match(/^([A-Za-z]{2}(?:-[A-Za-z]{2})?)\s+(\d{2}:\d{2}-\d{2}:\d{2})$/);
    if (timed) {
      const range = parseOsmRange(timed[2]);
      if (!range) continue;
      for (const day of expandOsmDays(timed[1])) {
        let closeDay = day;
        if (range[1].hour * 60 + range[1].minute <= range[0].hour * 60 + range[0].minute) {
          closeDay = (day + 1) % 7;
        }
        periods.push({
          open: { day, hour: range[0].hour, minute: range[0].minute },
          close: { day: closeDay, hour: range[1].hour, minute: range[1].minute },
        });
      }
      continue;
    }
    const everyday = parseOsmRange(chunk);
    if (everyday) {
      for (let day = 0; day < 7; day += 1) {
        let closeDay = day;
        if (everyday[1].hour * 60 + everyday[1].minute <= everyday[0].hour * 60 + everyday[0].minute) {
          closeDay = (day + 1) % 7;
        }
        periods.push({
          open: { day, hour: everyday[0].hour, minute: everyday[0].minute },
          close: { day: closeDay, hour: everyday[1].hour, minute: everyday[1].minute },
        });
      }
    }
  }
  return { regularOpeningHours: { periods }, closedDays };
}

function hoursJsonFor(data: LocalJson): HoursJson | null {
  if (data.hours && Object.keys(data.hours).length > 0) {
    return googleHoursToJson(data.hours);
  }
  if (data.opening_hours_osm?.trim()) {
    return osmHoursToJson(data.opening_hours_osm);
  }
  return null;
}

function wranglerOauthToken(): string | null {
  const candidates = [
    join(process.env.APPDATA ?? "", "xdg.config/.wrangler/config/default.toml"),
    join(process.env.HOME ?? "", ".config/.wrangler/config/default.toml"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const token = readFileSync(path, "utf8").match(/oauth_token = "([^"]+)"/)?.[1];
    if (token) return token;
  }
  return process.env.CLOUDFLARE_API_TOKEN?.trim() || null;
}

async function uploadRemoteR2(key: string, bytes: Buffer, contentType: string) {
  const token = wranglerOauthToken();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (!token || !accountId) {
    throw new Error("missing Cloudflare account id or Wrangler OAuth token for R2");
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: bytes,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 API ${res.status}: ${text.slice(0, 200)}`);
  }
}

function copyLocalPhoto(localPath: string, key: string) {
  const dest = join(PHOTO_CACHE_DIR, key);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(localPath, dest);
}

async function uploadWranglerR2(localPath: string, key: string, remote: boolean) {
  if (!remote) {
    copyLocalPhoto(localPath, key);
    return;
  }
  const wranglerJs = join(ROOT, "node_modules", "wrangler", "bin", "wrangler.js");
  await execFileAsync(
    process.execPath,
    [wranglerJs, "r2", "object", "put", `${R2_BUCKET_NAME}/${key}`, "--file", localPath, "--remote"],
    { cwd: ROOT, windowsHide: true },
  );
}

type DiscoveredPlace = { slug: string; dir: string; jsonPath: string; score: number };

function placeScore(dir: string, data: LocalJson) {
  const photoDir = join(dir, "photos");
  const onDisk = existsSync(photoDir)
    ? readdirSync(photoDir).filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file)).length
    : 0;
  const listed = Array.isArray(data.photos) ? data.photos.length : 0;
  const reviews = Array.isArray(data.reviews) ? data.reviews.length : 0;
  return Math.max(onDisk, listed) * 10 + reviews;
}

function discoverPlaces(root: string): DiscoveredPlace[] {
  const bySlug = new Map<string, DiscoveredPlace>();
  const walk = (dir: string) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    const jsonPath = join(dir, "data.json");
    if (existsSync(jsonPath)) {
      const slug = dir.split(/[/\\]/).pop() ?? dir;
      try {
        const data = JSON.parse(readFileSync(jsonPath, "utf8")) as LocalJson;
        const score = placeScore(dir, data);
        const prev = bySlug.get(slug);
        if (!prev || score > prev.score) {
          bySlug.set(slug, { slug, dir, jsonPath, score });
        }
      } catch {
        // skip unreadable json
      }
    }
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== "photos") walk(join(dir, entry.name));
    }
  };
  walk(root);
  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

async function existingSlugs(remote: boolean) {
  const args = [
    "d1",
    "execute",
    D1_DATABASE_NAME,
    "--command",
    "SELECT slug FROM places",
    "--json",
    remote ? "--remote" : "--local",
  ];
  try {
    const { stdout } = await execFileAsync(WRANGLER_BIN, args, {
      cwd: ROOT,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
      shell: true,
    });
    const jsonStart = stdout.indexOf("[");
    const parsed = JSON.parse(jsonStart >= 0 ? stdout.slice(jsonStart) : stdout) as Array<{
      results?: Array<{ slug?: string }>;
    }>;
    return new Set(
      parsed.flatMap((block) => (block.results ?? []).map((row) => row.slug).filter(Boolean) as string[]),
    );
  } catch {
    return new Set<string>();
  }
}

function contentTypeFor(ext: string) {
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let index = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length || 1)) }, async () => {
      while (index < items.length) {
        const current = items[index];
        index += 1;
        await fn(current);
      }
    }),
  );
}

async function executeSql(sql: string, remote: boolean) {
  const outDir = join(ROOT, "db");
  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, "import-local-generated.sql");
  writeFileSync(file, sql, "utf8");
  const args = ["d1", "execute", D1_DATABASE_NAME, "--file", file, "--yes"];
  args.push(remote ? "--remote" : "--local");
  const { stdout, stderr } = await execFileAsync(WRANGLER_BIN, args, {
    cwd: ROOT,
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
    shell: true,
  });
  if (stdout.trim()) console.log(stdout.trim());
  if (stderr.trim()) console.error(stderr.trim());
}

function printSummary(rows: SummaryRow[]) {
  const imported = rows.filter((row) => row.status === "imported");
  const skipped = rows.filter((row) => row.status === "skipped");
  const byCategory: Record<string, number> = {};
  const byNeighborhood: Record<string, number> = {};
  for (const row of imported) {
    byCategory[row.category] = (byCategory[row.category] ?? 0) + 1;
    const hood = row.neighborhood ?? "(none)";
    byNeighborhood[hood] = (byNeighborhood[hood] ?? 0) + 1;
  }
  console.log("\nImport summary");
  console.log(`  imported: ${imported.length}`);
  console.log(`  skipped:  ${skipped.length}`);
  console.log(`  images:   ${imported.reduce((n, row) => n + row.images, 0)}`);
  console.log(`  reviews:  ${imported.reduce((n, row) => n + row.reviews, 0)}`);
  console.log("  by category:");
  for (const [key, count] of Object.entries(byCategory).sort()) {
    console.log(`    ${key}: ${count}`);
  }
  console.log("  by neighborhood:");
  for (const [key, count] of Object.entries(byNeighborhood).sort()) {
    console.log(`    ${key}: ${count}`);
  }
  if (skipped.length) {
    console.log("  skipped detail:");
    for (const row of skipped) {
      console.log(`    ${row.slug}: ${row.reason}`);
    }
  }
}

type ImportFlags = {
  only: Set<string> | null;
  dryRun: boolean;
  remote: boolean;
  skipPhotos: boolean;
  skipExisting: boolean;
};

async function importPlaces(discovered: DiscoveredPlace[], flags: ImportFlags) {
  const { only, dryRun, remote, skipPhotos, skipExisting } = flags;
  const already = skipExisting ? await existingSlugs(remote) : new Set<string>();
  const statements = ["PRAGMA foreign_keys = ON;"];
  const rows: SummaryRow[] = [];
  const photoJobs: Array<{ localPath: string; key: string; ext: string }> = [];

  for (const place of discovered) {
    const { slug, dir, jsonPath } = place;
    if (only && !only.has(slug)) {
      rows.push({
        slug,
        name: slug,
        category: "",
        neighborhood: null,
        images: 0,
        reviews: 0,
        status: "skipped",
        reason: "not_in_only_list",
      });
      continue;
    }
    if (already.has(slug)) {
      rows.push({
        slug,
        name: slug,
        category: "",
        neighborhood: null,
        images: 0,
        reviews: 0,
        status: "skipped",
        reason: "already_imported",
      });
      continue;
    }

    const data = JSON.parse(readFileSync(jsonPath, "utf8")) as LocalJson;
    const name = data.name?.trim();
    const categoryLabel = data.category?.trim() ?? "";
    const mapped = siteCategory(categoryLabel);
    const lat = data.coords?.lat;
    const lng = data.coords?.lon;
    if (!name || lat == null || lng == null) {
      rows.push({
        slug,
        name: name ?? slug,
        category: categoryLabel,
        neighborhood: null,
        images: 0,
        reviews: 0,
        status: "skipped",
        reason: "missing_required_field",
      });
      continue;
    }
    if (!mapped) {
      rows.push({
        slug,
        name,
        category: categoryLabel,
        neighborhood: null,
        images: 0,
        reviews: 0,
        status: "skipped",
        reason: "unmapped_category",
      });
      continue;
    }

    const googlePlaceId =
      typeof data.attributes?.google_place_id === "string"
        ? data.attributes.google_place_id
        : null;
    const placeId = googlePlaceId || `local:${slug}`;
    const neighborhood = assignNeighborhood(slug, lat, lng);
    const hours = hoursJsonFor(data);
    const primaryType = primaryTypeFor(categoryLabel, mapped);
    const reviews = (data.reviews ?? []).slice(0, 5);
    const photoDir = join(dir, "photos");
    const listedPhotos = (data.photos ?? [])
      .map((photo) => photo.file)
      .filter((file): file is string => Boolean(file));
    const diskPhotos = existsSync(photoDir)
      ? readdirSync(photoDir)
          .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
          .sort()
      : [];
    const photoFiles = (listedPhotos.length ? listedPhotos : diskPhotos).slice(0, 5);
    const uploaded: Array<{ key: string; index: number }> = [];

    for (const [index, file] of photoFiles.entries()) {
      const localPath = join(photoDir, file);
      if (!existsSync(localPath)) continue;
      const ext = extname(file).toLowerCase() || ".jpg";
      const key = `places/${slug}/${index}${ext === ".jpeg" ? ".jpg" : ext}`;
      if (!dryRun && !skipPhotos) {
        photoJobs.push({ localPath, key, ext });
      }
      uploaded.push({ key, index });
    }

    statements.push(
      `DELETE FROM place_address_components WHERE place_id = ${sqlString(placeId)};`,
      `DELETE FROM place_reviews WHERE place_id = ${sqlString(placeId)};`,
      `DELETE FROM place_images WHERE place_id = ${sqlString(placeId)};`,
      `DELETE FROM places WHERE id = ${sqlString(placeId)} OR slug = ${sqlString(slug)};`,
      `INSERT INTO places (
  id, place_id, slug, name, neighborhood_slug, micro_area, formatted_address,
  lat, lng, phone, website, google_maps_uri, rating, review_count, price_level,
  primary_type, business_status, hours_json, utc_offset_minutes, delivery, takeout,
  dine_in, wheelchair_accessible, tagline, description, status, imported_at
) VALUES (
  ${sqlString(placeId)},
  ${sqlString(placeId)},
  ${sqlString(slug)},
  ${sqlString(name)},
  ${sqlString(neighborhood)},
  NULL,
  ${sqlString(data.address ?? null)},
  ${sqlNum(lat)},
  ${sqlNum(lng)},
  ${sqlString(data.phone ?? null)},
  ${sqlString(data.website ?? null)},
  ${sqlString(data.maps_url ?? null)},
  ${sqlNum(data.rating ?? null)},
  ${sqlNum(data.review_count ?? null)},
  NULL,
  ${sqlString(primaryType)},
  NULL,
  ${sqlString(hours ? JSON.stringify(hours) : null)},
  NULL, NULL, NULL, NULL, NULL,
  NULL,
  NULL,
  'draft',
  ${sqlString(new Date().toISOString())}
);`,
    );

    for (const [key, type] of Object.entries(ADDR_TYPE)) {
      const value = data.attributes?.[key];
      if (typeof value !== "string" || !value.trim()) continue;
      statements.push(`INSERT OR REPLACE INTO place_address_components (
  place_id, type, long_name, short_name
) VALUES (
  ${sqlString(placeId)},
  ${sqlString(type)},
  ${sqlString(value)},
  ${sqlString(value)}
);`);
    }

    uploaded.forEach((photo) => {
      statements.push(`INSERT INTO place_images (
  id, place_id, r2_key, attribution_author, attribution_uri, is_primary, sort_order
) VALUES (
  ${sqlString(`${placeId}-img-${photo.index}`)},
  ${sqlString(placeId)},
  ${sqlString(photo.key)},
  NULL,
  NULL,
  ${photo.index === 0 ? 1 : 0},
  ${photo.index}
);`);
    });

    reviews.forEach((review, index) => {
      statements.push(`INSERT INTO place_reviews (
  id, place_id, rating, review_text, relative_time, author_name, author_uri, author_photo_uri
) VALUES (
  ${sqlString(`${placeId}-rev-${index}`)},
  ${sqlString(placeId)},
  ${sqlNum(review.rating ?? null)},
  ${sqlString(review.text ?? null)},
  ${sqlString(review.date ?? null)},
  ${sqlString(review.reviewer_display_name ?? null)},
  NULL,
  NULL
);`);
    });

    rows.push({
      slug,
      name,
      category: mapped,
      neighborhood,
      images: uploaded.length,
      reviews: reviews.length,
      status: "imported",
    });
    console.log(
      `  ${dryRun ? "would import" : "imported"} ${slug} → ${mapped}${neighborhood ? ` / ${neighborhood}` : " / (no neighborhood)"} (${uploaded.length} images, ${reviews.length} reviews)`,
    );
  }

  if (dryRun) {
    console.log("Dry run — no D1 writes, no R2 uploads.");
  } else if (rows.some((row) => row.status === "imported")) {
    await executeSql(statements.join("\n"), remote);
    if (photoJobs.length) {
      console.log(`Uploading ${photoJobs.length} photos to ${remote ? "remote + local" : "local"} R2...`);
      await runPool(photoJobs, 6, async (job) => {
        try {
          await uploadWranglerR2(job.localPath, job.key, false);
        } catch (err) {
          console.warn(
            `  local R2 put failed for ${job.key}: ${err instanceof Error ? err.message.split("\n")[0] : err}`,
          );
        }
        if (!remote) return;
        const bytes = readFileSync(job.localPath);
        try {
          await uploadRemoteR2(job.key, bytes, contentTypeFor(job.ext));
        } catch (err) {
          console.warn(
            `  R2 API failed for ${job.key}, using wrangler --remote: ${err instanceof Error ? err.message.split("\n")[0] : err}`,
          );
          await uploadWranglerR2(job.localPath, job.key, true);
        }
      });
    }
  } else {
    console.log("Nothing to write to D1.");
  }
  printSummary(rows.filter((row) => row.reason !== "not_in_only_list"));
  return rows;
}

async function main() {
  loadDotEnv();
  const { flags, opts } = parseCli(process.argv.slice(2));
  const extractDir = opts.dir || DEFAULT_EXTRACT_DIR;
  const only = opts.only
    ? new Set(opts.only.split(",").map((value) => value.trim()).filter(Boolean))
    : null;
  const dryRun = flags.has("dry-run");
  const remote = flags.has("remote");
  const skipPhotos = flags.has("skip-photos");
  const skipExisting = !flags.has("replace-existing");

  if (!existsSync(extractDir)) {
    throw new Error(`Place folder not found at ${extractDir}.`);
  }

  const discovered = discoverPlaces(extractDir);
  console.log(`Found ${discovered.length} unique place folders under ${extractDir}`);
  if (only) console.log(`Only: ${[...only].join(", ")}`);
  if (dryRun) console.log("Mode: dry-run");
  if (remote) console.log("Target: remote D1 + remote R2");
  else console.log("Target: local D1 + local R2");
  if (skipPhotos) console.log("Photos: skipped (keys still recorded)");
  if (skipExisting) console.log("Existing D1 slugs will be left unchanged");
  if (flags.has("photos-only")) {
    let copied = 0;
    let missing = 0;
    for (const place of discovered) {
      if (only && !only.has(place.slug)) continue;
      const data = JSON.parse(readFileSync(place.jsonPath, "utf8")) as LocalJson;
      const photoDir = join(place.dir, "photos");
      const listed = (data.photos ?? [])
        .map((photo) => photo.file)
        .filter((file): file is string => Boolean(file));
      const disk = existsSync(photoDir)
        ? readdirSync(photoDir).filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file)).sort()
        : [];
      const files = (listed.length ? listed : disk).slice(0, 5);
      for (const [index, file] of files.entries()) {
        const localPath = join(photoDir, file);
        if (!existsSync(localPath)) {
          missing += 1;
          continue;
        }
        const ext = extname(file).toLowerCase() || ".jpg";
        copyLocalPhoto(localPath, `places/${place.slug}/${index}${ext === ".jpeg" ? ".jpg" : ext}`);
        copied += 1;
      }
    }
    console.log(`Copied ${copied} photos to .import-cache (${missing} missing source files)`);
    return;
  }
  await importPlaces(discovered, { only, dryRun, remote, skipPhotos, skipExisting });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
