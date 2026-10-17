import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PATHS, pexelsApiKey } from "./env";
import type { PexelsImage } from "./types";

const STOP = new Set([
  "a",
  "an",
  "the",
  "of",
  "at",
  "in",
  "on",
  "for",
  "and",
  "with",
  "from",
  "looking",
  "toward",
  "towards",
  "photo",
  "picture",
  "image",
  "seen",
  "during",
  "over",
  "into",
  "near",
]);

const WEAK = new Set([
  ...STOP,
  "tampa",
  "florida",
  "downtown",
  "city",
  "street",
  "building",
  "exterior",
  "interior",
  "people",
  "person",
  "man",
  "woman",
  "sky",
  "water",
  "night",
  "day",
  "view",
  "area",
  "place",
  "bright",
  "sunny",
  "dusk",
  "morning",
]);

const LAST_RESORT = "tampa florida";

type SubjectKind =
  | "restaurant"
  | "hotel"
  | "event"
  | "theater"
  | "golf"
  | "trampoline"
  | "zoo"
  | "outdoors"
  | "neighborhood"
  | "road"
  | "practical"
  | "attraction";

const KIND_RELATED: Record<SubjectKind, { withCity: string[]; typeOnly: string[]; words: string[] }> = {
  restaurant: {
    withCity: ["waterfront restaurant Tampa", "steakhouse dining Tampa", "restaurant Tampa"],
    typeOnly: ["restaurant interior", "seafood restaurant interior", "steakhouse dining", "deli sandwich", "restaurant food"],
    words: ["restaurant", "dining", "food", "meal", "steak", "grill", "kitchen", "seafood", "sandwich", "deli", "cafe", "chef", "plate", "dinner"],
  },
  hotel: {
    withCity: ["hotel pool Tampa", "luxury hotel Tampa", "waterfront hotel Tampa"],
    typeOnly: ["hotel lobby", "hotel room", "hotel pool"],
    words: ["hotel", "lobby", "pool", "suite", "resort", "room", "bed", "valet"],
  },
  event: {
    withCity: ["concert Tampa", "live music venue Tampa"],
    typeOnly: ["concert crowd", "stage lights venue", "music festival crowd"],
    words: ["concert", "crowd", "stage", "venue", "audience", "festival", "show", "arena"],
  },
  theater: {
    withCity: ["historic theater Tampa", "movie palace Tampa"],
    typeOnly: ["theater marquee", "historic theater interior"],
    words: ["theater", "theatre", "marquee", "cinema", "stage", "palace", "auditorium"],
  },
  golf: {
    withCity: ["golf course Tampa", "golf clubhouse Florida"],
    typeOnly: ["golf course fairway", "golf clubhouse"],
    words: ["golf", "fairway", "green", "clubhouse", "tee", "course"],
  },
  trampoline: {
    withCity: ["trampoline park Tampa"],
    typeOnly: ["trampoline park", "indoor trampoline"],
    words: ["trampoline", "jump", "indoor", "park"],
  },
  zoo: {
    withCity: ["zoo Tampa animals", "zoo enclosure Florida"],
    typeOnly: ["zoo animals", "zoo enclosure"],
    words: ["zoo", "animal", "tiger", "giraffe", "manatee", "enclosure", "wildlife"],
  },
  outdoors: {
    withCity: ["Tampa Riverwalk", "Bayshore Boulevard waterfront"],
    typeOnly: ["waterfront promenade", "bayfront park"],
    words: ["riverwalk", "bayshore", "waterfront", "promenade", "park", "bay", "river"],
  },
  neighborhood: {
    withCity: ["Ybor City brick street", "historic Tampa neighborhood"],
    typeOnly: ["historic brick street", "cigar factory historic"],
    words: ["ybor", "brick", "historic", "neighborhood", "cigar", "avenue"],
  },
  road: {
    withCity: ["Florida interstate highway", "I-75 Florida drive"],
    typeOnly: ["highway road trip", "florida highway"],
    words: ["highway", "interstate", "road", "drive", "car", "freeway"],
  },
  practical: {
    withCity: ["Tampa city map", "Florida map"],
    typeOnly: ["city map", "clock time zone", "postal map"],
    words: ["map", "clock", "time", "zip", "postal", "timezone"],
  },
  attraction: {
    withCity: ["Tampa waterfront park", "Tampa attractions"],
    typeOnly: ["city waterfront", "aquarium interior"],
    words: ["attraction", "aquarium", "park", "waterfront", "museum"],
  },
};

type Photo = {
  id: number;
  url: string;
  alt?: string | null;
  photographer: string;
  photographer_url: string;
  src: { large2x?: string; large?: string };
};

type Registry = Record<string, string>;

const REGISTRY_PATH = join(PATHS.outputDir, "_used-images.json");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastSearchAt = 0;
let searchGate = Promise.resolve();
let registryGate = Promise.resolve();

async function throttleSearch(): Promise<void> {
  const run = async () => {
    const wait = 1100 - (Date.now() - lastSearchAt);
    if (wait > 0) await sleep(wait);
    lastSearchAt = Date.now();
  };
  const next = searchGate.then(run, run);
  searchGate = next.then(
    () => undefined,
    () => undefined,
  );
  await next;
}

function loadRegistry(): Registry {
  if (!existsSync(REGISTRY_PATH)) return {};
  try {
    return JSON.parse(readFileSync(REGISTRY_PATH, "utf8")) as Registry;
  } catch {
    return {};
  }
}

function saveRegistry(registry: Registry): void {
  mkdirSync(PATHS.outputDir, { recursive: true });
  writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

async function withRegistry<T>(fn: (registry: Registry) => T | Promise<T>): Promise<T> {
  let result!: T;
  const run = async () => {
    const registry = loadRegistry();
    result = await fn(registry);
    saveRegistry(registry);
  };
  const next = registryGate.then(run, run);
  registryGate = next.then(
    () => undefined,
    () => undefined,
  );
  await next;
  return result;
}

export async function releaseSlugImages(slug: string): Promise<void> {
  await withRegistry((registry) => {
    for (const [id, owner] of Object.entries(registry)) {
      if (owner === slug) delete registry[id];
    }
  });
}

function blockedIds(registry: Registry, extra: Set<number>, slug: string): Set<number> {
  const blocked = new Set(extra);
  for (const [id, owner] of Object.entries(registry)) {
    if (owner !== slug) blocked.add(Number(id));
  }
  return blocked;
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !WEAK.has(word));
}

function searchPhrase(alt: string): string {
  return alt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !STOP.has(word))
    .slice(0, 8)
    .join(" ")
    .trim();
}

export function inferSubjectKind(
  slug: string,
  primaryKeyword?: string,
  category?: string,
  alt?: string,
): SubjectKind {
  const hay = `${slug} ${primaryKeyword ?? ""} ${category ?? ""} ${alt ?? ""}`.toLowerCase();
  if (/hotel|westin|edition|marriott|lodging|waterside|pearl/.test(hay)) return "hotel";
  if (/ulele|steak|deli|gourmet|yummy|yard-house|yard house|brazil|restaurant|food|dining|cafe|menu/.test(hay)) {
    return "restaurant";
  }
  if (/theatre|theater|movie palace|straz|tbpac/.test(hay)) return "theater";
  if (/zach-bryan|concert|festival|lightning|bucs|weekend/.test(hay)) return "event";
  if (/golf|tpc|topgolf|top-golf/.test(hay)) return "golf";
  if (/trampoline/.test(hay)) return "trampoline";
  if (/zoo|zootampa|manatee/.test(hay)) return "zoo";
  if (/ybor|neighborhood|hyde.?park/.test(hay)) return "neighborhood";
  if (/naples|highway|i-75|drive/.test(hay)) return "road";
  if (/zip|time-zone|time zone|what-is-time|what-time|practical/.test(hay)) return "practical";
  if (/riverwalk|bayshore|outdoors|beach|park/.test(hay)) return "outdoors";
  return "attraction";
}

export function imageQueries(
  alt: string,
  primaryKeyword?: string,
  category?: string,
  slug = "",
): { queries: string[]; lastResort: string } {
  const phrase = searchPhrase(alt);
  const keyword = primaryKeyword?.trim().toLowerCase();
  const kind = inferSubjectKind(slug, primaryKeyword, category, alt);
  const related = KIND_RELATED[kind];
  const queries: string[] = [];
  if (phrase) queries.push(phrase);
  if (keyword && keyword !== phrase) queries.push(keyword);
  if (phrase && !phrase.includes("tampa")) queries.push(`${phrase} tampa`.trim());
  queries.push(...related.withCity);
  queries.push(...related.typeOnly);
  return { queries: [...new Set(queries.filter(Boolean))], lastResort: LAST_RESORT };
}

function isPhotoRelevant(photoAlt: string | null | undefined, query: string, kind: SubjectKind, fallback: boolean): boolean {
  const photoTokens = tokens(photoAlt ?? "");
  if (photoTokens.length === 0) return !fallback;
  const needed = fallback ? KIND_RELATED[kind].words : [...new Set([...tokens(query), ...KIND_RELATED[kind].words])];
  if (needed.length === 0) return true;
  return needed.some(
    (word) => photoTokens.includes(word) || photoTokens.some((token) => token.includes(word) || word.includes(token)),
  );
}

async function searchPage(query: string, page: number): Promise<Photo[]> {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", "30");
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", "large");

  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      headers: { Authorization: pexelsApiKey() },
    });
    if (response.status === 429) {
      const wait = Number(response.headers.get("retry-after") ?? 5) * 1000;
      await sleep(Number.isFinite(wait) ? wait : 5000 * (attempt + 1));
      continue;
    }
    if (!response.ok) throw new Error(`Pexels search failed (${response.status})`);
    const data = (await response.json()) as { photos?: Photo[] };
    return data.photos ?? [];
  }
  return [];
}

async function pickPhoto(
  queries: string[],
  lastResort: string,
  slug: string,
  kind: SubjectKind,
  localUsed: Set<number>,
): Promise<{ photo: Photo; query: string; fallback: boolean } | null> {
  const tryQueries = [...queries, lastResort];
  for (const query of tryQueries) {
    const fallback = query === lastResort;
    for (const page of [1, 2]) {
      await throttleSearch();
      const photos = await searchPage(query, page);
      const claimed = await withRegistry((registry) => {
        const blocked = blockedIds(registry, localUsed, slug);
        const photo = photos.find(
          (item) =>
            !blocked.has(item.id) &&
            (item.src.large2x || item.src.large) &&
            isPhotoRelevant(item.alt, query, kind, fallback),
        );
        if (photo) registry[String(photo.id)] = slug;
        return photo ?? null;
      });
      if (claimed) {
        if (fallback) {
          console.warn(`Last-resort Tampa query for ${slug} (query="${query}")`);
        }
        return { photo: claimed, query, fallback };
      }
    }
  }
  return null;
}

export async function replacePlaceholders(
  article: string,
  options: { downloadDir?: string; slug: string; primaryKeyword?: string; category?: string },
): Promise<{ article: string; images: PexelsImage[]; leftover: string[] }> {
  const matches = [...article.matchAll(/\[IMAGE:\s*([^\]]+)\]/gi)];
  const images: PexelsImage[] = [];
  const leftover: string[] = [];
  const usedIds = new Set<number>();
  let next = article;
  let index = 0;

  await releaseSlugImages(options.slug);

  for (const match of matches) {
    const full = match[0];
    const alt = match[1].trim();
    const kind = inferSubjectKind(options.slug, options.primaryKeyword, options.category, alt);
    const { queries, lastResort } = imageQueries(alt, options.primaryKeyword, options.category, options.slug);
    const chosen = await pickPhoto(queries, lastResort, options.slug, kind, usedIds);
    if (!chosen) {
      leftover.push(alt);
      images.push({ placeholder: full, alt, query: queries[0] ?? alt, skipped: "no unused relevant Pexels result" });
      continue;
    }
    usedIds.add(chosen.photo.id);
    const imageUrl = chosen.photo.src.large2x || chosen.photo.src.large;
    if (!imageUrl) {
      leftover.push(alt);
      images.push({ placeholder: full, alt, query: chosen.query, skipped: "missing src.large2x" });
      continue;
    }
    const markdown = `![${alt}](${imageUrl})\n*Photo by [${chosen.photo.photographer}](${chosen.photo.photographer_url}) on [Pexels](${chosen.photo.url})*`;
    next = next.replace(full, markdown);
    index += 1;
    const record: PexelsImage = {
      placeholder: full,
      alt,
      query: chosen.query,
      id: chosen.photo.id,
      url: imageUrl,
      photographer: chosen.photo.photographer,
      photographerUrl: chosen.photo.photographer_url,
      photoUrl: chosen.photo.url,
      pexelsAlt: chosen.photo.alt ?? undefined,
      fallback: chosen.fallback || undefined,
    };
    if (options.downloadDir) {
      mkdirSync(options.downloadDir, { recursive: true });
      const fileRes = await fetch(imageUrl);
      if (fileRes.ok) {
        const buffer = Buffer.from(await fileRes.arrayBuffer());
        writeFileSync(join(options.downloadDir, `${options.slug}-${index}.jpg`), buffer);
      }
    }
    images.push(record);
  }

  return { article: next, images, leftover };
}
