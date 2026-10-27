import type { ListingContentRecord } from "./types";

export const AUDIT_SYSTEM = `You fact-check listing copy against LISTING DATA and BUSINESS WEBSITE TEXT.

A claim is supported if its meaning appears in either source, even if the wording differs, HTML is messy, or several source facts are combined in one sentence. Restating the name, address, phone, website, hours, dishes, drinks, prices, amenities, rooms, events, FAQs or features from either source is supported.

Do not flag:
- paraphrases of source text
- light visit advice (call ahead, confirm hours, tables can fill up) when the source mentions reservations, hours, or busy times
- opinions with no new concrete fact ("the main draw", "a good choice")
- FAQ answers that restate source FAQs

Only list a sentence if it adds a concrete place, neighborhood, distance, dish, amenity, price, history or event that is in NEITHER LISTING DATA NOR BUSINESS WEBSITE TEXT.

Return JSON only: {"unsupported": ["exact sentence", ...]}
Return an empty list if everything is supported.`;

export function auditUserMessage(
  listingJson: string,
  websiteText: string | undefined,
  record: Pick<ListingContentRecord, "metaTitle" | "metaDescription" | "contentMarkdown" | "faq">,
): string {
  const faq = record.faq.map((item) => `Q: ${item.q}\nA: ${item.a}`).join("\n");
  return `LISTING DATA:
${listingJson}

BUSINESS WEBSITE TEXT:
${websiteText?.trim() || "none"}

CONTENT:
${record.metaTitle}
${record.metaDescription}

${record.contentMarkdown}

${faq}`.trim();
}

export function parseUnsupported(raw: string | undefined, error?: string): string[] {
  if (error || !raw) return [error ?? "empty audit result"];
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) return ["audit JSON did not parse"];
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as { unsupported?: unknown };
    if (!Array.isArray(parsed.unsupported)) return ["audit JSON missing unsupported array"];
    return parsed.unsupported.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return ["audit JSON did not parse"];
  }
}

const STOP = new Set([
  "this",
  "that",
  "with",
  "from",
  "your",
  "have",
  "will",
  "they",
  "them",
  "then",
  "than",
  "when",
  "what",
  "which",
  "while",
  "about",
  "into",
  "over",
  "also",
  "just",
  "more",
  "most",
  "some",
  "such",
  "only",
  "other",
  "another",
  "there",
  "their",
  "here",
  "been",
  "being",
  "were",
  "was",
  "are",
  "and",
  "the",
  "for",
  "you",
  "can",
  "visit",
  "find",
  "make",
  "including",
]);

function normalizeAudit(text: string): string {
  return text
    .toLowerCase()
    .replace(/&(?:amp|rsquo|lsquo|rdquo|ldquo|mdash|ndash|#\d+|[a-z]+);/g, " ")
    .replace(/[^a-z0-9$]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function factTokens(text: string): string[] {
  return normalizeAudit(text)
    .split(" ")
    .filter((token) => (token.length >= 4 && !STOP.has(token)) || /[0-9]/.test(token) || token.startsWith("$"));
}

export function claimIsSupported(claim: string, listingJson: string, websiteText?: string): boolean {
  const corpus = normalizeAudit(`${listingJson}\n${websiteText ?? ""}`);
  const normalized = normalizeAudit(claim);
  if (!normalized) return true;
  if (corpus.includes(normalized)) return true;
  const hourTalk = /\b(hours?|open|closed?|weekday|weekend|a m|p m)\b/.test(normalized);
  const times = normalized.match(/\b\d{1,2}(?: \d{2})? (?:a m|p m)\b/g) ?? [];
  if (hourTalk && /\b(hours?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|open)\b/.test(corpus)) {
    if (times.every((time) => corpus.includes(time))) return true;
  }
  const tokens = factTokens(claim);
  if (tokens.length === 0) return true;
  const hits = tokens.filter((token) => corpus.includes(token));
  return hits.length / tokens.length >= 0.6;
}

export function filterUnsupported(claims: string[], listingJson: string, websiteText?: string): string[] {
  return claims.filter((claim) => !claimIsSupported(claim, listingJson, websiteText));
}

const GAP_CONCRETE =
  /\b(bridges?|corridor|plaza|congested|crowded|residential|commercial district|commercial area|west side|east side|north side|south side|eastern|western|northern|southern|busy street|busy road|busy corridor|fills?(?:\s+up)?|lunch hour|on file|awards?|founded|owners?|chefs?|\$\s?\d|atmosphere|cozy|upscale|historic|family-owned|valet|free parking|parking lot)\b/i;

/** Gap essays may give general advice. Keep a fact-check flag only when the sentence adds a concrete claim. */
export function keepGapFlag(claim: string): boolean {
  if (/\b\d{1,2}:\d{2}\b|\b\d{1,2}\s*(?:a\.m\.|p\.m\.)\b|\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(claim)) {
    return true;
  }
  if (GAP_CONCRETE.test(claim)) return true;
  if (/\bother businesses in\b/i.test(claim)) return true;
  if (/\b(offers?|serves?|specializes?|has been|since \d{4}|rated|reviews?|walk-ins are)\b/i.test(claim) && !/\b(ask|asking|question)\b/i.test(claim)) {
    return true;
  }
  return false;
}
