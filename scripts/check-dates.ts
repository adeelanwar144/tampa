/**
 * Lists published copy with a date that is already past or that ends within
 * 14 days. Run before every deploy (`npm run check-dates`, also wired into
 * `npm run deploy`). Exit 0: this is a report, not a build blocker.
 *
 * Today is the calendar date in America/New_York. Override with CHECK_DATE=YYYY-MM-DD.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { addDays, classifyEndDate, tampaToday, type DateStatus } from "../src/lib/event-dates";

const TODAY = process.env.CHECK_DATE && /^\d{4}-\d{2}-\d{2}$/.test(process.env.CHECK_DATE)
  ? process.env.CHECK_DATE
  : tampaToday();
const DEFAULT_YEAR = Number(TODAY.slice(0, 4));

const MONTH =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?";
const DAY = "(\\d{1,2})(?!\\d)(?:st|nd|rd|th)?";
const YEAR = "((?:19|20)\\d{2})";
const RANGE = "(?:\\s*(?:-|–|—|through|to)\\s*)";

const MONTH_INDEX: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
  jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

type Hit = {
  where: string;
  text: string;
  end: string | null;
  status: DateStatus;
  note: string;
};

function monthNum(raw: string): number {
  return MONTH_INDEX[raw.toLowerCase().replace(/\.$/, "")] ?? 0;
}

function iso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return null;
  return dt.toISOString().slice(0, 10);
}

function lastDay(year: number, month: number): string | null {
  return iso(year, month, new Date(Date.UTC(year, month, 0)).getUTCDate());
}

function yearFor(source: string, index: number, explicit?: string): { year: number; assumed: boolean } {
  if (explicit) return { year: Number(explicit), assumed: false };
  const before = source.slice(Math.max(0, index - 40), index);
  if (new RegExp(MONTH, "i").test(before)) return { year: DEFAULT_YEAR, assumed: true };
  const years = [...before.matchAll(/\b((?:19|20)\d{2})\b/g)];
  if (years.length) return { year: Number(years[years.length - 1][1]), assumed: false };
  return { year: DEFAULT_YEAR, assumed: true };
}

function yearNote(year: number, assumed: boolean): string {
  if (year < 2024) return "historical";
  return assumed ? `year assumed ${year}` : "";
}

function push(hits: Hit[], where: string, text: string, end: string | null, note: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return;
  if (hits.some((hit) => hit.where === where && hit.text === clean && hit.end === end)) return;
  hits.push({ where, text: clean, end, status: classifyEndDate(end, TODAY), note });
}

function scanText(where: string, text: string, hits: Hit[]) {
  const source = text.replace(/\s+/g, " ");

  const endOf = new RegExp(`\\bend of\\s+(${MONTH})\\s+${YEAR}`, "gi");
  for (const match of source.matchAll(endOf)) {
    const picked = yearFor(source, match.index ?? 0, match[2]);
    const end = lastDay(picked.year, monthNum(match[1]));
    push(hits, where, match[0], end, yearNote(picked.year, false));
  }

  const cross = new RegExp(
    `(${MONTH})\\s+${DAY}(?:,?\\s+${YEAR})?${RANGE}(${MONTH})\\s+${DAY}(?:,?\\s+${YEAR})?`,
    "gi",
  );
  for (const match of source.matchAll(cross)) {
    const picked = yearFor(source, match.index ?? 0, match[6] || match[3]);
    const end = iso(picked.year, monthNum(match[4]), Number(match[5]));
    push(hits, where, match[0], end, yearNote(picked.year, picked.assumed));
  }

  const sameMonth = new RegExp(`(${MONTH})\\s+${DAY}${RANGE}${DAY}(?:,?\\s+${YEAR})?`, "gi");
  for (const match of source.matchAll(sameMonth)) {
    const picked = yearFor(source, match.index ?? 0, match[4]);
    const end = iso(picked.year, monthNum(match[1]), Number(match[3]));
    push(hits, where, match[0], end, yearNote(picked.year, picked.assumed));
  }

  const andDays = new RegExp(`(${MONTH})\\s+${DAY}(?:,\\s+${DAY})*(?:,?\\s+and\\s+${DAY})(?:,?\\s+${YEAR})?`, "gi");
  for (const match of source.matchAll(andDays)) {
    const picked = yearFor(source, match.index ?? 0, match[5]);
    const days = [...match[0].matchAll(/\d{1,2}(?!\d)/g)].map((item) => Number(item[0])).filter((day) => day <= 31);
    const endDay = Math.max(...days);
    const end = iso(picked.year, monthNum(match[1]), endDay);
    push(hits, where, match[0], end, yearNote(picked.year, picked.assumed));
  }

  const single = new RegExp(`(${MONTH})\\s+${DAY}(?:,?\\s+${YEAR})?`, "gi");
  for (const match of source.matchAll(single)) {
    const picked = yearFor(source, match.index ?? 0, match[3]);
    const end = iso(picked.year, monthNum(match[1]), Number(match[2]));
    push(hits, where, match[0], end, yearNote(picked.year, picked.assumed));
  }

  const numeric = /(?<![\d./])(?<!\d\s)(1[0-2]|0?[1-9])\/([12]\d|3[01]|0?[1-9])(?:\/(20\d{2}))?(?![\d/])/g;
  for (const match of source.matchAll(numeric)) {
    const picked = yearFor(source, match.index ?? 0, match[3]);
    const end = iso(picked.year, Number(match[1]), Number(match[2]));
    if (!end) continue;
    push(hits, where, match[0], end, yearNote(picked.year, picked.assumed));
  }

  const relative = /\bthis (?:saturday|sunday|friday|weekend)\b/gi;
  for (const match of source.matchAll(relative)) {
    push(hits, where, match[0], null, "relative to the day the article was written");
  }
}

function articleHits(): Hit[] {
  const articles = JSON.parse(
    readFileSync(join(process.cwd(), "src/data/published-articles.json"), "utf8"),
  ) as Array<{
    slug: string;
    status: string;
    title: string;
    dek: string;
    metaTitle: string;
    metaDescription: string;
    body: string;
    eventEndDate?: string;
  }>;
  const hits: Hit[] = [];
  for (const article of articles) {
    if (article.status !== "published") continue;
    const where = article.slug;
    scanText(where, [article.title, article.dek, article.metaTitle, article.metaDescription, article.body].join("\n"), hits);
    if (article.eventEndDate) {
      push(
        hits,
        where,
        `eventEndDate ${article.eventEndDate}`,
        article.eventEndDate,
        "field on the article",
      );
    }
  }
  return hits;
}

function listingHits(): Hit[] {
  const dir = join(process.cwd(), ".listing-content-cache");
  const hits: Hit[] = [];
  let files: string[] = [];
  try {
    files = readdirSync(dir);
  } catch {
    return hits;
  }
  for (const file of files) {
    if (!file.endsWith(".json") || file.startsWith("_") || file.includes("backup")) continue;
    const raw = readFileSync(join(dir, file), "utf8");
    let text = raw;
    try {
      const data = JSON.parse(raw) as unknown;
      const parts: string[] = [];
      const walk = (value: unknown) => {
        if (typeof value === "string") parts.push(value);
        else if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === "object") Object.values(value).forEach(walk);
      };
      walk(data);
      text = parts.join("\n");
    } catch {
      text = raw;
    }
    scanText(file.replace(/\.json$/, ""), text, hits);
  }
  return hits;
}

function dropNested(hits: Hit[]): Hit[] {
  return hits.filter((hit) => {
    if (hit.note === "field on the article") return true;
    return !hits.some(
      (other) =>
        other !== hit &&
        other.where === hit.where &&
        other.note !== "historical" &&
        other.text.length > hit.text.length &&
        other.text.toLowerCase().includes(hit.text.toLowerCase()),
    );
  });
}

function interesting(hit: Hit): boolean {
  if (hit.note === "historical") return false;
  if (hit.status === "past" || hit.status === "ends-within-14-days" || hit.status === "upcoming" || hit.status === "unclear") return true;
  return false;
}

const articles = dropNested(articleHits()).filter(interesting);
const listings = dropNested(listingHits()).filter(interesting);

function line(hit: Hit): string {
  return [hit.where, hit.text, hit.end ?? "", hit.status, hit.note].join("\t");
}

console.log(`Today ${TODAY}. Within 14 days means through ${addDays(TODAY, 14)}.`);
console.log("");
console.log("page\ttext\tend\tstatus\tnote");
for (const hit of articles) console.log(line(hit));
console.log("");
console.log(`Listing hits (past, within 14 days, or unclear): ${listings.length}`);
for (const hit of listings.slice(0, 40)) console.log(line(hit));
if (listings.length > 40) console.log(`… ${listings.length - 40} more listing hits`);

const endedField = articles.filter((hit) => hit.note === "field on the article" && hit.status === "past");
console.log("");
console.log(`Articles with a past eventEndDate: ${endedField.map((hit) => hit.where).join(", ") || "none"}`);
