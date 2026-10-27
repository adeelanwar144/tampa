import { SITE_URL } from "@/config/site";
import type { CategorySlug, Place } from "@/types";

/** Title-case category names for search results. */
export const CATEGORY_SEO_LABEL: Record<CategorySlug, string> = {
  "food-drink": "Food & Drink",
  "bars-nightlife": "Bars & Nightlife",
  "beaches-outdoors": "Beaches & Outdoors",
  attractions: "Attractions",
  shopping: "Shopping",
  services: "Services",
  "hotels-lodging": "Hotels & Lodging",
};

const CATEGORY_SEO_SHORT: Record<CategorySlug, string> = {
  "food-drink": "Food",
  "bars-nightlife": "Bars",
  "beaches-outdoors": "Outdoors",
  attractions: "Sights",
  shopping: "Shops",
  services: "Services",
  "hotels-lodging": "Hotels",
};

const CATEGORY_COUNT_LABEL: Record<CategorySlug, { one: string; many: string }> = {
  "food-drink": { one: "Place to Eat", many: "Places to Eat" },
  "bars-nightlife": { one: "Bar to Try", many: "Bars to Try" },
  "beaches-outdoors": { one: "Place to Try", many: "Places to Try" },
  attractions: { one: "Place to Try", many: "Places to Try" },
  shopping: { one: "Place to Shop", many: "Places to Shop" },
  services: { one: "Local Service", many: "Local Services" },
  "hotels-lodging": { one: "Place to Stay", many: "Places to Stay" },
};

function placeLabel(neighborhood: string, city: string): string {
  if (neighborhood.toLowerCase().endsWith(city.toLowerCase())) return neighborhood;
  return `${neighborhood}, ${city}`;
}

function categoryCountLabel(category: CategorySlug, count: number): string {
  const labels = CATEGORY_COUNT_LABEL[category];
  return count === 1 ? labels.one : labels.many;
}

const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 155;

export function parsePage(value: string | undefined): number {
  const page = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) return 1;
  return page;
}

export function matchingPlaces(
  places: Place[],
  query: { category?: CategorySlug; neighborhood?: string; q?: string; open?: boolean },
  isOpen?: (place: Place) => boolean,
): Place[] {
  const neighborhood = query.neighborhood?.trim().toLowerCase();
  const q = query.q?.trim().toLowerCase();
  return places.filter((place) => {
    if (query.category && place.category !== query.category) return false;
    if (neighborhood && place.neighborhood.toLowerCase() !== neighborhood) return false;
    if (q && !`${place.name} ${place.subcategory}`.toLowerCase().includes(q)) return false;
    if (query.open && isOpen && !isOpen(place)) return false;
    return true;
  });
}

export function isClosedPlace(place: Pick<Place, "businessStatus">): boolean {
  return (place.businessStatus ?? "").toUpperCase().includes("CLOSED");
}

/** Name for titles and descriptions, without status notes such as "Temporarily closed". */
export function listingSeoName(name: string): string {
  const original = name.replace(/\s+/g, " ").trim();
  let value = original;
  const patterns = [
    /\s+is\s+temporar(?:y|ily)\s+closed\b[\s\S]*$/i,
    /\s*[-–—:,]*\s*temporar(?:y|ily)\s+closed\b[\s\S]*$/i,
    /\s*[-–—:,]*\s*permanently\s+closed\b[\s\S]*$/i,
    /\s+due to relocation\b[\s\S]*$/i,
    /\s*[-–—:,]*\s*be back soon\b[\s\S]*$/i,
    /\s*[-–—:]\s*closed\b[\s\S]*$/i,
  ];
  for (const pattern of patterns) value = value.replace(pattern, "");
  if (value === original) return original;
  value = value.replace(/[.\s,;:–—-]+$/g, "").replace(/\s+/g, " ").trim();
  return value || original;
}

/** City written in the address. Unknown or unusable fragments stay Tampa. */
export function placeCity(address: string | undefined): string {
  const parts = (address ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const part of parts.slice(1)) {
    if (isStreetFragment(part)) continue;
    const city = part.replace(/\s+FL\b.*$/i, "").trim();
    if (city && !isStreetFragment(city)) return city;
  }
  return "Tampa";
}

function isStreetFragment(part: string): boolean {
  if (/^[A-Za-z]$/.test(part)) return true;
  if (/^#/.test(part) || /^FL\b/i.test(part) || /^\d/.test(part)) return true;
  if (/^(suite|ste|apt|unit|bldg|building|floor)\b/i.test(part)) return true;
  if (/^corner\b/i.test(part)) return true;
  if (
    /^(?:N|S|E|W|NE|NW|SE|SW)\b/i.test(part) &&
    /\b(?:blvd|boulevard|ave|avenue|st|street|rd|road|dr|drive|hwy|highway|ln|lane|pkwy|parkway)\b/i.test(part)
  ) {
    return true;
  }
  return (
    /\d/.test(part) &&
    /\b(?:blvd|boulevard|ave|avenue|st|street|rd|road|dr|drive|hwy|highway)\b/i.test(part)
  );
}

export function withPageSuffix(title: string, page: number): string {
  if (page <= 1) return fitTitle(title);
  const suffix = ` – Page ${page}`;
  const room = TITLE_MAX - suffix.length;
  return `${fitTitle(title, room)}${suffix}`;
}

export function canonicalUrl(
  path: string,
  query: Record<string, string | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const key of ["category", "neighborhood", "q", "open", "sort"] as const) {
    const value = query[key]?.trim();
    if (!value) continue;
    if (key === "open" && value !== "true") continue;
    if (key === "sort" && value === "best-overall") continue;
    params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `${SITE_URL}${path}${qs ? `?${qs}` : ""}`;
}

export function placeMetaTitle(place: Place, peers: Place[] = []): string {
  const preferred = preferredTitle(place);
  const twins = peers.filter(
    (peer) => peer.slug !== place.slug && preferredTitle(peer) === preferred,
  );
  if (twins.length === 0) return maybeBrand(preferred);

  const atStreet = streetTitle(place);
  const streetTwins = twins.filter((peer) => streetTitle(peer) === atStreet);
  if (streetTwins.length === 0) return maybeBrand(atStreet);

  return fitTitle(slugTitle(place));
}

export function placeMetaDescription(place: Place, peers: Place[] = [], fact = ""): string {
  const name = listingSeoName(place.name);
  const city = placeCity(place.address);
  const withSlug = peers.some(
    (peer) =>
      peer.slug !== place.slug &&
      listingSeoName(peer.name) === name &&
      placeCity(peer.address) === city,
  );
  return finishFromOptions(placeLeadOptions(place, withSlug, fact), city);
}

export function categoryMeta(category: CategorySlug, places: Place[], page = 1): {
  title: string;
  description: string;
} {
  const label = CATEGORY_SEO_LABEL[category];
  const title = withPageSuffix(
    `${label} in Tampa, FL: ${places.length} ${categoryCountLabel(category, places.length)}`,
    page,
  );
  return { title, description: categoryDescription(label, places, page) };
}

export function neighborhoodMeta(name: string, places: Place[]): {
  title: string;
  description: string;
} {
  const full = `${name}, Tampa: Places to Eat, Shop & Visit`;
  const title = full.length <= TITLE_MAX ? full : fitTitle(`${name}, Tampa: Places to Visit`);
  return { title, description: neighborhoodDescription(name, places) };
}

export function directoryIndexMeta(places: Place[], page = 1): {
  title: string;
  description: string;
} {
  const title = withPageSuffix(`Tampa Directory: ${places.length} Places to Try`, page);
  const kinds = topKinds(places, 3);
  const areas = topNeighborhoods(places, 3);
  const kindText = kinds.length ? joinList(kinds) : "food, shopping, and services";
  const shortKinds = kinds.length ? joinList(kinds.slice(0, 2)) : "food and shopping";
  const areaText = areas.length ? ` in ${joinList(areas)}` : "";
  const shortAreas = areas.length ? ` in ${joinList(areas.slice(0, 2))}` : "";
  const leads =
    page > 1
      ? [
          `Page ${page} of the Tampa directory lists ${places.length} places, including ${kindText}${areaText}`,
          `Page ${page} of the Tampa directory lists ${places.length} places, including ${shortKinds}${shortAreas}`,
          `Page ${page} lists ${places.length} places in the Tampa directory, including ${shortKinds}`,
        ]
      : [
          `The Tampa directory lists ${places.length} places, including ${kindText}${areaText}`,
          `The Tampa directory lists ${places.length} places, including ${shortKinds}${shortAreas}`,
          `The Tampa directory lists ${places.length} places, including ${shortKinds}`,
        ];
  return { title, description: finishFromOptions(leads) };
}

export function placesIndexMeta(places: Place[], page = 1): {
  title: string;
  description: string;
} {
  const title = withPageSuffix(`Places in Tampa, FL: ${places.length} Places to Browse`, page);
  const kinds = topKinds(places, 3);
  const areas = topNeighborhoods(places, 3);
  const kindText = kinds.length ? joinList(kinds) : "restaurants, shops, and services";
  const shortKinds = kinds.length ? joinList(kinds.slice(0, 2)) : "restaurants and shops";
  const areaText = areas.length ? `, especially around ${joinList(areas)}` : "";
  const shortAreas = areas.length ? `, especially around ${joinList(areas.slice(0, 2))}` : "";
  const leads =
    page > 1
      ? [
          `Page ${page} browsing ${places.length} Tampa places: ${kindText}${areaText}`,
          `Page ${page} browsing ${places.length} Tampa places: ${shortKinds}${shortAreas}`,
          `Page ${page} is a browse of ${places.length} Tampa places, including ${shortKinds}`,
        ]
      : [
          `Browse ${places.length} Tampa places, from ${kindText}${areaText}`,
          `Browse ${places.length} Tampa places, from ${shortKinds}${shortAreas}`,
          `Browse ${places.length} Tampa places, including ${shortKinds}`,
        ];
  return { title, description: finishFromOptions(leads) };
}

const SORT_TITLE: Record<string, string> = {
  "most-popular": "Most Popular",
  "most-reviewed": "Most Reviewed",
  "highest-rated": "Highest Rated",
  "most-photos": "Most Photos",
  "recently-updated": "Recently Updated",
  "name-az": "A to Z",
  newest: "Newest",
};

export function filteredListingMeta(input: {
  label: string;
  places: Place[];
  page?: number;
  neighborhood?: string;
  q?: string;
  open?: boolean;
  sort?: string;
}): { title: string; description: string } {
  const page = input.page ?? 1;
  const where = input.neighborhood?.trim()
    ? `${input.neighborhood.trim()}, Tampa`
    : "Tampa";
  const bits = [`${input.label} in ${where}`];
  if (input.q?.trim()) bits.push(`for “${clip(input.q.trim(), 24)}”`);
  if (input.open) bits.push("open now");
  const sort = input.sort && input.sort !== "best-overall" ? SORT_TITLE[input.sort] : "";
  if (sort) bits.push(sort);
  const title = withPageSuffix(bits.join(" · "), page);
  const count = input.places.length;
  const noun = count === 1 ? "place" : "places";
  const filters = [
    input.neighborhood?.trim() ? input.neighborhood.trim() : "",
    input.q?.trim() ? `matching “${clip(input.q.trim(), 40)}”` : "",
    input.open ? "open now" : "",
    sort ? `sorted ${sort.toLowerCase()}` : "",
  ].filter(Boolean);
  const filterText = filters.length ? ` ${joinList(filters)}` : "";
  const lead =
    page > 1
      ? `Page ${page} shows ${count} ${input.label} ${noun}${filterText} in Tampa.`
      : `${count} ${input.label} ${noun}${filterText} in Tampa are in this filtered list.`;
  return { title, description: finishDescription(lead) };
}

function maybeBrand(title: string): string {
  const branded = `${title} | Visit In Tampa`;
  return branded.length <= TITLE_MAX ? branded : title;
}

function streetTitle(place: Place): string {
  const street = streetLine(place.address);
  if (!street) return preferredTitle(place);
  const prefix = closedPrefix(place);
  const name = listingSeoName(place.name);
  const full = CATEGORY_SEO_LABEL[place.category];
  const short = CATEGORY_SEO_SHORT[place.category];
  const options = [
    `${prefix}${name}: ${full} at ${street}`,
    `${prefix}${name}: ${short} at ${street}`,
  ];
  for (const option of options) {
    if (option.length <= TITLE_MAX) return option;
  }
  const tail = `: ${short} at ${street}`;
  const room = TITLE_MAX - prefix.length - tail.length;
  return `${prefix}${truncateName(name, Math.max(8, room))}${tail}`;
}

function slugTitle(place: Place): string {
  const street = streetLine(place.address);
  const prefix = closedPrefix(place);
  const short = CATEGORY_SEO_SHORT[place.category];
  const where = street ? `at ${street}` : `in ${placeCity(place.address)}`;
  const note = ` (${place.slug})`;
  const tail = `${note}: ${short} ${where}`;
  const room = TITLE_MAX - prefix.length - tail.length;
  return `${prefix}${truncateName(listingSeoName(place.name), Math.max(8, room))}${tail}`;
}

function preferredTitle(place: Place): string {
  const prefix = closedPrefix(place);
  const name = listingSeoName(place.name);
  const full = CATEGORY_SEO_LABEL[place.category];
  const short = CATEGORY_SEO_SHORT[place.category];
  const city = placeCity(place.address);
  const neighborhood = city === "Tampa" ? place.neighborhood?.trim() : "";
  const candidates = [
    neighborhood ? `${prefix}${name}: ${full} in ${placeLabel(neighborhood, city)}` : "",
    `${prefix}${name}: ${full} in ${city}`,
    `${prefix}${name}: ${short} in ${city}`,
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate.length <= TITLE_MAX) return candidate;
  }
  const tail = `: ${short} in ${city}`;
  const room = TITLE_MAX - prefix.length - tail.length;
  return `${prefix}${truncateName(name, Math.max(8, room))}${tail}`;
}

function placeLeadOptions(place: Place, withSlug: boolean, fact = ""): string[] {
  const type = typePhrase(place.subcategory || "place");
  const article = /^[aeiou]/i.test(type) ? "an" : "a";
  const category = CATEGORY_SEO_LABEL[place.category];
  const name = namedForDescription(place, withSlug);
  const detail = fact.trim() || descriptionDetail(place);
  const specifics = detail
    ? [...factOptions(detail), `Filed under ${category}`]
    : [`Filed under ${category}`];
  const city = placeCity(place.address);
  const neighborhood = city === "Tampa" ? place.neighborhood?.trim() : "";
  const { street } = addressParts(place.address || "");
  const wheres = [
    neighborhood && street ? `in ${neighborhood} at ${street}` : "",
    street ? `at ${street} in ${city}` : "",
    neighborhood ? `in ${neighborhood}` : "",
    `in ${city}`,
  ].filter((where, index, all) => where && all.indexOf(where) === index);
  const compactName = withSlug
    ? `${truncateName(listingSeoName(place.name), 18)} (${place.slug})`
    : truncateName(listingSeoName(place.name), 28);
  if (isClosedPlace(place)) {
    const subject = withSlug ? `${name} (${place.slug})` : `${name} is closed`;
    return specifics.flatMap((specific) =>
      wheres.flatMap((where) => [
        `${subject}. This closed ${type} is ${where}. ${specific}`,
        `This closed ${type} is ${where}. ${specific}`,
      ]),
    );
  }
  return specifics.flatMap((specific) => [
    ...wheres.map((where) => `${name} is ${article} ${type} ${where}. ${specific}`),
    `${compactName} is ${article} ${type} in ${city}. ${specific}`,
  ]);
}

function factOptions(detail: string): string[] {
  const clean = detail.replace(/[.!?]+$/g, "").replace(/\s+/g, " ").trim();
  const withoutIntro = clean.replace(/^(?:examples include|including|such as)\s+/i, "");
  const options = [
    clean,
    clean.split(/,\s+which\s+/i)[0] ?? "",
    clean.split(/,\s+so\s+/i)[0] ?? "",
    clean.split(/,\s+/)[0] ?? "",
    clean.split(/\s+with\s+/i)[0] ?? "",
    clean.split(/\s+so\s+/i)[0] ?? "",
    (clean.split(/\s+that\s+/i)[1] ?? "").split(/,\s+which\s+/i)[0] ?? "",
    withoutIntro,
    withoutIntro.split(/\s+with\s+/i)[0] ?? "",
  ];
  return [
    ...new Set(
      options
        .map((option) => startSentence(option.replace(/[\s,;:]+$/g, "").trim()))
        .filter(
          (option) =>
            option.length >= 18 &&
            option.length <= 90 &&
            !isDangling(option) &&
            !/^(which|that|before|if|and|but)\b/i.test(option) &&
            !/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(option),
        ),
    ),
  ];
}

function startSentence(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function isDangling(text: string): boolean {
  const last = text.split(" ").pop() ?? "";
  return /^(and|or|the|a|an|in|at|of|to|for|with|on|from|by|so|you|can)$/i.test(last);
}

function namedForDescription(place: Place, withSlug: boolean): string {
  const name = listingSeoName(place.name);
  if (!withSlug) return name.length > 52 ? truncateName(name, 52) : name;
  const note = ` (${place.slug})`;
  return `${truncateName(name, Math.max(8, 52 - note.length))}${note}`;
}

function categoryDescription(label: string, places: Place[], page: number): string {
  const pagePrefix = page > 1 ? `Page ${page} of ` : "";
  if (places.length === 0) {
    return finishFromOptions([
      `${pagePrefix}${label} in Tampa has no places listed yet. This section will list new spots as they are added`,
    ]);
  }
  const kinds = topKinds(places, 3);
  const areas = topNeighborhoods(places, 3);
  const leads: string[] = [];
  for (const [kindCount, areaCount] of [
    [2, 3],
    [3, 2],
    [2, 2],
    [3, 3],
    [1, 3],
    [1, 2],
    [3, 1],
    [2, 1],
  ] as const) {
    if (kinds.length < kindCount || areas.length < areaCount) continue;
    leads.push(
      `${pagePrefix}${label} in Tampa includes ${joinList(kinds.slice(0, kindCount))} in ${joinList(areas.slice(0, areaCount))}`,
    );
  }
  const fallbackKinds = joinList(kinds.slice(0, 2)) || label.toLowerCase();
  leads.push(`${pagePrefix}${label} in Tampa includes ${fallbackKinds} across the city`);
  return finishFromOptions(leads);
}

function neighborhoodDescription(name: string, places: Place[]): string {
  if (places.length === 0) {
    return finishDescription(
      `${name}, Tampa has no places listed yet. Food, shopping, and services show up here when they are added`,
    );
  }
  const kinds = topCategoryLabels(places, 3);
  const noun = places.length === 1 ? "place" : "places";
  const kindText = kinds.length ? joinList(kinds) : "local spots";
  return finishDescription(
    `${name}, Tampa has ${places.length} ${noun}. The top categories are ${kindText}`,
  );
}

function addressParts(address: string): { street: string; city: string } {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    street: parts[0] ?? "",
    city: placeCity(address),
  };
}

function descriptionDetail(place: Place): string {
  const raw = (place.description || place.tagline || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  const sentence = (raw.split(/(?<=[.!?])\s+/)[0] ?? raw).replace(/[.!?]+$/, "").trim();
  if (sentence.length < 24) return "";
  return clip(sentence, 90);
}

function topKinds(places: Place[], count: number): string[] {
  return topCounted(
    places.map((place) => naturalKind(place.subcategory)),
    count,
  );
}

function naturalKind(subcategory: string): string {
  const raw = subcategory.replace(/\s+/g, " ").trim().toLowerCase();
  if (/fast food|meal takeaway|meal delivery|hamburger/.test(raw)) return "quick bites";
  if (/coffee|cafe|bakery|donut|ice cream|juice|smoothie/.test(raw)) return "cafes";
  if (raw.includes("restaurant")) return "restaurants";
  return kindLabel(subcategory);
}

function topCategoryLabels(places: Place[], count: number): string[] {
  return topCounted(
    places.map((place) => CATEGORY_SEO_LABEL[place.category]),
    count,
  );
}

function topNeighborhoods(places: Place[], count: number): string[] {
  return topCounted(
    places.map((place) => place.neighborhood?.trim() || ""),
    count,
  );
}

function topCounted(values: string[], count: number): string[] {
  const totals = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    totals.set(value, (totals.get(value) ?? 0) + 1);
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, count)
    .map(([value]) => value);
}

function kindLabel(subcategory: string): string {
  const raw = subcategory.replace(/\s+/g, " ").trim().toLowerCase();
  if (!raw || raw === "place") return "places";
  if (raw === "restaurant") return "restaurants";
  if (raw.endsWith(" restaurant")) {
    const cuisine = raw.slice(0, -" restaurant".length);
    if (cuisine === "fast food") return "fast food";
    return properize(`${cuisine} restaurants`);
  }
  if (raw.endsWith(" shop")) return properize(`${raw.slice(0, -" shop".length)} shops`);
  if (raw.endsWith(" store")) return properize(`${raw.slice(0, -" store".length)} stores`);
  if (raw.endsWith("y") && !/[aeiou]y$/i.test(raw)) return properize(`${raw.slice(0, -1)}ies`);
  if (raw.endsWith("s")) return properize(raw);
  return properize(`${raw}s`);
}

function properize(label: string): string {
  return label.replace(
    /\b(american|chinese|mexican|italian|japanese|indian|thai|french|greek|korean|vietnamese|cuban|spanish|mediterranean|caribbean|latin|asian|irish)\b/gi,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );
}

function typePhrase(subcategory: string): string {
  const clean = subcategory.replace(/\s+/g, " ").trim().toLowerCase();
  if (!clean || clean === "place") return "place";
  return properize(clean);
}

function streetLine(address: string | undefined): string {
  return (address ?? "").split(",")[0]?.trim() ?? "";
}

function closedPrefix(place: Place): string {
  return isClosedPlace(place) ? "(Closed) " : "";
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > 24 ? cut.slice(0, space) : cut).replace(/[\s,;:]+$/g, "");
}

function truncateName(name: string, max: number): string {
  const paren = name.indexOf("(");
  if (paren > 8 && paren <= max) {
    return name.slice(0, paren).replace(/[\s,.:;&/–-]+$/g, "");
  }
  if (name.length <= max) return name;
  const slice = name.slice(0, Math.max(1, max));
  const space = slice.lastIndexOf(" ");
  let cut = space >= Math.min(12, max) ? slice.slice(0, space) : slice;
  cut = cut.replace(/\s+(?:by|and|of|the)\s+(?:Dr|Mr|Mrs|Ms|St|Jr|Sr)\.?$/i, "");
  return cut.replace(/[\s,:;&/–-]+$/g, "").replace(/\s+(?:by|and|of|the)$/i, "");
}

function fitTitle(title: string, max = TITLE_MAX): string {
  const clean = title.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const space = slice.lastIndexOf(" ");
  const cut = space >= max - 18 ? slice.slice(0, space) : slice;
  return cut.replace(/[\s,.:;|–-]+$/g, "");
}

const CTAS = [
  "Address, photos, and tips before you go.",
  "Address, photos, and tips before you visit.",
  "See the address, photos, and tips before you go.",
  "See the address, photos, and local tips before you go.",
];

function bridgesFor(city: string): string[] {
  return [
    `Listed in ${city}.`,
    "On Visit In Tampa.",
    `It is listed in ${city}.`,
    "It is listed on Visit In Tampa.",
    "The page is part of the Tampa directory.",
  ];
}

function finishDescription(lead: string, city = "Tampa"): string {
  return finishFromOptions([lead], city);
}

function finishFromOptions(leads: string[], city = "Tampa"): string {
  const bridges = bridgesFor(city);
  const heads = leads.flatMap((lead) => sentenceOptions(tidy(lead)));
  for (const head of heads) {
    const text = fitPair(head, bridges);
    if (text) return text;
  }
  const shortest = [...heads].sort((a, b) => a.length - b.length)[0] ?? `This place is listed in ${city}.`;
  return forceFit(shortest, bridges);
}

function sentenceOptions(head: string): string[] {
  return [head];
}

function splitSentences(head: string): string[] {
  return head.split(/(?<=[A-Za-z]{3}\.)\s+(?=[A-Z])/).filter((part) => part.trim().length > 24);
}

function fitPair(head: string, bridges: string[]): string | null {
  const direct = withCta(head);
  if (direct) return direct;
  for (const bridge of bridges) {
    const text = withCta(tidy(`${head.replace(/\.$/, "")}. ${bridge}`));
    if (text) return text;
  }
  return null;
}

function forceFit(head: string, bridges: string[]): string {
  const cta = CTAS[0];
  const maxHead = DESC_MAX - cta.length - 1;
  const minHead = DESC_MIN - cta.length - 1;
  let value = tidy(head);
  if (value.length > maxHead) value = safeTrim(value, maxHead);
  if (value.length < minHead) {
    for (const bridge of bridges) {
      const next = tidy(`${value.replace(/\.$/, "")}. ${bridge}`);
      if (next.length >= minHead && next.length <= maxHead) {
        value = next;
        break;
      }
    }
  }
  if (value.length > maxHead) value = safeTrim(value, maxHead);
  const text = `${value} ${cta}`.replace(/\s+/g, " ").trim();
  if (text.length >= DESC_MIN && text.length <= DESC_MAX) return text;
  if (text.length < DESC_MIN) return `${value} ${CTAS[2]}`.replace(/\s+/g, " ").trim();
  return `${safeTrim(value, maxHead)} ${cta}`.replace(/\s+/g, " ").trim();
}

function safeTrim(head: string, max: number): string {
  const sentences = splitSentences(head);
  if (sentences.length > 1 && sentences[0].length <= max) return tidy(sentences[0]);
  let value = head.length > max ? head.slice(0, max) : head;
  const space = value.lastIndexOf(" ");
  if (space >= 40) value = value.slice(0, space);
  value = value
    .replace(/[\s,;:]+$/g, "")
    .replace(/\b(and|or|the|a|an|in|at|of|to|for|it|under|filed)\b$/i, "")
    .replace(/[\s,;:]+$/g, "");
  if (!/[.!?]$/.test(value)) value += ".";
  return value;
}

function withCta(head: string): string | null {
  for (const cta of CTAS) {
    const text = `${head} ${cta}`.replace(/\s+/g, " ").trim();
    if (text.length >= DESC_MIN && text.length <= DESC_MAX) return text;
  }
  return null;
}

function tidy(text: string): string {
  let value = text.replace(/\s+/g, " ").trim().replace(/[,\s:;–-]+$/g, "");
  value = value.replace(/\s+\./g, ".");
  if (!/[.!?]$/.test(value)) value += ".";
  return value;
}
