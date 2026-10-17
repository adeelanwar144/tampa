import type { ArticleType } from "./article-type";
import type { CheckResult, ParsedArticle, PlannerRow } from "./types";

const LEAKS = [
  "my notes",
  "the notes",
  "i noted",
  "according to",
  "i searched",
  "i googled",
  "the website says",
  "the page says",
  "sources",
  "i couldn't find",
  "i couldn't verify",
  "i won't guess",
  "i'm not inventing",
  "which ones clash",
];

const BANNED = [
  "nestled",
  "hidden gem",
  "vibrant tapestry",
  "bustling",
  "must-visit destination",
  "look no further",
  "embark on",
  "delve into",
  "elevate your",
  "in conclusion",
  "in today's world",
  "unforgettable experience",
];

const EMOJI_RE = /\p{Extended_Pictographic}/gu;

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function firstHeading(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? "";
}

function numberedH2s(markdown: string): string[] {
  return [...markdown.matchAll(/^##\s+\d+\.\s+.+$/gm)].map((match) => match[0]);
}

function faqSection(markdown: string): string {
  const match = markdown.match(/^##\s+.*faq.*$/im);
  if (!match || match.index == null) return "";
  const rest = markdown.slice(match.index);
  const next = rest.slice(match[0].length).search(/^##\s+/m);
  return next === -1 ? rest : rest.slice(0, match[0].length + next);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasSection(markdown: string, title: string): boolean {
  return new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`, "im").test(markdown);
}

function hasSectionPrefix(markdown: string, prefix: string): boolean {
  return new RegExp(`^##\\s+${escapeRegExp(prefix)}`, "im").test(markdown);
}

function usesNumberedList(type: ArticleType): boolean {
  return (
    type === "things-to-do" ||
    type === "weekend-events" ||
    type === "attraction" ||
    type === "road-trip"
  );
}

function wordCountBand(type: ArticleType): { floor: number; min: number; max: number } {
  switch (type) {
    case "things-to-do":
      return { floor: 1200, min: 3000, max: 4500 };
    case "practical-guide":
      return { floor: 1200, min: 1200, max: 2500 };
    default:
      return { floor: 1200, min: 2000, max: 3500 };
  }
}

function countEmoji(text: string): number {
  return text.match(EMOJI_RE)?.length ?? 0;
}

function includesInsensitive(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function keywordCloseMatch(title: string, keyword: string): boolean {
  if (includesInsensitive(title, keyword)) return true;
  const hay = title.toLowerCase();
  const words = keyword
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !["the", "and", "for"].includes(word));
  return words.length > 0 && words.every((word) => hay.includes(word));
}

const TITLE_BANNED = [
  "which ones clash",
  "what the schedule says",
  "what the sources say",
  "according to",
];

function titleFitsType(title: string, type: ArticleType, slug: string): boolean {
  if (slug === "tbpac-tampa") return /straz/i.test(title) && /honest guide/i.test(title);
  if (slug === "tpc-tampa") return /^playing\b/i.test(title) && /honest guide/i.test(title);
  switch (type) {
    case "things-to-do":
      return /\bmy\b/i.test(title) && /favorite things to do/i.test(title);
    case "weekend-events":
      return /this weekend/i.test(title) && /my favorite/i.test(title);
    case "attraction":
      return /^(visiting|playing)\b/i.test(title) && /honest guide/i.test(title);
    case "restaurant":
      return /honest guide/i.test(title);
    case "hotel":
      return /^staying at\b/i.test(title) && /honest guide/i.test(title);
    case "event":
      return /my guide/i.test(title);
    case "practical-guide":
      return /my (simple|quick) guide/i.test(title);
    case "road-trip":
      return /road trip guide/i.test(title);
  }
}

function skippedKeywords(editorNotes: string): Set<string> {
  return new Set(
    editorNotes
      .split(/\n/)
      .flatMap((line) => line.replace(/^[-*]\s*/, "").split(/[;,]/))
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean),
  );
}

function extractFacts(text: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /\(\d{3}\)\s*\d{3}-\d{4}/g,
    /\b\d{3}-\d{3}-\d{4}\b/g,
    /\b\d{5}\b/g,
    /\b(?:19|20)\d{2}\b/g,
    /\b\d{1,2}:\d{2}\s*(?:a\.m\.|p\.m\.|am|pm)\b/gi,
    /\b\d{2,5}\s+(?:N|S|E|W|North|South|East|West)\.?\s+[A-Z][A-Za-z0-9.'-]+/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.match(pattern) ?? []) found.add(match);
  }
  return [...found];
}

export function runChecks(parsed: ParsedArticle, row: PlannerRow, notes: string): CheckResult[] {
  const article = parsed.article;
  const h1 = firstHeading(article);
  const numbered = numberedH2s(article);
  const faq = faqSection(article);
  const intro = article.split(/^##\s+/m)[0] ?? "";
  const firstHundred = words(intro.replace(/^#\s+.+$/m, "")).slice(0, 100).join(" ");
  const skipped = skippedKeywords(parsed.editorNotes);
  const results: CheckResult[] = [];

  const add = (name: string, ok: boolean, detail: string, warnOnly = false) => {
    results.push({ name, ok, detail, warnOnly });
  };

  add("slug", parsed.seo.slug.replace(/^\/+|\/+$/g, "") === row.slug, `seo.slug=${parsed.seo.slug}`);

  const titleNumber = h1.match(/(\d+)/)?.[1];
  add(
    "title number",
    !titleNumber || Number(titleNumber) === numbered.length,
    `H1 number=${titleNumber ?? "none"}, numbered H2s=${numbered.length}`,
  );

  const titleLen = h1.length;
  add("title length", titleLen > 0 && titleLen <= 70, `${titleLen} characters (max 70)`);
  add("title length target", titleLen > 0 && titleLen <= 65, `${titleLen} characters (aim ≤65)`, true);

  const titleBannedHits = TITLE_BANNED.filter((phrase) => includesInsensitive(h1, phrase));
  const startsBanned =
    /^things going on\b/i.test(h1) || /^\d+\s+things to know before\b/i.test(h1);
  add(
    "title wording",
    titleBannedHits.length === 0 && !startsBanned,
    titleBannedHits.join(", ") || (startsBanned ? "banned opening" : "clean"),
  );
  add(
    "title format",
    titleFitsType(h1, row.articleType, row.slug),
    `type=${row.articleType} title="${h1}"`,
  );

  const kw = row.primaryKeyword;
  const kwInH1 = keywordCloseMatch(h1, kw);
  const kwInFaq = includesInsensitive(faq, kw);
  const kwInH2 = numbered.some((heading) => includesInsensitive(heading, kw)) ||
    [...article.matchAll(/^##\s+(.+)$/gm)].some((match) => includesInsensitive(match[1], kw));
  const h2Required = row.articleType !== "practical-guide";
  add(
    "keyword placement",
    kwInH1 && includesInsensitive(firstHundred, kw) && (kwInH2 || !h2Required) && kwInFaq,
    `h1=${kwInH1} opening=${includesInsensitive(firstHundred, kw)} h2=${kwInH2} faq=${kwInFaq}`,
  );

  if (row.slug === "tbpac-tampa") {
    add(
      "straz / tbpac mentions",
      /straz/i.test(h1) && /tbpac/i.test(intro) && /tbpac/i.test(faq),
      "H1 needs Straz; intro and FAQ need TBPAC",
    );
  }

  const missingLsi = row.lsiKeywords.filter(
    (keyword) => !includesInsensitive(article, keyword) && ![...skipped].some((skip) => skip.includes(keyword.toLowerCase())),
  );
  add("LSI coverage", missingLsi.length === 0, missingLsi.length ? `missing: ${missingLsi.join(", ")}` : "all present or skipped");

  const metaTitleLen = parsed.seo.meta_title.length;
  const descLen = parsed.seo.meta_description.length;
  add("meta title", metaTitleLen >= 50 && metaTitleLen <= 60, `${metaTitleLen} characters`);
  add("meta description", descLen >= 140 && descLen <= 160, `${descLen} characters`);

  const leakHits = LEAKS.filter((phrase) => includesInsensitive(article, phrase));
  const attribution = article.match(/\b(?:visit florida|national park service|visit tampa bay)\s+says\b/gi) ?? [];
  add("no research leaks", leakHits.length === 0 && attribution.length === 0, [...leakHits, ...attribution].join(", ") || "clean");

  const bannedHits = BANNED.filter((phrase) => includesInsensitive(article, phrase));
  add("banned phrases", bannedHits.length === 0, bannedHits.join(", ") || "none");

  const emojiTotal = countEmoji(article);
  const emojiFaq = countEmoji(faq);
  add("emoji", emojiTotal >= 3 && emojiTotal <= 6 && emojiFaq === 0, `total=${emojiTotal} faq=${emojiFaq}`);

  const bangs = (article.match(/!/g) ?? []).length;
  add("exclamation marks", bangs <= 3, `${bangs} found`);

  const faqH3 = (faq.match(/^###\s+.+\?/gm) ?? []).length;
  const wantsQuickTips = row.articleType !== "practical-guide";
  const hasUseful =
    hasSectionPrefix(article, "Useful Things to Know") ||
    (row.articleType === "restaurant" && hasSectionPrefix(article, "Tips Before You Go")) ||
    (row.articleType === "hotel" && hasSectionPrefix(article, "Tips Before You Book")) ||
    (row.articleType === "event" && hasSectionPrefix(article, "Tips for the Night"));
  add(
    "required sections",
    (!wantsQuickTips || hasSectionPrefix(article, "Short on Time")) &&
      hasUseful &&
      /faq/i.test(article) &&
      faqH3 >= 6 &&
      faqH3 <= 8 &&
      hasSection(article, "Final Thoughts"),
    `faq questions=${faqH3} useful=${hasUseful}`,
  );

  const placeholders = [...article.matchAll(/\[IMAGE:\s*([^\]]+)\]/gi)];
  const numberedExpected = numbered.length + 1;
  const imageOk = usesNumberedList(row.articleType)
    ? placeholders.length >= numberedExpected
    : placeholders.length >= 1;
  add(
    "image placeholders",
    imageOk,
    `placeholders=${placeholders.length}, expected=${usesNumberedList(row.articleType) ? `at least ${numberedExpected}` : "at least 1"}`,
  );

  const featuredAlt = placeholders[0]?.[1]?.trim() ?? "";
  add(
    "featured image subject",
    featuredAlt.length > 0 && !/skyline/i.test(featuredAlt),
    featuredAlt || "missing featured alt",
    true,
  );

  const band = wordCountBand(row.articleType);
  const count = words(article).length;
  add("word count floor", count >= band.floor, `${count} words (minimum ${band.floor.toLocaleString("en-US")})`);
  add(
    "word count",
    count >= band.min && count <= band.max,
    `${count} words (target ${band.min.toLocaleString("en-US")}–${band.max.toLocaleString("en-US")})`,
    true,
  );

  const unsupported = extractFacts(article).filter((fact) => !includesInsensitive(notes, fact));
  add(
    "fact check (numbers)",
    unsupported.length === 0,
    unsupported.length ? unsupported.slice(0, 12).join("; ") : "all numbers appear in notes",
  );

  return results;
}

export function failingChecks(results: CheckResult[]): CheckResult[] {
  return results.filter((result) => !result.ok && !result.warnOnly);
}

export function wordCount(markdown: string): number {
  return words(markdown).length;
}

export function itemCount(markdown: string): number {
  return numberedH2s(markdown).length;
}
