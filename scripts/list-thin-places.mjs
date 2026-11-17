import { mkdirSync, writeFileSync } from "node:fs";

const places = JSON.parse(
  (await import("node:fs")).readFileSync("tmp-published-places.json", "utf8"),
)[0].results;
const index = JSON.parse((await import("node:fs")).readFileSync("tmp-listing-index.json", "utf8"));
const wordsBySlug = new Map(index.map((entry) => [entry.slug, Number(entry.wordCount) || 0]));

const FOOD = new Set([
  "restaurant", "cafe", "bakery", "coffee_shop", "meal_takeaway", "meal_delivery", "ice_cream_shop",
  "sandwich_shop", "pizza_restaurant", "seafood_restaurant", "mexican_restaurant", "american_restaurant",
  "breakfast_restaurant", "brunch_restaurant", "hamburger_restaurant", "fine_dining_restaurant",
  "fast_food_restaurant", "bar_and_grill", "steak_house", "sushi_restaurant",
]);
const BARS = new Set(["bar", "night_club", "wine_bar", "pub", "cocktail_bar"]);
const OUTDOOR = new Set(["park", "beach", "hiking_area", "marina", "campground", "dog_park", "playground"]);
const ATTRACTION = new Set([
  "tourist_attraction", "museum", "art_gallery", "amusement_park", "aquarium", "zoo", "movie_theater",
  "performing_arts_theater", "stadium", "historical_landmark", "visitor_center",
]);
const SHOP = new Set([
  "store", "shopping_mall", "clothing_store", "book_store", "grocery_store", "gift_shop", "shoe_store",
  "convenience_store", "department_store", "jewelry_store", "supermarket",
]);
const NEIGHBORHOODS = {
  "ybor-city": "Ybor City",
  "downtown-tampa": "Downtown Tampa",
  "channel-district": "Channel District",
  "tampa-heights": "Tampa Heights",
  "davis-islands": "Davis Islands",
  "hyde-park": "Hyde Park",
  "bayshore-ballast-point": "Bayshore / Ballast Point",
  "beach-park-macdill": "Beach Park / MacDill",
  westshore: "Westshore",
  "west-tampa": "West Tampa",
  "seminole-heights": "Seminole Heights",
  "sulphur-springs": "Sulphur Springs",
  "new-tampa": "New Tampa",
  "east-tampa": "East Tampa",
};

function category(type) {
  if (!type) return "services";
  if (type === "hotel" || type === "hotels-lodging" || type.endsWith("_hotel")) return "hotels-lodging";
  if (FOOD.has(type) || type.endsWith("_restaurant")) return "food-drink";
  if (BARS.has(type)) return "bars-nightlife";
  if (OUTDOOR.has(type)) return "beaches-outdoors";
  if (ATTRACTION.has(type) || type === "public_library") return "attractions";
  if (SHOP.has(type) || type.endsWith("_store")) return "shopping";
  return "services";
}

function cityOf(address) {
  const parts = String(address ?? "").split(",").map((part) => part.trim()).filter(Boolean);
  const stateIdx = parts.findIndex((part) => /^(FL|Florida)(\b|\s)/i.test(part));
  if (stateIdx > 0) {
    const candidate = parts[stateIdx - 1];
    if (candidate && !/^\d/.test(candidate)) return candidate;
  }
  const named = parts.filter((part) => !/^\d/.test(part) && !/^(FL|Florida)\b/i.test(part));
  const city = named.length > 0 ? named[named.length - 1] : "";
  if (/\b(road|street|avenue|ave|blvd|boulevard|drive|hwy|highway|plaza)\b/i.test(city)) return "";
  return city;
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

const thin = [];
for (const place of places) {
  const words = wordsBySlug.has(place.slug) ? wordsBySlug.get(place.slug) : 0;
  const hasEssay = wordsBySlug.has(place.slug);
  if (hasEssay && words >= 300) continue;
  thin.push({
    slug: place.slug,
    name: place.name,
    category: category(place.primary_type),
    primaryType: place.primary_type ?? "",
    neighborhood: place.neighborhood_slug ? (NEIGHBORHOODS[place.neighborhood_slug] ?? place.neighborhood_slug) : "",
    city: cityOf(place.formatted_address),
    hasWebsite: place.website ? "yes" : "no",
    website: place.website ?? "",
    phone: place.phone ?? "",
    address: place.formatted_address ?? "",
    businessStatus: place.business_status ?? "",
    words,
    hasEssay,
  });
}

function tally(key) {
  const counts = {};
  for (const row of thin) {
    const label = row[key] || "(none)";
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

mkdirSync("content/places", { recursive: true });
const header = "slug,name,category,neighborhood,city,has website,current words";
const lines = thin.map((row) =>
  [row.slug, row.name, row.category, row.neighborhood, row.city, row.hasWebsite, row.words].map(csvCell).join(","),
);
writeFileSync("content/places/thin-places.csv", `${header}\n${lines.join("\n")}\n`, "utf8");
writeFileSync("content/places/thin-places.json", JSON.stringify(thin, null, 2), "utf8");

console.log(JSON.stringify({
  published: places.length,
  withEssay: places.filter((place) => wordsBySlug.has(place.slug)).length,
  thin: thin.length,
  noEssay: thin.filter((row) => !row.hasEssay).length,
  under300: thin.filter((row) => row.hasEssay).length,
  byCategory: tally("category"),
  byNeighborhood: tally("neighborhood"),
  byCity: tally("city"),
  primaryTypes: tally("primaryType").slice(0, 40),
}, null, 2));
