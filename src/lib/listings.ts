import { places as seedPlaces } from "@/data/places";
import { guides as allGuides } from "@/data/guides";
import {
  ANCHOR_NEIGHBORHOODS,
  NEIGHBORHOODS as NEIGHBORHOOD_NAMES,
  neighborhoodSlug as slugifyNeighborhood,
} from "@/data/neighborhoods";
import { getDb } from "@/lib/d1";
import { cachedListingData } from "@/lib/listing-cache";
import {
  Place,
  PlaceReview,
  Guide,
  CategorySlug,
  FilterParams,
  Hours,
  SortOption,
} from "@/types";

// ── Constants ───────────────────────────────────────────────────────
export const PLACES_PER_PAGE = 12;
export const TZ = "America/New_York";
const LIST_CACHE_TTL = 300;

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  "food-drink": "Food & drink",
  "bars-nightlife": "Bars & nightlife",
  "beaches-outdoors": "Beaches & outdoors",
  attractions: "Attractions",
  shopping: "Shopping",
  services: "Services",
  "hotels-lodging": "Hotels & lodging",
};

export const NEIGHBORHOODS = NEIGHBORHOOD_NAMES;

const NEIGHBORHOOD_BY_SLUG = Object.fromEntries(
  ANCHOR_NEIGHBORHOODS.map((n) => [n.slug, n.name]),
) as Record<string, string>;

type PlaceRow = {
  id: string;
  slug: string;
  name: string;
  neighborhood_slug: string | null;
  formatted_address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  google_maps_uri: string | null;
  rating: number | null;
  review_count: number | null;
  price_level: number | null;
  primary_type: string | null;
  business_status: string | null;
  hours_json: string | null;
  utc_offset_minutes: number | null;
  delivery: number | null;
  takeout: number | null;
  dine_in: number | null;
  wheelchair_accessible: number | null;
  tagline: string | null;
  description: string | null;
  status: string | null;
  listing_quarantined?: number | null;
  imported_at: string | null;
  first_image?: string | null;
  photo_count?: number | null;
};

type ImageRow = {
  place_id: string;
  r2_key: string;
  sort_order: number | null;
};

type ReviewRow = {
  place_id: string;
  rating: number | null;
  review_text: string | null;
  relative_time: string | null;
  author_name: string | null;
  author_uri: string | null;
};

const FOOD_TYPES = new Set([
  "restaurant",
  "cafe",
  "bakery",
  "coffee_shop",
  "meal_takeaway",
  "meal_delivery",
  "ice_cream_shop",
  "sandwich_shop",
  "pizza_restaurant",
  "seafood_restaurant",
  "mexican_restaurant",
  "american_restaurant",
  "breakfast_restaurant",
  "brunch_restaurant",
  "hamburger_restaurant",
  "fine_dining_restaurant",
  "fast_food_restaurant",
  "bar_and_grill",
  "steak_house",
  "sushi_restaurant",
]);

const BAR_TYPES = new Set(["bar", "night_club", "wine_bar", "pub", "cocktail_bar"]);
const OUTDOOR_TYPES = new Set([
  "park",
  "beach",
  "hiking_area",
  "marina",
  "campground",
  "dog_park",
  "playground",
]);
const ATTRACTION_TYPES = new Set([
  "tourist_attraction",
  "museum",
  "art_gallery",
  "amusement_park",
  "aquarium",
  "zoo",
  "movie_theater",
  "performing_arts_theater",
  "stadium",
  "historical_landmark",
  "visitor_center",
]);
const SHOP_TYPES = new Set([
  "store",
  "shopping_mall",
  "clothing_store",
  "book_store",
  "grocery_store",
  "gift_shop",
  "shoe_store",
  "convenience_store",
  "department_store",
  "jewelry_store",
  "supermarket",
]);

function sqlStringList(values: Iterable<string>): string {
  return [...values].map((value) => `'${value.replace(/'/g, "''")}'`).join(", ");
}

function categoryFromType(primaryType: string | null): CategorySlug {
  if (!primaryType) return "services";
  if (primaryType === "hotel" || primaryType === "hotels-lodging" || primaryType.endsWith("_hotel")) {
    return "hotels-lodging";
  }
  if (FOOD_TYPES.has(primaryType) || primaryType.endsWith("_restaurant")) return "food-drink";
  if (BAR_TYPES.has(primaryType)) return "bars-nightlife";
  if (OUTDOOR_TYPES.has(primaryType)) return "beaches-outdoors";
  if (ATTRACTION_TYPES.has(primaryType) || primaryType === "public_library") return "attractions";
  if (SHOP_TYPES.has(primaryType) || primaryType.endsWith("_store")) return "shopping";
  return "services";
}

function categoryWhereSql(category: CategorySlug): string {
  const food = `(primary_type IN (${sqlStringList(FOOD_TYPES)}) OR primary_type LIKE '%_restaurant')`;
  const bars = `primary_type IN (${sqlStringList(BAR_TYPES)})`;
  const outdoors = `primary_type IN (${sqlStringList(OUTDOOR_TYPES)})`;
  const attractions = `(primary_type IN (${sqlStringList(ATTRACTION_TYPES)}) OR primary_type = 'public_library')`;
  const shopping = `(primary_type IN (${sqlStringList(SHOP_TYPES)}) OR primary_type LIKE '%_store')`;
  const hotels = `(primary_type = 'hotel' OR primary_type = 'hotels-lodging' OR primary_type LIKE '%_hotel')`;
  switch (category) {
    case "food-drink":
      return food;
    case "bars-nightlife":
      return bars;
    case "beaches-outdoors":
      return outdoors;
    case "attractions":
      return attractions;
    case "shopping":
      return shopping;
    case "hotels-lodging":
      return hotels;
    case "services":
      return `NOT (${food} OR ${bars} OR ${outdoors} OR ${attractions} OR ${shopping} OR ${hotels})`;
    default:
      return "1=1";
  }
}

function humanizeType(primaryType: string | null) {
  if (!primaryType) return "Place";
  return primaryType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function padTime(value: number | undefined) {
  return String(value ?? 0).padStart(2, "0");
}

function hoursFromJson(raw: string | null): Hours {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as {
      regularOpeningHours?: {
        periods?: Array<{
          open?: { day?: number; hour?: number; minute?: number };
          close?: { day?: number; hour?: number; minute?: number };
        }>;
      };
      periods?: Array<{
        open?: { day?: number; hour?: number; minute?: number };
        close?: { day?: number; hour?: number; minute?: number };
      }>;
      closedDays?: number[];
    };
    const periods = parsed.regularOpeningHours?.periods ?? parsed.periods ?? [];
    const hours: Hours = {};
    for (const period of periods) {
      const day = period.open?.day;
      if (day === undefined || hours[day]) continue;
      if (!period.close) {
        hours[day] = { open: "00:00", close: "23:59" };
        continue;
      }
      hours[day] = {
        open: `${padTime(period.open?.hour)}:${padTime(period.open?.minute)}`,
        close: `${padTime(period.close.hour)}:${padTime(period.close.minute)}`,
      };
    }
    for (const day of parsed.closedDays ?? []) {
      if (hours[day] === undefined) hours[day] = null;
    }
    return hours;
  } catch {
    return {};
  }
}

function clampPrice(value: number | null): 1 | 2 | 3 | 4 | null {
  if (value === 1 || value === 2 || value === 3 || value === 4) return value;
  return null;
}

function flagFromInt(value: number | null | undefined): boolean | undefined {
  if (value == null) return undefined;
  return value === 1;
}

function reviewsFromRows(placeId: string, rows: ReviewRow[]): PlaceReview[] {
  return rows
    .filter((row) => row.place_id === placeId)
    .slice(0, 5)
    .map((row) => ({
      rating: row.rating,
      text: row.review_text,
      relativeTime: row.relative_time,
      authorName: row.author_name,
      authorUri: row.author_uri,
    }));
}

const PLACE_COLUMNS = `
  id, slug, name, neighborhood_slug, formatted_address, lat, lng, phone, website,
  google_maps_uri, rating, review_count, price_level, primary_type, business_status,
  hours_json, utc_offset_minutes, delivery, takeout, dine_in, wheelchair_accessible,
  tagline, description, status, imported_at
`.replace(/\s+/g, " ").trim();

const CARD_SELECT = `
  SELECT ${PLACE_COLUMNS},
    (
      SELECT i.r2_key FROM place_images i
      WHERE i.place_id = places.id AND i.r2_key NOT LIKE 'wm/%'
      ORDER BY i.sort_order ASC
      LIMIT 1
    ) AS first_image,
    (
      SELECT COUNT(*) FROM place_images i
      WHERE i.place_id = places.id AND i.r2_key NOT LIKE 'wm/%'
    ) AS photo_count
  FROM places
`.replace(/\s+/g, " ").trim();

const PUBLISHED_SQL = `status = 'published' AND COALESCE(listing_quarantined, 0) = 0`;

function placeFromRow(row: PlaceRow, images: ImageRow[], reviews: ReviewRow[]): Place {
  const photoKeys = images
    .filter((img) => img.place_id === row.id && !img.r2_key.startsWith("wm/"))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img) => `/api/photos/${img.r2_key}`);
  const imported = row.imported_at ?? new Date().toISOString();
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    category: categoryFromType(row.primary_type),
    subcategory: humanizeType(row.primary_type),
    neighborhood: row.neighborhood_slug
      ? (NEIGHBORHOOD_BY_SLUG[row.neighborhood_slug] ?? row.neighborhood_slug)
      : "",
    neighborhoodSlug: row.neighborhood_slug ?? null,
    businessStatus: row.business_status,
    status: row.status === "draft" ? "draft" : "published",
    address: row.formatted_address ?? "",
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    googleMapsUri: row.google_maps_uri ?? undefined,
    priceLevel: clampPrice(row.price_level),
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    photoCount: photoKeys.length,
    images: photoKeys,
    hours: hoursFromJson(row.hours_json),
    utcOffsetMinutes: row.utc_offset_minutes,
    delivery: flagFromInt(row.delivery),
    takeout: flagFromInt(row.takeout),
    dineIn: flagFromInt(row.dine_in),
    wheelchairAccessible: flagFromInt(row.wheelchair_accessible),
    reviews: reviewsFromRows(row.id, reviews),
    tags: [],
    featured: false,
    createdAt: imported,
    updatedAt: imported,
  };
}

function placeFromCardRow(row: PlaceRow): Place {
  const image =
    row.first_image && !row.first_image.startsWith("wm/")
      ? [`/api/photos/${row.first_image}`]
      : [];
  const imported = row.imported_at ?? new Date().toISOString();
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    category: categoryFromType(row.primary_type),
    subcategory: humanizeType(row.primary_type),
    neighborhood: row.neighborhood_slug
      ? (NEIGHBORHOOD_BY_SLUG[row.neighborhood_slug] ?? row.neighborhood_slug)
      : "",
    neighborhoodSlug: row.neighborhood_slug ?? null,
    businessStatus: row.business_status,
    status: row.status === "draft" ? "draft" : "published",
    address: row.formatted_address ?? "",
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    googleMapsUri: row.google_maps_uri ?? undefined,
    priceLevel: clampPrice(row.price_level),
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    photoCount: Number(row.photo_count ?? image.length),
    images: image,
    hours: hoursFromJson(row.hours_json),
    utcOffsetMinutes: row.utc_offset_minutes,
    delivery: flagFromInt(row.delivery),
    takeout: flagFromInt(row.takeout),
    dineIn: flagFromInt(row.dine_in),
    wheelchairAccessible: flagFromInt(row.wheelchair_accessible),
    reviews: [],
    tags: [],
    featured: false,
    createdAt: imported,
    updatedAt: imported,
  };
}

function allowDraftPreview() {
  return process.env.NODE_ENV !== "production";
}

function seedAsPlaces(): Place[] {
  return seedPlaces.map((seed) => ({
    ...seed,
    status: seed.status ?? "published",
    neighborhoodSlug:
      seed.neighborhoodSlug ?? (seed.neighborhood ? slugifyNeighborhood(seed.neighborhood) : null),
  }));
}

type ListQuery = {
  category?: CategorySlug;
  neighborhood?: string;
  q?: string;
  ids?: string[];
};

function buildListWhere(query: ListQuery): { sql: string; params: Array<string | number> } {
  const clauses = [PUBLISHED_SQL];
  const params: Array<string | number> = [];
  if (query.category) clauses.push(categoryWhereSql(query.category));
  if (query.neighborhood) {
    clauses.push("neighborhood_slug = ?");
    params.push(slugifyNeighborhood(query.neighborhood));
  }
  if (query.q) {
    const like = `%${query.q.replace(/[%_]/g, "")}%`;
    clauses.push(
      `(name LIKE ? COLLATE NOCASE OR IFNULL(tagline,'') LIKE ? COLLATE NOCASE OR IFNULL(neighborhood_slug,'') LIKE ? COLLATE NOCASE OR IFNULL(primary_type,'') LIKE ? COLLATE NOCASE)`,
    );
    params.push(like, like, like, like);
  }
  if (query.ids?.length) {
    clauses.push(`id IN (${query.ids.map(() => "?").join(", ")})`);
    params.push(...query.ids);
  }
  return { sql: clauses.join(" AND "), params };
}

function orderBySql(sort: SortOption): string {
  switch (sort) {
    case "most-popular":
      return "(COALESCE(review_count, 0) * COALESCE(rating, 0)) DESC, name COLLATE NOCASE ASC";
    case "most-reviewed":
      return "COALESCE(review_count, 0) DESC, name COLLATE NOCASE ASC";
    case "highest-rated":
      return "COALESCE(rating, 0) DESC, COALESCE(review_count, 0) DESC, name COLLATE NOCASE ASC";
    case "most-photos":
      return "photo_count DESC, name COLLATE NOCASE ASC";
    case "recently-updated":
    case "newest":
      return "IFNULL(imported_at, '') DESC, name COLLATE NOCASE ASC";
    case "name-az":
      return "name COLLATE NOCASE ASC";
    case "best-overall":
    default:
      return `((COALESCE(review_count, 0) * 1.0) / (COALESCE(review_count, 0) + 50.0)) * COALESCE(rating, 0) + (50.0 / (COALESCE(review_count, 0) + 50.0)) * COALESCE((SELECT AVG(rating) FROM places WHERE ${PUBLISHED_SQL}), 0) DESC, name COLLATE NOCASE ASC`;
  }
}

async function queryPlaceCards(
  where: { sql: string; params: Array<string | number> },
  options: { sort?: SortOption; limit?: number; offset?: number } = {},
): Promise<Place[]> {
  const db = await getDb();
  if (!db) return allowDraftPreview() ? seedAsPlaces() : [];
  const sort = options.sort ?? "best-overall";
  let sql = `${CARD_SELECT} WHERE ${where.sql} ORDER BY ${orderBySql(sort)}`;
  const params = [...where.params];
  if (options.limit != null) {
    sql += " LIMIT ?";
    params.push(options.limit);
  }
  if (options.offset != null && options.offset > 0) {
    sql += " OFFSET ?";
    params.push(options.offset);
  }
  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<PlaceRow>();
  const rows = (result.results ?? []) as PlaceRow[];
  if (rows.length === 0 && allowDraftPreview()) return seedAsPlaces();
  return rows.map(placeFromCardRow);
}

async function countPlaceCards(where: { sql: string; params: Array<string | number> }): Promise<number> {
  const db = await getDb();
  if (!db) return allowDraftPreview() ? seedAsPlaces().length : 0;
  const row = await db
    .prepare(`SELECT COUNT(*) AS total FROM places WHERE ${where.sql}`)
    .bind(...where.params)
    .first<{ total: number }>();
  return Number(row?.total ?? 0);
}

// ── Hours / status helpers ──────────────────────────────────────────

function getTampaTimeParts(date: Date = new Date()): {
  dayOfWeek: number;
  hours: number;
  minutes: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hourStr = parts.find((p) => p.type === "hour")?.value ?? "0";
  const minuteStr = parts.find((p) => p.type === "minute")?.value ?? "0";

  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };

  return {
    dayOfWeek: weekdayMap[weekdayStr] ?? 0,
    hours: parseInt(hourStr, 10),
    minutes: parseInt(minuteStr, 10),
  };
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { hours: h, minutes: m };
}

function toMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

export type PlaceStatus =
  | { type: "open"; label: string }
  | { type: "closes-soon"; label: string }
  | { type: "closed"; label: string }
  | { type: "no-hours"; label: string };

export function getPlaceTimeParts(
  place: Pick<Place, "utcOffsetMinutes">,
  date: Date = new Date(),
): {
  dayOfWeek: number;
  hours: number;
  minutes: number;
} {
  if (place.utcOffsetMinutes == null) return getTampaTimeParts(date);
  const shifted = new Date(date.getTime() + place.utcOffsetMinutes * 60_000);
  return {
    dayOfWeek: shifted.getUTCDay(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}

export function getPlaceStatus(place: Place, now: Date = new Date()): PlaceStatus {
  const { hours } = place;
  if (!hours || Object.keys(hours).length === 0) {
    return { type: "no-hours", label: "Call ahead to confirm hours" };
  }

  const { dayOfWeek, hours: curHours, minutes: curMinutes } = getPlaceTimeParts(place, now);
  const todayHours = hours[dayOfWeek];
  const currentMinutes = toMinutes(curHours, curMinutes);

  if (todayHours === undefined) {
    return { type: "no-hours", label: "Call ahead to confirm hours" };
  }

  if (todayHours) {
    const open = parseTime(todayHours.open);
    const close = parseTime(todayHours.close);
    const openMin = toMinutes(open.hours, open.minutes);
    const closeMin = toMinutes(close.hours, close.minutes);

    if (currentMinutes >= openMin && currentMinutes < closeMin) {
      if (closeMin - currentMinutes <= 60) {
        return {
          type: "closes-soon",
          label: `Closes at ${formatTime(todayHours.close)}`,
        };
      }
      return { type: "open", label: "Open now" };
    }

    if (currentMinutes < openMin) {
      return {
        type: "closed",
        label: `Opens at ${formatTime(todayHours.open)}`,
      };
    }
  }

  const tomorrow = (dayOfWeek + 1) % 7;
  const tomorrowHours = hours[tomorrow];
  if (tomorrowHours) {
    return {
      type: "closed",
      label: `Opens tomorrow at ${formatTime(tomorrowHours.open)}`,
    };
  }

  for (let i = 2; i <= 7; i++) {
    const nextDay = (dayOfWeek + i) % 7;
    if (hours[nextDay]) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return {
        type: "closed",
        label: `Opens ${dayNames[nextDay]}`,
      };
    }
  }

  return { type: "closed", label: "Closed today" };
}

export function isOpenNow(place: Place, now: Date = new Date()): boolean {
  const status = getPlaceStatus(place, now);
  return status.type === "open" || status.type === "closes-soon";
}

export function formatTime(time24: string): string {
  const { hours, minutes } = parseTime(time24);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function getTodayHoursLabel(place: Place): string {
  const now = new Date();
  const { dayOfWeek } = getPlaceTimeParts(place, now);
  const todayHours = place.hours[dayOfWeek];
  if (todayHours === undefined) return "Call ahead to confirm hours";
  if (!todayHours) return "Closed today";
  return `${formatTime(todayHours.open)} – ${formatTime(todayHours.close)}`;
}

function bayesianScore(p: Place, meanRating: number): number {
  const v = p.reviewCount;
  const R = p.rating;
  const m = 50;
  return (v / (v + m)) * R + (m / (v + m)) * meanRating;
}

function sortPlaces(places: Place[], sort: SortOption): Place[] {
  const meanRating =
    places.length === 0
      ? 0
      : places.reduce((sum, p) => sum + p.rating, 0) / places.length;
  const sorted = [...places];
  switch (sort) {
    case "most-popular":
      return sorted.sort((a, b) => b.reviewCount * b.rating - a.reviewCount * a.rating);
    case "most-reviewed":
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
    case "highest-rated":
      return sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case "most-photos":
      return sorted.sort((a, b) => b.photoCount - a.photoCount);
    case "recently-updated":
      return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    case "best-overall":
      return sorted.sort((a, b) => bayesianScore(b, meanRating) - bayesianScore(a, meanRating));
    case "name-az":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    default:
      return sorted.sort((a, b) => bayesianScore(b, meanRating) - bayesianScore(a, meanRating));
  }
}

// ── Filter & Paginate ───────────────────────────────────────────────

export interface ListingsResult {
  places: Place[];
  total: number;
  page: number;
  totalPages: number;
  start: number;
  end: number;
}

async function loadFilteredPlaces(params: FilterParams): Promise<ListingsResult> {
  const sort = params.sort ?? "best-overall";
  const page = Math.max(1, params.page ?? 1);
  const where = buildListWhere({
    category: params.category,
    neighborhood: params.neighborhood,
    q: params.q,
  });

  // Open-now needs hours evaluation in JS; load lean candidates then page in SQL by id.
  if (params.open) {
    const candidates = await queryPlaceCards(where, { sort, limit: 2000 });
    const open = candidates.filter((place) => isOpenNow(place));
    const sorted = sortPlaces(open, sort);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / PLACES_PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PLACES_PER_PAGE;
    const pageItems = sorted.slice(start, start + PLACES_PER_PAGE);
    return {
      places: pageItems,
      total,
      page: safePage,
      totalPages,
      start: total === 0 ? 0 : start + 1,
      end: Math.min(start + PLACES_PER_PAGE, total),
    };
  }

  const total = await countPlaceCards(where);
  const totalPages = Math.max(1, Math.ceil(total / PLACES_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * PLACES_PER_PAGE;
  const places = await queryPlaceCards(where, { sort, limit: PLACES_PER_PAGE, offset });
  return {
    places,
    total,
    page: safePage,
    totalPages,
    start: total === 0 ? 0 : offset + 1,
    end: Math.min(offset + PLACES_PER_PAGE, total),
  };
}

function filterCacheKey(params: FilterParams): string {
  return JSON.stringify({
    category: params.category ?? "",
    neighborhood: params.neighborhood ?? "",
    q: params.q ?? "",
    sort: params.sort ?? "best-overall",
    page: params.page ?? 1,
  });
}

export async function getFilteredPlaces(params: FilterParams): Promise<ListingsResult> {
  if (params.open) return loadFilteredPlaces(params);
  const key = filterCacheKey(params);
  return cachedListingData(`places-filtered:${key}`, LIST_CACHE_TTL, () => loadFilteredPlaces(params));
}

export async function getPlaceBySlug(slug: string): Promise<Place | undefined> {
  const db = await getDb();
  if (db) {
    const row = (await db
      .prepare(
        `SELECT ${PLACE_COLUMNS} FROM places WHERE slug = ? AND COALESCE(listing_quarantined, 0) = 0`,
      )
      .bind(slug)
      .first<PlaceRow>()) as PlaceRow | null;
    if (row) {
      if (row.status !== "published" && !allowDraftPreview()) return undefined;
      const [imageResult, reviewResult] = await Promise.all([
        db
          .prepare(
            "SELECT place_id, r2_key, sort_order FROM place_images WHERE place_id = ? AND r2_key NOT LIKE 'wm/%' ORDER BY sort_order ASC",
          )
          .bind(row.id)
          .all<ImageRow>(),
        db
          .prepare(
            "SELECT place_id, rating, review_text, relative_time, author_name, author_uri FROM place_reviews WHERE place_id = ? LIMIT 5",
          )
          .bind(row.id)
          .all<ReviewRow>(),
      ]);
      return placeFromRow(
        row,
        (imageResult.results ?? []) as ImageRow[],
        (reviewResult.results ?? []) as ReviewRow[],
      );
    }
  }
  if (!allowDraftPreview()) return undefined;
  const seed = seedPlaces.find((p) => p.slug === slug);
  if (!seed) return undefined;
  return {
    ...seed,
    status: seed.status ?? "published",
    neighborhoodSlug:
      seed.neighborhoodSlug ?? (seed.neighborhood ? slugifyNeighborhood(seed.neighborhood) : null),
  };
}

/** Other published places with the same name — for title/description disambiguation only. */
export async function getPlaceNamePeers(place: Place): Promise<Place[]> {
  const db = await getDb();
  if (!db) {
    return seedAsPlaces().filter((peer) => peer.slug !== place.slug && peer.name === place.name);
  }
  const result = await db
    .prepare(
      `${CARD_SELECT} WHERE name = ? AND slug != ? AND ${PUBLISHED_SQL} LIMIT 12`,
    )
    .bind(place.name, place.slug)
    .all<PlaceRow>();
  return ((result.results ?? []) as PlaceRow[]).map(placeFromCardRow);
}

export async function getRelatedPlaces(place: Place, count = 3): Promise<Place[]> {
  if (!place.neighborhoodSlug && !place.neighborhood) return [];
  const db = await getDb();
  const neighborhoodSlug =
    place.neighborhoodSlug ?? (place.neighborhood ? slugifyNeighborhood(place.neighborhood) : null);
  if (!neighborhoodSlug) return [];

  if (!db) {
    const pool = seedAsPlaces().filter(
      (peer) => peer.id !== place.id && peer.neighborhoodSlug === neighborhoodSlug,
    );
    return sortPlaces(pool, "best-overall").slice(0, count);
  }

  const result = await db
    .prepare(
      `${CARD_SELECT}
       WHERE neighborhood_slug = ? AND id != ? AND ${PUBLISHED_SQL}
       ORDER BY ${orderBySql("best-overall")}
       LIMIT 6`,
    )
    .bind(neighborhoodSlug, place.id)
    .all<PlaceRow>();
  return ((result.results ?? []) as PlaceRow[]).map(placeFromCardRow).slice(0, count);
}

export async function getFeaturedPlaces(count = 6): Promise<Place[]> {
  const places = await getAllPlaces();
  return sortPlaces(places, "best-overall").slice(0, count);
}

async function loadAllPlaceCards(): Promise<Place[]> {
  return queryPlaceCards({ sql: PUBLISHED_SQL, params: [] }, { sort: "best-overall", limit: 5000 });
}

/** Lean card rows only (first image, no reviews). Cached 300s. */
export async function getAllPlaces(): Promise<Place[]> {
  return cachedListingData("all-place-cards", LIST_CACHE_TTL, loadAllPlaceCards);
}

export async function getPlacesByCategory(category: CategorySlug): Promise<Place[]> {
  return cachedListingData(`places-category:${category}`, LIST_CACHE_TTL, () =>
    queryPlaceCards(buildListWhere({ category }), {
      sort: "best-overall",
      limit: 2000,
    }),
  );
}

export async function getPlacesInNeighborhood(neighborhood: string): Promise<Place[]> {
  const key = slugifyNeighborhood(neighborhood);
  return cachedListingData(`places-neighborhood:${key}`, LIST_CACHE_TTL, () =>
    queryPlaceCards(
      { sql: `${PUBLISHED_SQL} AND neighborhood_slug = ?`, params: [key] },
      { sort: "best-overall", limit: 500 },
    ),
  );
}

export async function searchPlaces(q: string, limit = 48): Promise<Place[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  return queryPlaceCards(buildListWhere({ q: trimmed }), {
    sort: "best-overall",
    limit,
  });
}

async function loadNeighborhoodCounts(): Promise<Record<string, number>> {
  const db = await getDb();
  const counts: Record<string, number> = {};
  if (!db) {
    for (const place of seedAsPlaces()) {
      if (!place.neighborhood) continue;
      counts[place.neighborhood] = (counts[place.neighborhood] ?? 0) + 1;
    }
    return counts;
  }
  const result = await db
    .prepare(
      `SELECT neighborhood_slug AS slug, COUNT(*) AS total
       FROM places
       WHERE ${PUBLISHED_SQL} AND neighborhood_slug IS NOT NULL AND neighborhood_slug != ''
       GROUP BY neighborhood_slug`,
    )
    .all<{ slug: string; total: number }>();
  for (const row of result.results ?? []) {
    const name = NEIGHBORHOOD_BY_SLUG[row.slug] ?? row.slug;
    counts[name] = Number(row.total);
  }
  return counts;
}

export async function getNeighborhoodCounts(): Promise<Record<string, number>> {
  return cachedListingData("neighborhood-counts", LIST_CACHE_TTL, loadNeighborhoodCounts);
}

export async function getTopNeighborhoods(count = 6): Promise<string[]> {
  const counts = await getNeighborhoodCounts();
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([n]) => n);
}

export type PlaceSitemapEntry = { slug: string; updatedAt: string };

async function loadSitemapPlaces(): Promise<PlaceSitemapEntry[]> {
  const db = await getDb();
  if (!db) {
    return seedAsPlaces().map((place) => ({ slug: place.slug, updatedAt: place.updatedAt }));
  }
  const result = await db
    .prepare(
      `SELECT slug, IFNULL(imported_at, '') AS imported_at
       FROM places
       WHERE ${PUBLISHED_SQL}
       ORDER BY slug ASC`,
    )
    .all<{ slug: string; imported_at: string }>();
  const rows = (result.results ?? []) as Array<{ slug: string; imported_at: string }>;
  return rows.map((row) => ({
    slug: row.slug,
    updatedAt: row.imported_at || new Date().toISOString(),
  }));
}

export async function getSitemapPlaces(): Promise<PlaceSitemapEntry[]> {
  return cachedListingData("sitemap-places", LIST_CACHE_TTL, loadSitemapPlaces);
}

// ── Guides ──────────────────────────────────────────────────────────

export function getAllGuides(): Guide[] {
  return allGuides;
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return allGuides.find((g) => g.slug === slug);
}

export function getLatestGuides(count = 3): Guide[] {
  return [...allGuides]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, count);
}
