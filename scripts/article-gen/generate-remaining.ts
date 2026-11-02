/**
 * Claude API runner for remaining plan articles.
 * Fact packs must exist before generation. Checks grounding; one regenerate; then hold.
 *
 * Usage:
 *   npx tsx scripts/article-gen/generate-remaining.ts --slug tampa-to-miami --dry-run
 *   npx tsx scripts/article-gen/generate-remaining.ts --batch b --limit 3
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { ClaudeClient, addUsage, estimateCostUsd, parseArticle } from "./claude_client";
import { PATHS, modelId, tokenRates } from "./env";
import {
  factPackPath,
  formatFactPackForPrompt,
  loadFactPack,
  saveFactPack,
  type FactPack,
} from "./fact-pack";
import { checkGrounding } from "./grounding-check";
import { remainingSystemPrompt, remainingUserPrompt } from "./remaining-prompts";
import type { ClaudeUsage, ModelChoice } from "./types";

const NOTES_ROOT =
  process.env.TAMPA_NOTES_DIR?.trim() ||
  "C:\\Users\\adeel\\Downloads\\tampa-notes-rewritten-all-191\\high-priority";

type BatchId = "a" | "b" | "c";

const BATCH: Record<BatchId, string[]> = {
  a: [
    "tampa-buccaneers",
    "tampa-bay-rays",
    "tropicana-field",
    "tampa-rays-schedule",
    "tampa-bay-lightning",
    "tampa-lightning-tickets",
    "tampa-map",
    "tampa-tarpons",
    "seminole-hard-rock-tampa",
    "tampa-to-st-petersburg",
  ],
  b: [
    "kennedy-soho-tampa",
    "trampoline-parks-tampa",
    "tampa-usa-zip-code",
    "tampa-to-miami",
    "tampa-to-fort-myers",
    "tampa-rv-show-2026",
    "tampa-stadium-guide",
    "tampa-riverwalk-hotels",
    "tampa-population",
    "marriott-water-street-tampa",
  ],
  c: [
    "tampa-hotels",
    "tampa-events",
    "tampa-attractions",
    "tampa-restaurants",
    "tampa-convention-center",
    "tampa-florida-overview",
    "tampa-area-code",
    "texas-de-brazil-tampa",
    "ybor-city-tampa-fl-33605",
    "zip-code-hillsborough-tampa-fl",
  ],
};

const NOTE_FILES: Record<string, string[]> = {
  "tampa-to-miami": ["tampa-to-miami.txt", "how-far-is-tampa-from-miami.txt"],
  "marriott-water-street-tampa": ["tampa-marriott-water-street.txt"],
  "kennedy-soho-tampa": ["the-kennedy-club-tampa.txt"],
  "tampa-usa-zip-code": ["tampa-usa-zip-code.txt"],
  "tampa-population": ["tampa-population.txt"],
  "tampa-to-fort-myers": ["tampa-to-fort-myers.txt"],
  "tampa-rv-show-2026": ["tampa-rv-show-2026.txt"],
  "tampa-rv-show": ["tampa-rv-show-2026.txt"],
  "tampa-convention-center": ["tampa-convention-center.txt"],
  "tampa-stadium-guide": ["tampa-stadium.txt", "james-stadium-tampa.txt"],
  "tampa-riverwalk-hotels": ["tampa-riverwalk-hotels.txt"],
  "trampoline-parks-tampa": [
    "tampa-altitude-trampoline-park.txt",
    "tampa-trampoline-place.txt",
    "trampoline-park-tampa-hillsborough.txt",
    "trampoline-tampa-hillsborough-ave.txt",
  ],
  "tampa-florida-overview": ["tampa.txt", "tampa-florida-usa.txt", "tampa-en-floride.txt"],
  "tampa-area-code": ["tampa-florida-phone-code.txt", "tampa-fl-phone-area-code.txt"],
  "tampa-hotels": ["tampa-hotels.txt", "downtown-tampa-hotels.txt", "hotels-in-tampa-usa.txt"],
  "tampa-events": ["tampa-events.txt", "events-in-tampa-this-weekend.txt"],
  "tampa-attractions": ["tampa-attractions.txt"],
  "tampa-restaurants": ["restaurants-tampa.txt", "downtown-tampa-restaurants.txt"],
  "tampa-to-st-petersburg": ["tampa-to-st-petersburg.txt"],
  "tampa-tarpons": ["tampa-tarpons.txt"],
  "tampa-bay-rays": [
    "tampa-rays.txt",
    "tampa-rays-baseball-game.txt",
    "tampa-rays-stadium.txt",
  ],
  "tampa-rays-schedule": [
    "tampa-rays-schedule.txt",
    "tampa-rays-baseball-schedule.txt",
    "tampa-rays-game-today.txt",
  ],
  "tropicana-field": ["tampa-rays-stadium.txt"],
  "tampa-bay-lightning": ["tampa-lightning.txt"],
  "tampa-lightning-tickets": ["tampa-lightning-tickets.txt", "tampa-lightning.txt"],
  "tampa-buccaneers": ["tampa-bucs.txt", "tampa-stadium.txt", "james-stadium-tampa.txt"],
  "seminole-hard-rock-tampa": ["seminole-hard-rock-tampa.txt"],
  "tampa-map": ["tampa-map.txt"],
};

const HUB_SLUGS = new Set([
  "tampa-hotels",
  "tampa-events",
  "tampa-attractions",
  "tampa-restaurants",
  "tampa-florida-overview",
]);

/** Sports deep-dives: 1,800+ words */
const LONG_SLUGS = new Set([
  ...HUB_SLUGS,
  "tampa-bay-rays",
  "tampa-buccaneers",
  "tampa-bay-lightning",
  "tampa-rays-schedule",
  "tampa-lightning-tickets",
  "tropicana-field",
]);

function pillarPath(pillar: string, slug: string): string {
  switch (pillar) {
    case "events":
      return `/events/${slug}`;
    case "things-to-do":
      return `/things-to-do/${slug}`;
    case "food-and-drink":
      return `/food-and-drink/${slug}`;
    case "getting-around":
      return `/getting-around/${slug}`;
    case "shopping":
      return `/shopping/${slug}`;
    default:
      return `/guides/${slug}`;
  }
}

function hubLinksFromInventory(hubKey: string): string[] {
  const invPath = join(PATHS.outputDir, "remaining", "_hub-link-inventory.json");
  if (!existsSync(invPath)) return [];
  const inv = JSON.parse(readFileSync(invPath, "utf8")) as Record<
    string,
    Array<{ slug: string; pillar: string; title: string }>
  >;
  return (inv[hubKey] ?? []).map(
    (item) => `${pillarPath(item.pillar, item.slug)} — ${item.title}`,
  );
}

const HUB_INVENTORY_KEY: Record<string, string> = {
  "tampa-hotels": "hotels",
  "tampa-events": "events",
  "tampa-attractions": "attractions",
  "tampa-restaurants": "restaurants",
  "tampa-florida-overview": "overview",
};

const INTERNAL_LINKS: Record<string, string[]> = {
  "marriott-water-street-tampa": [
    "/guides/tampa-riverwalk-hotels — Tampa Riverwalk hotels",
    "/guides/tampa-to-clearwater — Tampa to Clearwater",
    "/getting-around/tampa-map — Tampa map",
    "/events/tampa-bay-lightning — Tampa Bay Lightning",
    "/guides/tampa-hotels — Tampa hotels overview",
  ],
  "tampa-to-miami": [
    "/guides/tampa-to-fort-myers — Tampa to Fort Myers",
    "/guides/tampa-to-clearwater — Tampa to Clearwater",
    "/getting-around/tampa-map — Tampa map",
    "/guides/tampa-florida-overview — Tampa Florida overview",
  ],
  "kennedy-soho-tampa": [
    "/food-and-drink/tampa-restaurants — Tampa restaurants",
    "/guides/ybor-city-tampa-fl-33605 — Ybor City Tampa",
    "/getting-around/tampa-map — Tampa map",
    "/guides/tampa-florida-overview — Tampa Florida overview",
  ],
  "tampa-usa-zip-code": [
    "/guides/zip-code-hillsborough-tampa-fl — Hillsborough Tampa ZIP codes",
    "/guides/tampa-area-code — Tampa area code",
    "/guides/tampa-florida-overview — Tampa Florida overview",
    "/getting-around/tampa-map — Tampa map",
  ],
  "tampa-population": [
    "/guides/tampa-florida-overview — Tampa Florida overview",
    "/getting-around/tampa-map — Tampa map",
    "/guides/tampa-usa-zip-code — Tampa USA ZIP code",
    "/guides/tampa-to-clearwater — Tampa to Clearwater",
  ],
  "tampa-to-fort-myers": [
    "/guides/tampa-to-miami — Tampa to Miami",
    "/guides/tampa-to-clearwater — Tampa to Clearwater",
    "/getting-around/tampa-map — Tampa map",
    "/guides/tampa-florida-overview — Tampa Florida overview",
  ],
  "tampa-rv-show-2026": [
    "/events/tampa-events — Tampa events",
    "/guides/tampa-florida-overview — Tampa Florida overview",
    "/getting-around/tampa-map — Tampa map",
    "/guides/tampa-hotels — Tampa hotels",
  ],
  "tampa-stadium-guide": [
    "/events/tampa-buccaneers — Tampa Bay Buccaneers",
    "/events/tampa-bay-lightning — Tampa Bay Lightning",
    "/events/tampa-bay-rays — Tampa Bay Rays",
    "/getting-around/tampa-map — Tampa map",
  ],
  "tampa-riverwalk-hotels": [
    "/guides/marriott-water-street-tampa — Tampa Marriott Water Street",
    "/guides/tampa-hotels — Tampa hotels",
    "/guides/barrymore-hotel-tampa — Barrymore Hotel Tampa",
    "/getting-around/tampa-map — Tampa map",
  ],
  "trampoline-parks-tampa": [
    "/things-to-do/tampa-attractions — Tampa attractions",
    "/getting-around/tampa-map — Tampa map",
    "/guides/tampa-florida-overview — Tampa Florida overview",
    "/events/tampa-events — Tampa events",
  ],
  "tampa-hotels": [],
  "tampa-events": [],
  "tampa-attractions": [],
  "tampa-restaurants": [],
  "tampa-florida-overview": [],
  "tampa-to-st-petersburg": [
    "/getting-around/tampa-map — Tampa map",
    "/guides/tampa-to-clearwater — Tampa to Clearwater",
    "/events/tropicana-field — Tropicana Field",
    "/guides/tampa-florida-overview — Tampa Florida overview",
  ],
  "tampa-tarpons": [
    "/events/tampa-stadium-guide — Tampa stadium guide",
    "/events/tampa-events — Tampa events",
    "/getting-around/tampa-map — Tampa map",
    "/events/tampa-buccaneers — Tampa Buccaneers",
  ],
  "tampa-bay-rays": [
    "/events/tropicana-field — Tropicana Field",
    "/events/tampa-rays-schedule — Rays schedule",
    "/guides/tampa-to-st-petersburg — Tampa to St. Petersburg",
    "/events/tampa-stadium-guide — Stadium guide",
  ],
  "tampa-rays-schedule": [
    "/events/tampa-bay-rays — Tampa Bay Rays",
    "/events/tropicana-field — Tropicana Field",
    "/guides/tampa-to-st-petersburg — Tampa to St. Petersburg",
    "/events/tampa-events — Tampa events",
  ],
  "tropicana-field": [
    "/events/tampa-bay-rays — Tampa Bay Rays",
    "/events/tampa-rays-schedule — Rays schedule",
    "/guides/tampa-to-st-petersburg — Tampa to St. Petersburg",
    "/events/tampa-stadium-guide — Stadium guide",
  ],
  "tampa-bay-lightning": [
    "/events/tampa-lightning-tickets — Lightning tickets",
    "/events/tampa-stadium-guide — Stadium guide",
    "/events/tampa-events — Tampa events",
    "/guides/tampa-hotels — Tampa hotels",
  ],
  "tampa-lightning-tickets": [
    "/events/tampa-bay-lightning — Tampa Bay Lightning",
    "/events/tampa-stadium-guide — Stadium guide",
    "/events/tampa-events — Tampa events",
    "/guides/tampa-hotels — Tampa hotels",
  ],
  "tampa-buccaneers": [
    "/events/tampa-stadium-guide — Stadium guide",
    "/events/tampa-events — Tampa events",
    "/getting-around/tampa-map — Tampa map",
    "/guides/tampa-hotels — Tampa hotels",
  ],
  "seminole-hard-rock-tampa": [
    "/guides/tampa-hotels — Tampa hotels",
    "/events/tampa-events — Tampa events",
    "/getting-around/tampa-map — Tampa map",
    "/food-and-drink/tampa-restaurants — Tampa restaurants",
  ],
  "tampa-map": [
    "/getting-around/tampa-international-airport — Tampa International Airport",
    "/guides/tampa-florida-overview — Tampa Florida overview",
    "/guides/tampa-population — Tampa population",
    "/guides/tampa-usa-zip-code — Tampa USA ZIP code",
  ],
};

function emptyUsage(): ClaudeUsage {
  return { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };
}

function readNotes(slug: string): string {
  const files = NOTE_FILES[slug];
  if (!files) {
    // heuristic: slug.txt or common variants
    const candidates = [`${slug}.txt`, `${slug.replace(/-tampa$/, "")}.txt`];
    for (const name of candidates) {
      const path = join(NOTES_ROOT, name);
      if (existsSync(path)) return readFileSync(path, "utf8");
    }
    throw new Error(`No note mapping for ${slug}. Add NOTE_FILES entry.`);
  }
  return files
    .map((name) => {
      const path = join(NOTES_ROOT, name);
      if (!existsSync(path)) throw new Error(`Missing note ${path}`);
      return readFileSync(path, "utf8");
    })
    .join("\n\n---\n\n");
}

function outDir(slug: string): string {
  return join(PATHS.outputDir, "remaining", slug);
}

function printFactPack(slug: string): void {
  const pack = loadFactPack(slug);
  console.log("\n" + "=".repeat(72));
  console.log(formatFactPackForPrompt(pack));
  console.log("=".repeat(72));
  console.log(`Facts: ${pack.facts.length} | File: ${factPackPath(slug)}`);
}

async function generateSlug(
  slug: string,
  modelChoice: ModelChoice,
  dryRun: boolean,
): Promise<{ status: "passed" | "held" | "skipped"; cost: number; usage: ClaudeUsage }> {
  if (!existsSync(factPackPath(slug))) {
    throw new Error(`Build fact pack first: ${factPackPath(slug)}`);
  }
  let pack = loadFactPack(slug);
  const notes = readNotes(slug);
  saveFactPack({ ...pack, allowedTokens: pack.allowedTokens }); // refresh tokens from facts
  pack = loadFactPack(slug);

  if (dryRun) {
    printFactPack(slug);
    return { status: "skipped", cost: 0, usage: emptyUsage() };
  }

  const model = modelId(modelChoice);
  const client = new ClaudeClient();
  const system = remainingSystemPrompt();
  const pillarBySlug: Record<string, string> = {
    "tampa-events": "events",
    "tampa-attractions": "things-to-do",
    "tampa-restaurants": "food-and-drink",
    "tampa-hotels": "guides",
    "tampa-florida-overview": "guides",
  };
  const meta = {
    keyword: pack.keyword,
    titleHint: pack.keyword,
    pillar: pillarBySlug[slug] ?? "guides",
  };

  let usage = emptyUsage();
  let priorFailure: string | undefined;
  let lastMarkdown = "";
  let lastSeo = { meta_title: "", meta_description: "", primary_keyword: pack.keyword };

  for (let attempt = 1; attempt <= 2; attempt++) {
    const user = remainingUserPrompt({
      slug,
      keyword: pack.keyword,
      titleHint: meta.titleHint,
      pillar: meta.pillar,
      notes,
      pack,
      internalLinkHints:
        HUB_SLUGS.has(slug) && HUB_INVENTORY_KEY[slug]
          ? hubLinksFromInventory(HUB_INVENTORY_KEY[slug])
          : (INTERNAL_LINKS[slug] ?? []),
      todayLabel: "November 2, 2026",
      priorFailure,
      isHub: HUB_SLUGS.has(slug),
    });
    const result = await client.complete({
      model,
      system,
      messages: [{ role: "user", content: user }],
      maxTokens: HUB_SLUGS.has(slug) ? 24_000 : 16_000,
    });
    usage = addUsage(usage, result.usage);
    const parsed = parseArticle(result.text);
    lastMarkdown = parsed.article;
    lastSeo = {
      meta_title: parsed.seo.meta_title ?? "",
      meta_description: parsed.seo.meta_description ?? "",
      primary_keyword: parsed.seo.primary_keyword ?? pack.keyword,
    };
    const grounding = checkGrounding(
      parsed.article,
      notes,
      pack,
      lastSeo.meta_description,
      lastSeo.meta_title,
      "November 2, 2026\n2026-11-02\nLast updated: November 2, 2026\nNovember 2025\nMay 2026\n2025\n2026\nsix-month Tampa stay Nov 2025–May 2026",
    );
    const metaLen = [...lastSeo.meta_description].length;
    const titleLen = [...lastSeo.meta_title].length;
    const fails: string[] = [];
    const minWords = LONG_SLUGS.has(slug) ? 1800 : 1200;
    if (grounding.wordCount < minWords) fails.push(`wordCount ${grounding.wordCount} < ${minWords}`);
    if (metaLen < 140 || metaLen > 155) fails.push(`metaLength ${metaLen} not in 140–155`);
    if (titleLen > 60) fails.push(`titleLength ${titleLen} > 60`);
    if (grounding.bannedHits.length) fails.push(`banned: ${grounding.bannedHits.join(", ")}`);
    if (grounding.ungrounded.length) {
      fails.push(
        `ungrounded tokens (${grounding.ungrounded.length}): ` +
          grounding.ungrounded
            .slice(0, 12)
            .map((u) => `"${u.token}"`)
            .join(", "),
      );
    }
    const dir = outDir(slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `article.attempt-${attempt}.md`), parsed.article, "utf8");
    writeFileSync(join(dir, `checks.attempt-${attempt}.json`), `${JSON.stringify({ fails, grounding }, null, 2)}\n`);
    if (fails.length === 0) {
      writeFileSync(join(dir, "article.md"), parsed.article, "utf8");
      writeFileSync(join(dir, "seo.json"), `${JSON.stringify(parsed.seo, null, 2)}\n`);
      const cost = estimateCostUsd(model, usage);
      writeFileSync(
        join(dir, "run-log.json"),
        `${JSON.stringify({ slug, model, attempt, status: "passed", usage, costUsd: cost }, null, 2)}\n`,
      );
      console.log(`✓ ${slug} passed on attempt ${attempt} | ~$${cost.toFixed(2)}`);
      return { status: "passed", cost, usage };
    }
    priorFailure = fails.join("\n");
    console.warn(`✗ ${slug} attempt ${attempt} failed:\n${priorFailure}`);
  }

  const cost = estimateCostUsd(model, usage);
  mkdirSync(outDir(slug), { recursive: true });
  writeFileSync(join(outDir(slug), "article.held.md"), lastMarkdown, "utf8");
  writeFileSync(
    join(outDir(slug), "run-log.json"),
    `${JSON.stringify({ slug, model, status: "held", usage, costUsd: cost, reason: priorFailure }, null, 2)}\n`,
  );
  console.error(`HOLD ${slug} after 2 attempts | ~$${cost.toFixed(2)}`);
  return { status: "held", cost, usage };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      batch: { type: "string" },
      slug: { type: "string", multiple: true, default: [] },
      limit: { type: "string" },
      model: { type: "string", default: "sonnet" },
      "dry-run": { type: "boolean", default: false },
      "show-pack": { type: "boolean", default: false },
    },
  });
  const modelChoice = (values.model ?? "sonnet") as ModelChoice;
  const model = modelId(modelChoice);
  const rates = tokenRates(model);
  console.log(`Claude model: ${model} (choice=${modelChoice})`);
  console.log(`Rates: $${rates.input}/M input · $${rates.output}/M output`);

  let slugs = (values.slug as string[]) ?? [];
  if (values.batch) {
    const id = values.batch as BatchId;
    if (!BATCH[id]) throw new Error("--batch must be a|b|c");
    slugs = [...BATCH[id]];
  }
  if (values.limit) slugs = slugs.slice(0, Number(values.limit));
  if (!slugs.length) throw new Error("Pass --slug or --batch");

  if (values["show-pack"] || values["dry-run"]) {
    for (const slug of slugs) printFactPack(slug);
    if (values["show-pack"] && !values["dry-run"]) return;
  }

  let totalUsage = emptyUsage();
  let totalCost = 0;
  const rows: { slug: string; status: string; cost: number }[] = [];
  for (const slug of slugs) {
    const result = await generateSlug(slug, modelChoice, Boolean(values["dry-run"]));
    totalUsage = addUsage(totalUsage, result.usage);
    totalCost += result.cost;
    rows.push({ slug, status: result.status, cost: result.cost });
  }
  console.log("\nPer article:");
  for (const row of rows) console.log(`  ${row.slug}\t${row.status}\t$${row.cost.toFixed(2)}`);
  console.log(
    `\nTOTAL ~$${totalCost.toFixed(2)} | tokens in ${totalUsage.inputTokens} / out ${totalUsage.outputTokens}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
