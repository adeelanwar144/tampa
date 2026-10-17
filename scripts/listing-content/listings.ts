import type { CategorySlug, CompactListing } from "./types";
import { isTravelListing } from "./travel";
import { runWrangler } from "./wrangler-cli";

const CATEGORY_LABELS: Record<CategorySlug, string> = {
  "food-drink": "Food & drink",
  "bars-nightlife": "Bars & nightlife",
  "beaches-outdoors": "Beaches & outdoors",
  attractions: "Attractions",
  shopping: "Shopping",
  services: "Services",
  "hotels-lodging": "Hotels & lodging",
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
  "public_library",
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

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type PlaceRow = {
  slug: string;
  name: string;
  neighborhood_slug: string | null;
  neighborhood_name: string | null;
  formatted_address: string | null;
  phone: string | null;
  website: string | null;
  price_level: number | null;
  primary_type: string | null;
  hours_json: string | null;
  description: string | null;
  delivery: number | null;
  takeout: number | null;
  dine_in: number | null;
  wheelchair_accessible: number | null;
  tagline: string | null;
  business_status: string | null;
};

export function categoryFromType(primaryType: string | null): CategorySlug {
  if (!primaryType) return "services";
  if (
    primaryType === "hotel" ||
    primaryType === "lodging" ||
    primaryType === "hotels-lodging" ||
    primaryType.endsWith("_hotel") ||
    primaryType.includes("lodging")
  ) {
    return "hotels-lodging";
  }
  if (FOOD_TYPES.has(primaryType) || primaryType.endsWith("_restaurant")) return "food-drink";
  if (BAR_TYPES.has(primaryType)) return "bars-nightlife";
  if (OUTDOOR_TYPES.has(primaryType)) return "beaches-outdoors";
  if (ATTRACTION_TYPES.has(primaryType)) return "attractions";
  if (SHOP_TYPES.has(primaryType) || primaryType.endsWith("_store")) return "shopping";
  return "services";
}

function humanizeType(primaryType: string | null): string | undefined {
  if (!primaryType) return undefined;
  return primaryType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function padTime(value: number | undefined): string {
  return String(value ?? 0).padStart(2, "0");
}

function formatClock(hour: number | undefined, minute: number | undefined): string {
  const h = hour ?? 0;
  const m = minute ?? 0;
  const suffix = h >= 12 ? "p.m." : "a.m.";
  const twelve = h % 12 || 12;
  return `${twelve}:${padTime(m)} ${suffix}`;
}

function isOpen24Hours(value: string): boolean {
  const n = value
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[.–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (/\bopen 24 hours?\b/.test(n) || n === "24 hours" || /\b24\s*hours?\b/.test(n)) return true;
  return /12:00\s*a\.?m\.?\s*-\s*11:59\s*p\.?m\.?/.test(n);
}

function normalizeHours(hours: Record<string, string>): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [day, value] of Object.entries(hours)) {
    next[day] = isOpen24Hours(value) ? "Open 24 hours" : value;
  }
  return next;
}

function hoursFromJson(raw: string | null): Record<string, string> | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as {
      regularOpeningHours?: {
        weekdayDescriptions?: string[];
        periods?: Array<{
          open?: { day?: number; hour?: number; minute?: number };
          close?: { day?: number; hour?: number; minute?: number };
        }>;
      };
      weekdayDescriptions?: string[];
      periods?: Array<{
        open?: { day?: number; hour?: number; minute?: number };
        close?: { day?: number; hour?: number; minute?: number };
      }>;
    };
    const descriptions =
      parsed.regularOpeningHours?.weekdayDescriptions ?? parsed.weekdayDescriptions ?? [];
    if (descriptions.length > 0) {
      const hours: Record<string, string> = {};
      for (const line of descriptions) {
        const idx = line.indexOf(":");
        if (idx === -1) continue;
        const day = line.slice(0, idx).trim();
        const rest = line.slice(idx + 1).trim();
        if (day && rest) hours[day] = rest;
      }
      const normalized = Object.keys(hours).length ? normalizeHours(hours) : undefined;
      return normalized;
    }
    const periods = parsed.regularOpeningHours?.periods ?? parsed.periods ?? [];
    const hours: Record<string, string> = {};
    for (const period of periods) {
      const day = period.open?.day;
      if (day === undefined || hours[DAY_NAMES[day]]) continue;
      if (!period.close) {
        hours[DAY_NAMES[day]] = "Open 24 hours";
        continue;
      }
      const openHour = period.open?.hour ?? 0;
      const openMinute = period.open?.minute ?? 0;
      const closeHour = period.close.hour ?? 0;
      const closeMinute = period.close.minute ?? 0;
      const wrapsAllDay =
        openHour === 0 &&
        openMinute === 0 &&
        ((closeHour === 23 && closeMinute === 59) || (closeHour === 0 && closeMinute === 0));
      hours[DAY_NAMES[day]] = wrapsAllDay
        ? "Open 24 hours"
        : `${formatClock(openHour, openMinute)}–${formatClock(closeHour, closeMinute)}`;
    }
    return Object.keys(hours).length ? normalizeHours(hours) : undefined;
  } catch {
    return undefined;
  }
}

function cityFromAddress(address: string | null): string {
  if (!address) return "Tampa";
  const match = address.match(/,\s*([A-Za-z .']+),\s*FL\b/i);
  return match?.[1]?.trim() || "Tampa";
}

function priceLabel(level: number | null): string | undefined {
  if (level === 1 || level === 2 || level === 3 || level === 4) return "$".repeat(level);
  return undefined;
}

function compactFromRow(row: PlaceRow): CompactListing {
  const category = categoryFromType(row.primary_type);
  const listing: CompactListing = {
    slug: row.slug,
    name: row.name,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    city: cityFromAddress(row.formatted_address),
  };
  if (row.primary_type) listing.primaryType = row.primary_type;
  const subcategory = humanizeType(row.primary_type);
  if (subcategory) listing.subcategory = subcategory;
  const neighborhood = row.neighborhood_name?.trim();
  if (neighborhood) listing.neighborhood = neighborhood;
  if (row.formatted_address?.trim()) listing.address = row.formatted_address.trim();
  if (row.phone?.trim()) listing.phone = row.phone.trim();
  if (row.website?.trim()) listing.website = row.website.trim();
  const hours = hoursFromJson(row.hours_json);
  if (hours) listing.hours = hours;
  const price = priceLabel(row.price_level);
  if (price) listing.priceLevel = price;
  if (row.delivery === 1) listing.delivery = true;
  if (row.takeout === 1) listing.takeout = true;
  if (row.dine_in === 1) listing.dineIn = true;
  if (row.wheelchair_accessible === 1) listing.wheelchairAccessible = true;
  if (row.tagline?.trim()) listing.tagline = row.tagline.trim();
  if (row.description?.trim()) listing.description = row.description.trim();
  return listing;
}

async function d1Json(args: string[]): Promise<unknown> {
  const { stdout } = await runWrangler(["d1", "execute", "tampa-bay-guide", ...args], {
    maxBuffer: 32 * 1024 * 1024,
  });
  const startArr = stdout.indexOf("[");
  const startObj = stdout.indexOf("{");
  const start =
    startArr === -1 ? startObj : startObj === -1 ? startArr : Math.min(startArr, startObj);
  if (start === -1) throw new Error("wrangler d1 execute returned no JSON");
  return JSON.parse(stdout.slice(start));
}

function rowsFromExecute(payload: unknown): PlaceRow[] {
  const rows: PlaceRow[] = [];
  const walk = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      const first = value[0];
      if (first && typeof first === "object" && "slug" in first && "name" in first) {
        rows.push(...(value as PlaceRow[]));
        return;
      }
      for (const item of value) walk(item);
      return;
    }
    walk((value as { results?: unknown }).results);
  };
  walk(payload);
  return rows;
}

const LISTING_SQL =
  "SELECT p.slug, p.name, p.neighborhood_slug, n.name AS neighborhood_name, p.formatted_address, p.phone, p.website, p.price_level, p.primary_type, p.hours_json, p.delivery, p.takeout, p.dine_in, p.wheelchair_accessible, p.tagline, p.description, p.business_status FROM places p LEFT JOIN neighborhoods n ON n.slug = p.neighborhood_slug WHERE p.business_status IS NULL OR p.business_status = 'OPERATIONAL'";

export async function loadListings(source: "remote" | "local" = "remote"): Promise<CompactListing[]> {
  const flag = source === "local" ? "--local" : "--remote";
  console.log(`Loading listings from D1 (${source})...`);
  const payload = await d1Json([flag, "--json", "--command", LISTING_SQL]);
  const rows = rowsFromExecute(payload);
  if (rows.length === 0) {
    throw new Error(`No listings returned from D1 (${source}).`);
  }
  return rows.map(compactFromRow);
}

export function filterListings(
  listings: CompactListing[],
  options: { slugs?: string[]; category?: string; limit?: number; travelOnly?: boolean },
): CompactListing[] {
  let next = listings;
  if (options.travelOnly) next = next.filter(isTravelListing);
  if (options.slugs?.length) {
    const wanted = new Set(options.slugs.map((slug) => slug.toLowerCase()));
    next = next.filter((listing) => wanted.has(listing.slug.toLowerCase()));
  }
  if (options.category) {
    const needle = options.category.trim().toLowerCase();
    next = next.filter(
      (listing) =>
        listing.category === needle ||
        listing.categoryLabel.toLowerCase() === needle ||
        listing.subcategory?.toLowerCase() === needle,
    );
  }
  if (options.limit) next = next.slice(0, options.limit);
  return next;
}

export function pickDiverseTestSet(listings: CompactListing[], count: number): CompactListing[] {
  const preferred: CategorySlug[] = ["food-drink", "hotels-lodging", "attractions"];
  const picked: CompactListing[] = [];
  const used = new Set<string>();
  for (const category of preferred) {
    const match = listings.find((listing) => listing.category === category && !used.has(listing.slug));
    if (match) {
      picked.push(match);
      used.add(match.slug);
    }
    if (picked.length >= count) return picked;
  }
  for (const listing of listings) {
    if (used.has(listing.slug)) continue;
    picked.push(listing);
    used.add(listing.slug);
    if (picked.length >= count) break;
  }
  return picked;
}

export { CATEGORY_LABELS };
