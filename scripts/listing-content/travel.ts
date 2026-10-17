import type { CategorySlug, CompactListing } from "./types";

/** Visitor-facing retail. Grocery, convenience, pharmacy and auto parts stay out. */
const INCLUDE_SHOP_TYPES = new Set([
  "shopping_mall",
  "mall_store",
  "clothing_store",
  "men_s_clothing_store",
  "shoe_store",
  "boutique_store",
  "gift_shop",
  "book_store",
  "jewelry_store",
  "department_store",
  "toy_store",
  "sports_store",
  "music_store",
  "game_store",
  "video_game_store",
  "cigar_shop_store",
  "cosmetics_store",
  "thrift_store",
  "bicycle_store",
  "florist_store",
  "craft_store",
  "formal_wear_store",
]);

const INCLUDE_FOOD_EXTRA = new Set([
  "bakery",
  "bagel_shop",
  "donut_shop",
  "dessert_shop",
  "frozen_yogurt_shop",
  "bubble_tea_store",
  "brewery",
  "winery",
  "distillery",
  "delivery_restaurant",
]);

const INCLUDE_ENTERTAINMENT = new Set([
  "bowling_alley",
  "comedy_club",
  "karaoke",
  "arcade",
  "escape_room",
  "tour_agency",
  "travel_agency",
  "boat_tour_agency",
]);

export const EXCLUDE_TYPES = new Set([
  "gas_station",
  "bank",
  "credit_union",
  "atm",
  "grocery_store",
  "supermarket",
  "convenience_store",
  "pharmacy_store",
  "drug_store",
  "cell_phone_store",
  "home_improvement_store",
  "auto_repair_shop",
  "auto_body_shop",
  "auto_parts_store",
  "car_repair",
  "car_wash",
  "car_dealer",
  "used_car_dealer",
  "tire_shop",
  "oil_change_service",
  "furniture_store",
  "electronics_store",
  "discount_store",
  "storage_rental_store",
  "self_storage_facility",
]);

export type RichnessTier = "rich" | "medium" | "thin";

export type RichnessScore = {
  tier: RichnessTier;
  filled: string[];
};

export function isTravelListing(listing: CompactListing): boolean {
  const type = (listing.primaryType ?? listing.subcategory ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (EXCLUDE_TYPES.has(type)) return false;
  if (listing.category === "services") {
    return INCLUDE_ENTERTAINMENT.has(type);
  }
  if (listing.category === "shopping") {
    return INCLUDE_SHOP_TYPES.has(type);
  }
  if (
    listing.category === "food-drink" ||
    listing.category === "bars-nightlife" ||
    listing.category === "hotels-lodging" ||
    listing.category === "attractions" ||
    listing.category === "beaches-outdoors"
  ) {
    return true;
  }
  return INCLUDE_FOOD_EXTRA.has(type) || INCLUDE_ENTERTAINMENT.has(type);
}

export function enrichmentWordCount(listing: CompactListing): number {
  return listing.websiteText?.trim().split(/\s+/).filter(Boolean).length ?? 0;
}

export function scoreRichness(listing: CompactListing): RichnessScore {
  const filled: string[] = [];
  if (listing.description || listing.tagline) filled.push("description");
  if (listing.hours && Object.keys(listing.hours).length) filled.push("hours");
  if (listing.phone) filled.push("phone");
  if (listing.website) filled.push("website");
  if (listing.delivery || listing.takeout || listing.dineIn || listing.wheelchairAccessible) {
    filled.push("amenities");
  }
  if (listing.priceLevel) filled.push("price range");
  if (listing.neighborhood) filled.push("neighborhood");
  if (listing.tags && listing.tags.length) filled.push("tags");
  const websiteWords = enrichmentWordCount(listing);
  const base = filled.length;
  if (websiteWords >= 80) filled.push("website text");
  const tier: RichnessTier =
    websiteWords >= 250 || base >= 5 ? "rich" : filled.length >= 3 || websiteWords >= 80 ? "medium" : "thin";
  return { tier, filled };
}

export function tierLimits(tier: Exclude<RichnessTier, "thin">): { minWords: number; maxWords: number; headings: number } {
  if (tier === "rich") return { minWords: 450, maxWords: 750, headings: 3 };
  return { minWords: 150, maxWords: 420, headings: 2 };
}

export const TRAVEL_CATEGORY_LABELS: Record<CategorySlug, string> = {
  "food-drink": "include (restaurants, cafes, bakeries)",
  "bars-nightlife": "include",
  "hotels-lodging": "include",
  attractions: "include (museums, theaters, attractions)",
  "beaches-outdoors": "include (parks, beaches)",
  shopping: "include visitor retail only; grocery/pharmacy/convenience excluded",
  services: "exclude except entertainment/tours",
};
