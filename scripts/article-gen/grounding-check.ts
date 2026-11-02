import { extractClaimTokens, normalizeToken, type FactPack } from "./fact-pack";

const BANNED_PHRASES = [
  "inventing",
  "willing to",
  "not guessing",
  "hidden gem",
  "nestled",
  "vibrant",
  "whether you're",
  "whether you are",
  "i am not inventing",
  "not willing to quote",
  "my training",
  "as an ai",
];

export type GroundingIssue = {
  token: string;
  context: string;
};

export type GroundingResult = {
  ok: boolean;
  ungrounded: GroundingIssue[];
  bannedHits: string[];
  wordCount: number;
  metaLength: number;
  titleLength: number;
};

/** Match 6:20 a.m. ↔ 06:20 a.m. and am/a.m. variants. */
function timeVariants(n: string): string[] {
  const out = new Set<string>([n]);
  const m = n.match(/^0?(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)$/i);
  if (m) {
    const hour = m[1];
    const min = m[2];
    const ap = m[3].replace(/\./g, "").toLowerCase(); // am / pm
    const apDot = `${ap[0]}.m.`;
    for (const h of [hour, hour.padStart(2, "0")]) {
      out.add(`${h}:${min} ${ap}`);
      out.add(`${h}:${min} ${apDot}`);
      out.add(`${Number(h)}:${min} ${ap}`);
      out.add(`${Number(h)}:${min} ${apDot}`);
    }
  }
  return [...out];
}

function contextAround(text: string, raw: string): string {
  const idx = text.toLowerCase().indexOf(raw.toLowerCase());
  if (idx < 0) return raw;
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + raw.length + 40);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

/**
 * Flag any number, price, date, or time in the article that is not present
 * (as a normalized token) in the note or the fact pack.
 */
export function checkGrounding(
  articleMarkdown: string,
  noteText: string,
  pack: FactPack,
  metaDescription = "",
  title = "",
  extraAllowedText = "",
): GroundingResult {
  const dateSeeds = [
    pack.checkedAt,
    extraAllowedText,
    // Common "Last updated" renderings of pack.checkedAt (YYYY-MM-DD)
    ...(pack.checkedAt.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      ? (() => {
          const [, y, m, d] = pack.checkedAt.match(/^(\d{4})-(\d{2})-(\d{2})$/)!;
          const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          const month = months[Number(m) - 1];
          const day = String(Number(d));
          return [
            `${month} ${day}, ${y}`,
            `${month} ${day} ${y}`,
            `${month} ${d}, ${y}`,
            y,
            String(Number(d)),
            d,
          ];
        })()
      : []),
  ].join("\n");

  const allowed = new Set(
    [
      ...extractClaimTokens(noteText),
      ...extractClaimTokens(pack.facts.map((f) => `${f.claim} ${f.value}`).join("\n")),
      ...extractClaimTokens(dateSeeds),
      ...(pack.allowedTokens ?? []).map(normalizeToken),
      ...extractClaimTokens(extraAllowedText),
    ].map(normalizeToken),
  );

  // Always allow trivial structural numbers that appear in FAQ/H2 counts? No — user asked for any number.
  // Allow year in "Last updated: November 2, 2026" style if 2026 is in pack/note — usually is.

  const articleTokens = extractClaimTokens(articleMarkdown);
  const ungrounded: GroundingIssue[] = [];
  for (const token of articleTokens) {
    const n = normalizeToken(token);
    if (!n) continue;
    if (allowed.has(n)) continue;
    if (timeVariants(n).some((v) => allowed.has(v))) continue;
    // Structural list/FAQ ordinals 1–12 are not changeable facts.
    if (/^\d{1,2}$/.test(n) && Number(n) >= 1 && Number(n) <= 12) continue;
    ungrounded.push({ token, context: contextAround(articleMarkdown, token) });
  }

  const lower = articleMarkdown.toLowerCase();
  const bannedHits = BANNED_PHRASES.filter((p) => lower.includes(p));

  return {
    ok: ungrounded.length === 0 && bannedHits.length === 0,
    ungrounded,
    bannedHits,
    wordCount: articleMarkdown.trim().split(/\s+/).filter(Boolean).length,
    metaLength: [...metaDescription].length,
    titleLength: [...title].length,
  };
}
