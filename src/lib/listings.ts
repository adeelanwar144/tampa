import { places as seedPlaces } from "@/data/places";
import { guides as allGuides } from "@/data/guides";
import {
  ANCHOR_NEIGHBORHOODS,
  NEIGHBORHOODS as NEIGHBORHOOD_NAMES,
  neighborhoodSlug as slugifyNeighborhood,
} from "@/data/neighborhoods";
import { getDb } from "@/lib/d1";
import { getQuarantinedSlugs } from "@/lib/listing-content";
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
  imported_at: string | null;
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

/**
 * App listings read D1 only — never the Places API.
 * Seed data is never merged into production listings or the sitemap.
 * Local preview may use seed only when D1 is missing or empty.
 */
async function loadPlaces(): Promise<Place[]> {
  const db = await getDb();
  if (!db) return allowDraftPreview() ? seedPlaces : [];

  const listingSql = allowDraftPreview()
    ? "SELECT * FROM places"
    : "SELECT * FROM places WHERE status = 'published'";
  const [placeResult, imageResult, reviewResult] = await Promise.all([
    db.prepare(listingSql).all<PlaceRow>(),
    db.prepare("SELECT place_id, r2_key, sort_order FROM place_images").all<ImageRow>(),
    db
      .prepare(
        "SELECT place_id, rating, review_text, relative_time, author_name, author_uri FROM place_reviews",
      )
      .all<ReviewRow>(),
  ]);

  const fetched = (placeResult.results ?? []) as PlaceRow[];
  if (fetched.length === 0) return allowDraftPreview() ? seedPlaces : [];
  const hidden = await getQuarantinedSlugs();
  const rows = fetched.filter((row) => !hidden.has(row.slug));
  const images = (imageResult.results ?? []) as ImageRow[];
  const reviews = (reviewResult.results ?? []) as ReviewRow[];
  return rows.map((row) => placeFromRow(row, images, reviews));
}

// ── Hours / status helpers ──────────────────────────────────────────

/** Get the current Tampa time parts */
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

  // Check if opens tomorrow
  const tomorrow = (dayOfWeek + 1) % 7;
  const tomorrowHours = hours[tomorrow];
  if (tomorrowHours) {
    return {
      type: "closed",
      label: `Opens tomorrow at ${formatTime(tomorrowHours.open)}`,
    };
  }

  // Find next open day
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

// ── Sorting ─────────────────────────────────────────────────────────

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

export async function getFilteredPlaces(params: FilterParams): Promise<ListingsResult> {
  const now = new Date();
  let filtered = [...(await loadPlaces())];

  if (params.category) {
    filtered = filtered.filter((p) => p.category === params.category);
  }

  if (params.neighborhood) {
    filtered = filtered.filter(
      (p) =>
        Boolean(p.neighborhood) &&
        p.neighborhood.toLowerCase() === params.neighborhood?.toLowerCase(),
    );
  }

  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        (p.neighborhood && p.neighborhood.toLowerCase().includes(q)) ||
        p.subcategory.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (params.open) {
    filtered = filtered.filter((p) => isOpenNow(p, now));
  }

  const sorted = sortPlaces(filtered, params.sort ?? "best-overall");

  const total = sorted.length;
  const page = Math.max(1, params.page ?? 1);
  const totalPages = Math.max(1, Math.ceil(total / PLACES_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PLACES_PER_PAGE;
  const end = Math.min(start + PLACES_PER_PAGE, total);
  const pageItems = sorted.slice(start, end);

  return {
    places: pageItems,
    total,
    page: safePage,
    totalPages,
    start: total === 0 ? 0 : start + 1,
    end,
  };
}

function allowDraftPreview() {
  return process.env.NODE_ENV !== "production";
}

export async function getPlaceBySlug(slug: string): Promise<Place | undefined> {
  if ((await getQuarantinedSlugs()).has(slug)) return undefined;
  const db = await getDb();
  if (db) {
    const row = (await db.prepare("SELECT * FROM places WHERE slug = ?").bind(slug).first<PlaceRow>()) as
      | PlaceRow
      | null;
    if (row) {
      if (row.status === "draft" && !allowDraftPreview()) return undefined;
      const [imageResult, reviewResult] = await Promise.all([
        db
          .prepare("SELECT place_id, r2_key, sort_order FROM place_images WHERE place_id = ?")
          .bind(row.id)
          .all<ImageRow>(),
        db
          .prepare(
            "SELECT place_id, rating, review_text, relative_time, author_name, author_uri FROM place_reviews WHERE place_id = ?",
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

export async function getRelatedPlaces(place: Place, count = 3): Promise<Place[]> {
  if (!place.neighborhood) return [];
  const all = await loadPlaces();
  const mean =
    all.length === 0 ? 0 : all.reduce((sum, p) => sum + p.rating, 0) / all.length;
  return all
    .filter((p) => p.id !== place.id && Boolean(p.neighborhood) && p.neighborhood === place.neighborhood)
    .sort((a, b) => bayesianScore(b, mean) - bayesianScore(a, mean))
    .slice(0, count);
}

export async function getFeaturedPlaces(count = 6): Promise<Place[]> {
  const all = await loadPlaces();
  const featured = all.filter((p) => p.featured);
  const pool = featured.length > 0 ? featured : all;
  return sortPlaces(pool, "best-overall").slice(0, count);
}

export async function getAllPlaces(): Promise<Place[]> {
  return loadPlaces();
}

export async function getPlacesInNeighborhood(neighborhood: string): Promise<Place[]> {
  return (await loadPlaces()).filter((p) => p.neighborhood === neighborhood);
}

export async function getNeighborhoodCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const p of await loadPlaces()) {
    if (!p.neighborhood) continue;
    counts[p.neighborhood] = (counts[p.neighborhood] ?? 0) + 1;
  }
  return counts;
}

export async function getTopNeighborhoods(count = 6): Promise<string[]> {
  const counts = await getNeighborhoodCounts();
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([n]) => n);
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
