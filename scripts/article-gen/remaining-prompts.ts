import { OUTPUT_CONTRACT } from "./prompts";
import { formatFactPackForPrompt, type FactPack } from "./fact-pack";

/** Full article rules for remaining-plan generation (Claude API system prompt). */
export const REMAINING_ARTICLE_RULES = `
You are writing SEO articles for Visit In Tampa as Ben Hayes (first person).

FACT GROUNDING (hard rule):
- Use ONLY facts from (1) Ben's note and (2) the FACT PACK in the user message.
- Do NOT use your own memory or training data for prices, hours, dates, schedules, fees, seasons, addresses, phone numbers, distances, tolls, ticket rules, or any other changeable detail.
- If a fact is not in the note or the fact pack, leave it out. Say "check the official site" with the pack URL if the pack names that site—never invent a number.
- Do not invent personal experience. Every first-person claim must come from the note. Mention the six-month Tampa stay (Nov 2025–May 2026, downtown with aunt/cousins) only where it adds context, with varied wording—not in every intro.

DEPTH:
- Minimum 1,200 words. Broad topics (Tampa hotels, restaurants, attractions, events, Rays, Bucs, Lightning, Tampa Florida overview) target 1,800–2,500 words.
- Cover related subtopics and real PAA questions with real information from note/pack. No filler. If you cannot reach 1,200 honestly from the materials, say so in editor_notes and write the longest honest draft you can.

SEARCH INTENT:
- Cover what searchers of the primary keyword want (e.g. restaurants: menu highlights, atmosphere, brunch/happy hour, reservations, dress code, price range, parking—only if present in note/pack).

STYLE BANS:
- No AI self-talk ("I am not inventing…", "not willing to quote…", "not guessing…").
- No keyword stuffing, no dated framing, vary intro / tips box / closing.
- Never use: inventing, willing to, not guessing, hidden gem, nestled, vibrant, "whether you're".

SEO:
- One H1; title under 60 characters with keyword near the start.
- Meta description 140–155 characters.
- Logical H2/H3; FAQ with 3–5 real questions.
- "Last updated: [date from pack or note]" when hours, prices, schedules, or tickets appear.
- 3–6 internal links as markdown to paths provided in the user message; 1–3 external links only to official URLs from the fact pack (markdown links).
- HUB pages (tampa hotels / events / attractions / restaurants / florida overview): link EVERY internal path listed in the user message at least once (hubs may exceed 6 links). Organize by neighborhood or theme so the page works as a directory into related guides and place pages. Still 1,800–2,500 words with real substance—not a bare link dump.

SPECIAL:
- Seminole Hard Rock / Tampa casino: hotel, dining, concerts, what the name means—no gambling how-tos, no how-to-play, no odds.
- Tampa Bay Downs: visit logistics and racing-season calendar only—no betting how-tos, no poker how-tos, no handicapping advice.
- Rays: 2026 season home is Tropicana Field (St. Petersburg) when the pack/note say so.
- Straz Center: same campus as former TBPAC; use Straz as the primary name.
`.trim();

export function remainingSystemPrompt(): string {
  return `${REMAINING_ARTICLE_RULES}\n\n${OUTPUT_CONTRACT}`;
}

export function remainingUserPrompt(args: {
  slug: string;
  keyword: string;
  titleHint: string;
  pillar: string;
  notes: string;
  pack: FactPack;
  internalLinkHints: string[];
  todayLabel: string;
  priorFailure?: string;
  isHub?: boolean;
}): string {
  const links =
    args.internalLinkHints.length > 0
      ? args.internalLinkHints.map((l) => `- ${l}`).join("\n")
      : "- (none supplied—still add links only to paths you are told exist in this message)";
  const retry = args.priorFailure
    ? `\n\nPREVIOUS DRAFT FAILED CHECKS. Fix all of these without inventing facts:\n${args.priorFailure}\n`
    : "";
  const linkRule = args.isHub
    ? `Internal link targets (HUB: weave EVERY path below into the body at least once; descriptive anchors; group by theme/neighborhood):`
    : `Internal link targets (use descriptive anchors; 3–6 in body paragraphs):`;
  const hubExtra = args.isHub
    ? `\nThis is a HUB article. Target 1,800–2,500 words. Minimum for checks: 1,800. Work as a directory into related guides—link every listed path, with short orienting copy between clusters. Do not invent prices/hours/schedules.\n`
    : "";
  return `Write the article for slug "${args.slug}".
Primary keyword: ${args.keyword}
Title hint (adapt if needed for <60 chars): ${args.titleHint}
Pillar/category: ${args.pillar}
Today's date for "Last updated" when needed: ${args.todayLabel}
${hubExtra}
${linkRule}
${links}

${formatFactPackForPrompt(args.pack)}

BEN'S NOTE (personal experience source — quote only what is here):
---
${args.notes.trim()}
---
${retry}`;
}
