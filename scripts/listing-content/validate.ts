import { tierLimits } from "./travel";
import type { CheckResult, CompactListing, ModelOutput, RichnessTier } from "./types";

const BANNED = [
  "nestled",
  "hidden gem",
  "bustling",
  "vibrant",
  "tapestry",
  "must-visit",
  "look no further",
  "embark",
  "delve",
  "elevate",
  "unforgettable",
  "in conclusion",
  "something for everyone",
  "whether you're",
  "whether youre",
  "this page",
  "room types",
  "late arrival",
  "plan your route",
  "aren't covered",
  "are not covered",
];

const LEAKS = [
  "listing data",
  "the data",
  "information provided",
  "according to",
  "based on the data",
  "on file",
  "data on file",
  "the listing includes",
  "the website says",
  "the website notes",
  "the website describes",
  "the website lists",
  "the site lists",
  "the site says",
  "hours are only available",
    "also lists",
    "the website lists",
    "the site lists",
    "on the hotel's website",
    "on the cafe's site",
];

const EMOJI_RE = /\p{Extended_Pictographic}/gu;

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function normalizeForKeyword(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesNormalized(haystack: string, needle: string): boolean {
  const h = normalizeForKeyword(haystack);
  const n = normalizeForKeyword(needle);
  if (!n) return false;
  if (h.includes(n)) return true;
  return false;
}

function keywordInText(haystack: string, keyword: string, city?: string): boolean {
  if (includesNormalized(haystack, keyword)) return true;
  if (!city) return false;
  const namePart = normalizeForKeyword(keyword.replace(new RegExp(`\\s+${city}\\s*$`, "i"), ""));
  const hay = normalizeForKeyword(haystack);
  return Boolean(namePart) && hay.includes(namePart) && hay.includes(normalizeForKeyword(city));
}

function includesInsensitive(haystack: string, needle: string): boolean {
  const h = normalizeForKeyword(haystack);
  const n = normalizeForKeyword(needle);
  if (!n) return false;
  if (n.includes(" ")) return h.includes(n);
  return ` ${h} `.includes(` ${n} `);
}

function outputText(output: ModelOutput): string {
  const faq = output.faq.map((item) => `${item.q} ${item.a}`).join(" ");
  return `${output.metaTitle}\n${output.metaDescription}\n${output.content}\n${faq}`;
}

function bodyText(output: ModelOutput): string {
  const faq = output.faq.map((item) => `${item.q} ${item.a}`).join(" ");
  return `${output.content}\n${faq}`;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let from = 0;
  while (from <= haystack.length - needle.length) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    count += 1;
    from = at + needle.length;
  }
  return count;
}

function countPhoneMentions(text: string, phone: string | undefined): number {
  if (!phone) return 0;
  const digits = digitsOnly(phone);
  if (digits.length < 10) return 0;
  const needle = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits.slice(-10);
  return countOccurrences(digitsOnly(text), needle);
}

function countAddressMentions(text: string, address: string | undefined): number {
  if (!address?.trim()) return 0;
  return countOccurrences(normalizeForKeyword(text), normalizeForKeyword(address));
}

function countListed(text: string): number {
  return (normalizeForKeyword(text).match(/\b(?:is listed|listed as|listed at|listed in|listed open|listed online)\b/g) ?? []).length;
}

function sourceTalkHits(text: string): string[] {
  const hits: string[] = [];
  const patterns = [
    /\b(?:the )?(?:website|site|page|cafe|hotel|listing)(?:'s)? (?:says|notes|lists|mentions)\b/gi,
    /\bthe website describes\b/gi,
    /\bthe site lists\b/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.match(pattern) ?? []) hits.push(match.toLowerCase());
  }
  return [...new Set(hits)];
}

function lookingForOpener(text: string): boolean {
  return /(?:^|[.!?]\s+|[-–—]\s+)looking for a\b/im.test(text.trim());
}

function lookingOrSearching(text: string): boolean {
  return /\bif you(?:['’]re| are) (?:looking|searching) for\b/i.test(text);
}

function countPhrase(text: string, phrase: string): number {
  return countOccurrences(normalizeForKeyword(text), normalizeForKeyword(phrase));
}

function countWordBounded(text: string, word: string): number {
  const h = normalizeForKeyword(text);
  const w = normalizeForKeyword(word);
  if (!w) return 0;
  return (h.match(new RegExp(`(?:^| )${w}(?: |$)`, "g")) ?? []).length;
}

function withoutName(text: string, name: string): string {
  return normalizeForKeyword(text).replaceAll(normalizeForKeyword(name), " ");
}

function websiteHost(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return undefined;
  }
}

export function parseModelJson(raw: string): ModelOutput | { error: string } {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) return { error: "No JSON object in the response" };
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as Partial<ModelOutput>;
    if (!parsed.metaTitle || !parsed.metaDescription || typeof parsed.content !== "string") {
      return { error: "JSON is missing metaTitle, metaDescription, or content" };
    }
    return {
      metaTitle: String(parsed.metaTitle),
      metaDescription: String(parsed.metaDescription),
      content: parsed.content,
      faq: Array.isArray(parsed.faq)
        ? parsed.faq
            .filter((item) => item && typeof item.q === "string" && typeof item.a === "string")
            .map((item) => ({ q: item.q, a: item.a }))
        : [],
    };
  } catch {
    return { error: "JSON did not parse" };
  }
}

export function trimAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const sliced = text.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trim();
}

function stripPhone(text: string): string {
  return text
    .replace(/\s*Call \(\d{3}\) \d{3}-\d{4}[^.?!]*[.?!]/gi, ".")
    .replace(/\(\d{3}\)\s*\d{3}-\d{4}/g, "")
    .replace(/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

export function applyTinyFixes(output: ModelOutput, listing?: CompactListing): ModelOutput {
  let content = output.content.replace(/^#\s+.+\n+/m, "").trim();
  content = content
    .replace(/\blisted online\b/gi, "on the menu")
    .replace(/\bis listed as\b/gi, "is")
    .replace(/\bcrowd-favorite\b/gi, "popular")
    .replace(/\bhours are best confirmed\b/gi, "hours should be confirmed")
    .replace(/\bon a busy morning\b/gi, "in the morning")
    .replace(/\bthe kitchen notes that\b/gi, "")
    .replace(/\balso lists\b/gi, "has")
    .replace(/(?:^|[.!?]\s+)If you(?:['’]re| are) (?:looking|searching) for[^.!?]*[.!?]/gim, " ");
  let faq = output.faq;
  if (listing?.subcategory) {
    const nsub = normalizeForKeyword(listing.subcategory);
    if (nsub && !/^(restaurant|bar|cafe|hotel|store|shop)$/.test(nsub)) {
      const head = nsub.split(" ").at(-1) ?? nsub;
      const labeled = new RegExp(`\\bis an? ${nsub}\\b`, "gi");
      content = content.replace(labeled, `is a ${head}`);
      faq = faq.map((item) => ({
        ...item,
        q: item.q.replace(labeled, `is a ${head}`),
        a: item.a.replace(labeled, `is a ${head}`),
      }));
    }
  }
  let next: ModelOutput = { ...output, content, faq };
  if (listing?.phone) {
    for (let i = 0; i < 6 && countPhoneMentions(bodyText(next), listing.phone) > 2; i += 1) {
      const faqHit = next.faq.findIndex((item) => countPhoneMentions(`${item.q} ${item.a}`, listing.phone) > 0);
      if (faqHit >= 0) {
        const copy = [...next.faq];
        copy[faqHit] = { ...copy[faqHit], a: stripPhone(copy[faqHit].a) };
        next = { ...next, faq: copy };
        continue;
      }
      next = { ...next, content: stripPhone(next.content) };
    }
  }
  let metaTitle = next.metaTitle.trim();
  let metaDescription = next.metaDescription.trim();
  if (metaTitle.length > 60) metaTitle = trimAtWord(metaTitle, 60);
  if (metaDescription.length > 160) metaDescription = trimAtWord(metaDescription, 160);
  return { ...next, metaTitle, metaDescription };
}

function extractFacts(text: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /\(\d{3}\)\s*\d{3}-\d{4}/g,
    /\b\d{3}-\d{3}-\d{4}\b/g,
    /\b\d{5}\b/g,
    /\b(?:19|20)\d{2}\b/g,
    /\b\d{1,2}:\d{2}\s*(?:a\.m\.|p\.m\.|am|pm)\b/gi,
    /\$\d+(?:\.\d{2})?/g,
    /\b\d{2,5}\s+(?:N|S|E|W|North|South|East|West)\.?\s+[A-Z][A-Za-z0-9.'-]+/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.match(pattern) ?? []) found.add(match);
  }
  return [...found];
}

export function runChecks(
  output: ModelOutput,
  listing: CompactListing,
  primaryKeyword: string,
  listingJson: string,
  tier: Exclude<RichnessTier, "thin"> = "rich",
): CheckResult[] {
  const results: CheckResult[] = [];
  const add = (name: string, ok: boolean, detail: string, autoFixed = false) => {
    results.push({ name, ok, detail, autoFixed });
  };
  const limits = tierLimits(tier);

  const count = words(output.content).length;
  add("word count", count >= limits.minWords && count <= limits.maxWords, `${count} words (${tier} ${limits.minWords}-${limits.maxWords})`);

  const h1 = (output.content.match(/^#\s+/gm) ?? []).length;
  const h3 = (output.content.match(/^###\s+/gm) ?? []).length;
  const h2s = [...output.content.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1]);
  add(
    "headings",
    h1 === 0 && h3 === 0 && h2s.length === limits.headings,
    `h1=${h1} h2=${h2s.length} h3=${h3} (need ${limits.headings})`,
  );

  const intro = output.content.split(/^##\s+/m)[0] ?? "";
  const firstHundred = words(intro).slice(0, 100).join(" ");
  const keywordInIntro = keywordInText(firstHundred, primaryKeyword, listing.city);
  const keywordInH2 = h2s.some((heading) => keywordInText(heading, primaryKeyword, listing.city));
  add("keyword", keywordInIntro && keywordInH2, `intro=${keywordInIntro} h2=${keywordInH2}`);

  add(
    "meta title",
    output.metaTitle.length >= 45 && output.metaTitle.length <= 65,
    `${output.metaTitle.length} characters`,
  );
  add(
    "meta description",
    output.metaDescription.length >= 120 && output.metaDescription.length <= 170,
    `${output.metaDescription.length} characters`,
  );

  const all = outputText(output);
  const bannedHits = BANNED.filter((phrase) => includesInsensitive(all, phrase));
  if (lookingForOpener(all) || lookingOrSearching(all)) bannedHits.push("looking/searching for");
  add("banned phrases", bannedHits.length === 0, bannedHits.join(", ") || "none");

  const leakHits = [...LEAKS.filter((phrase) => includesInsensitive(all, phrase)), ...sourceTalkHits(all)];
  add("no leaks", leakHits.length === 0, [...new Set(leakHits)].join(", ") || "clean");

  const listedCount = countListed(all);
  add("listed wording", listedCount === 0, `${listedCount} mention(s)`);

  const body = bodyText(output);
  const phoneCount = countPhoneMentions(body, listing.phone);
  add("phone mentions", phoneCount <= 2, `${phoneCount} mention(s)`);

  const addressCount = countAddressMentions(body, listing.address);
  add("address mentions", addressCount <= 2, `${addressCount} mention(s)`);

  const host = websiteHost(listing.website);
  const websiteCount = host ? countPhrase(body, host) : 0;
  add("website mentions", websiteCount <= 2, `${websiteCount} mention(s)`);

  const categoryPhrase = listing.subcategory || listing.categoryLabel;
  const genericCategory = /^(restaurant|bar|cafe|hotel|motel|store|shop|park|beach)$/i.test(
    normalizeForKeyword(categoryPhrase),
  );
  const categoryCount = genericCategory ? 0 : countPhrase(body, categoryPhrase);
  add("category mentions", categoryCount <= 3, `${categoryCount} mention(s) of ${categoryPhrase}`);
  const categoryLabeling = /\b(categor(?:y|ized)|falls under|grouped under|food and drink category)\b/i.test(body);
  const nsub = listing.subcategory ? normalizeForKeyword(listing.subcategory) : "";
  const nname = normalizeForKeyword(listing.name);
  const genericType = /^(restaurant|bar|cafe|hotel|motel|store|shop|park|beach)$/.test(nsub);
  const typeInName = Boolean(nsub) && nsub.split(" ").every((word) => nname.includes(word));
  const asLabel =
    Boolean(nsub) &&
    !genericType &&
    !typeInName &&
    new RegExp(`\\bis an? ${nsub}\\b`).test(normalizeForKeyword(body));
  add("no category label", !categoryLabeling && !asLabel, asLabel || categoryLabeling ? "uses category as a label" : "clean");

  const describes = countPhrase(all, "describes itself as");
  add("describes itself", describes <= 1, `${describes} mention(s)`);

  const stripped = withoutName(all, listing.name)
    .replace(/\bbest western\b/g, " ")
    .replace(/\bbest confirmed\b/g, " ")
    .replace(/\bbest to\b/g, " ")
    .replace(/\bbest idea\b/g, " ");
  const superlatives = ["favorite", "best", "top"].filter((word) => countWordBounded(stripped, word) > 0);
  add("no superlatives", superlatives.length === 0, superlatives.join(", ") || "none");

  const contactRef =
    /\b((see|listed)\s+(below|above)|(phone|address|hours|contact)[^.\n]{0,24}\b(below|above)|(below|above)[^.\n]{0,24}\b(phone|address|hours|contact))\b/i.test(
      all,
    );
  add("no below/above contact", !contactRef, contactRef ? "points to below/above" : "clean");

  const unsupported = extractFacts(output.content).filter((fact) => !includesInsensitive(listingJson, fact));
  add(
    "invented numbers",
    unsupported.length === 0,
    unsupported.length ? unsupported.slice(0, 8).join("; ") : "all numbers appear in listing data",
  );

  const inferred = [
    "south side",
    "north side",
    "east side",
    "west side",
    "front desk",
    "classic dishes",
    "comfort dishes",
    "corridor",
    "morning crowd",
    "special occasion",
    "late-night",
    "late night",
    "friends or family",
    "holidays",
    "reservation",
    "book rooms",
    "room rates",
    "busy street",
    "busy road",
  ].filter((phrase) => includesInsensitive(all, phrase) && !includesInsensitive(listingJson, phrase));
  add("invented claims", inferred.length === 0, inferred.join(", ") || "none");

  const emoji = output.content.match(EMOJI_RE)?.length ?? 0;
  add("emoji", emoji === 0, `${emoji} found`);

  add("json", true, `faq=${output.faq.length}`);
  add("name present", includesInsensitive(output.content, listing.name), listing.name);

  return results;
}

export function failingChecks(results: CheckResult[]): CheckResult[] {
  return results.filter((result) => !result.ok);
}

export function headingCount(markdown: string): number {
  return (markdown.match(/^##\s+/gm) ?? []).length;
}

export function wordCount(markdown: string): number {
  return words(markdown).length;
}
