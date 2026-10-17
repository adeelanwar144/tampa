import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { config } from "dotenv";
import { PATHS } from "../article-gen/env";
import { ListingClaude, addUsage, emptyUsage } from "./claude";
import { HAIKU_MODEL, addRunCost, estimateCostUsd, formatMoney, runCostUsd } from "./cost";
import { toJob } from "./keywords";
import { filterListings, loadListings } from "./listings";
import { markdownToHtml } from "./markdown";
import { loadCachedEnrichment } from "./enrich";
import { applyListingHours } from "./hours";
import { AUDIT_SYSTEM, auditUserMessage, filterUnsupported, parseUnsupported } from "./fact-check";
import { userMessage } from "./prompt";
import { getIndex, getRecord, putIndex, putRecord, quarantineRecord, readLocalRecords } from "./r2";
import { scoreRichness } from "./travel";
import type {
  ClaudeUsage,
  CompactListing,
  IndexEntry,
  ListingContentRecord,
  ListingJob,
  ModelOutput,
} from "./types";
import { applyTinyFixes, failingChecks, headingCount, parseModelJson, runChecks, wordCount } from "./validate";

config({ path: resolve(PATHS.root, ".env"), quiet: true });

const STATE_PATH = join(PATHS.root, "scripts/listing-content/.batch-state.json");
const MANUAL_PATH = join(PATHS.root, ".listing-content-cache", "needs-manual-data.json");
const COST_PATH = join(PATHS.root, ".listing-content-cache", "audit-summary.json");
const FIRST_BATCH_ID = "msgbatch_01HN91fRVnmqNWdp72QBisLr";

type BatchState = { id: string; jobs: ListingJob[]; phase: "main" | "retry" };

function loadState(): BatchState | null {
  if (!existsSync(STATE_PATH)) return null;
  const raw = readFileSync(STATE_PATH, "utf8").trim();
  if (!raw) return null;
  return JSON.parse(raw) as BatchState;
}

function toRecord(
  job: ListingJob,
  output: ModelOutput,
  usage: ClaudeUsage,
  needsReview: boolean,
  reviewReasons: string[],
): ListingContentRecord {
  return {
    slug: job.listing.slug,
    name: job.listing.name,
    primaryKeyword: job.primaryKeyword,
    secondaryKeywords: job.secondaryKeywords,
    metaTitle: output.metaTitle,
    metaDescription: output.metaDescription,
    contentMarkdown: output.content,
    contentHtml: markdownToHtml(output.content),
    faq: output.faq,
    wordCount: wordCount(output.content),
    headingCount: headingCount(output.content),
    needsReview,
    reviewReasons,
    inputHash: job.inputHash,
    model: HAIKU_MODEL,
    tokens: {
      input: usage.inputTokens,
      output: usage.outputTokens,
      cacheRead: usage.cacheReadTokens,
    },
    generatedAt: new Date().toISOString(),
  };
}

function recordFromRaw(job: ListingJob, raw: string, usage: ClaudeUsage): ListingContentRecord | null {
  const parsed = parseModelJson(raw);
  if ("error" in parsed) return null;
  const output = applyTinyFixes(parsed, job.listing);
  const failures = failingChecks(
    runChecks(
      output,
      job.listing,
      job.primaryKeyword,
      `${job.compactJson}\n${job.listing.websiteText ?? ""}`,
      job.tier,
    ),
  ).map((check) => `${check.name}: ${check.detail}`);
  return toRecord(job, output, usage, failures.length > 0, failures);
}

function upsertIndex(index: IndexEntry[], record: ListingContentRecord): IndexEntry[] {
  const entry: IndexEntry = {
    slug: record.slug,
    wordCount: record.wordCount,
    needsReview: record.needsReview,
    inputHash: record.inputHash,
    generatedAt: record.generatedAt,
  };
  const next = index.filter((item) => item.slug !== record.slug);
  next.push(entry);
  next.sort((a, b) => a.slug.localeCompare(b.slug));
  return next;
}

async function runBatch(
  claude: ListingClaude,
  requests: Array<{ custom_id: string; user: string }>,
  options: { system?: string; temperature?: number; maxTokens?: number; pad?: boolean },
  label: string,
): Promise<{ rows: Awaited<ReturnType<ListingClaude["downloadBatch"]>>; usage: ClaudeUsage }> {
  if (requests.length === 0) return { rows: [], usage: emptyUsage() };
  console.log(`${label}: submitting ${requests.length}...`);
  const { id } = await claude.createBatch(requests, options);
  console.log(`${label}: ${id}. Polling...`);
  await claude.pollBatch(id);
  const rows = await claude.downloadBatch(id);
  const usage = rows.reduce((total, row) => addUsage(total, row.usage), emptyUsage());
  addRunCost(usage, true, id);
  console.log(`${label}: ended. Actual ${formatMoney(estimateCostUsd(usage, true))} (this run ${formatMoney(runCostUsd())})`);
  return { rows, usage };
}

async function harvest(): Promise<Map<string, ListingContentRecord>> {
  const records = new Map<string, ListingContentRecord>();
  const take = (record: ListingContentRecord | null) => {
    if (!record?.slug || !record.contentMarkdown) return;
    records.set(record.slug, record);
  };
  for (const record of readLocalRecords()) take(record);
  const index = await getIndex();
  for (const entry of index) {
    if (records.has(entry.slug)) continue;
    take(await getRecord(entry.slug));
  }
  return records;
}

async function main(): Promise<void> {
  const listings = await loadListings("remote");
  const travel = filterListings(listings, { travelOnly: true });
  const jobsBySlug = new Map<string, ListingJob>();
  for (const listing of travel) {
    listing.websiteText = loadCachedEnrichment(listing.slug);
    applyListingHours(listing);
    const score = scoreRichness(listing);
    if (score.tier === "thin") continue;
    jobsBySlug.set(listing.slug, toJob(listing, score.tier));
  }

  const claude = new ListingClaude();
  const harvested = await harvest();
  const targets = [...harvested.entries()].filter(([slug]) => jobsBySlug.has(slug));
  console.log(`Fact-audit targets: ${targets.length}`);
  if (targets.length === 0) {
    console.log("No generated listings to audit.");
    return;
  }

  let usage = emptyUsage();
  const audit1 = await runBatch(
    claude,
    targets.map(([slug, record]) => ({
      custom_id: slug,
      user: auditUserMessage(jobsBySlug.get(slug)!.compactJson, jobsBySlug.get(slug)!.listing.websiteText, record),
    })),
    { system: AUDIT_SYSTEM, maxTokens: 800, pad: false },
    "Audit 1",
  );
  usage = addUsage(usage, audit1.usage);
  if (audit1.rows.length && audit1.rows.every((row) => row.error)) {
    throw new Error(`Audit 1 failed for every listing: ${audit1.rows[0]?.error}`);
  }

  const clean = new Map<string, ListingContentRecord>();
  const dirty = new Map<string, { record: ListingContentRecord; unsupported: string[] }>();
  for (const row of audit1.rows) {
    const record = harvested.get(row.custom_id);
    if (!record) continue;
    const job = jobsBySlug.get(row.custom_id);
    const unsupported = filterUnsupported(
      parseUnsupported(row.text, row.error),
      job?.compactJson ?? "",
      job?.listing.websiteText,
    );
    if (unsupported.length === 0) {
      record.needsReview = false;
      record.reviewReasons = [];
      clean.set(row.custom_id, record);
    } else {
      dirty.set(row.custom_id, { record, unsupported });
    }
  }
  const cleanAfterFirst = clean.size;
  console.log(`Audit 1: clean ${cleanAfterFirst}, unsupported ${dirty.size}`);

  const regenJobs = [...dirty.entries()].flatMap(([slug, item]) => {
    const job = jobsBySlug.get(slug);
    return job ? [{ job, unsupported: item.unsupported }] : [];
  });
  const regen = await runBatch(
    claude,
    regenJobs.map(({ job, unsupported }) => ({
      custom_id: job.listing.slug,
      user: userMessage(
            job.primaryKeyword,
            job.secondaryKeywords,
            job.compactJson,
            job.tier,
            unsupported,
            job.listing.websiteText,
          ),
    })),
    { maxTokens: 2800 },
    "Regenerate",
  );
  usage = addUsage(usage, regen.usage);
  if (regen.rows.length && regen.rows.every((row) => row.error)) {
    throw new Error(`Regenerate failed for every listing: ${regen.rows[0]?.error}`);
  }

  const regenerated = new Map<string, ListingContentRecord>();
  for (const row of regen.rows) {
    const job = jobsBySlug.get(row.custom_id);
    if (!job || row.error || !row.text) continue;
    const record = recordFromRaw(job, row.text, row.usage);
    if (record) regenerated.set(row.custom_id, record);
  }

  const audit2 = await runBatch(
    claude,
    [...regenerated.entries()].map(([slug, record]) => ({
      custom_id: slug,
      user: auditUserMessage(jobsBySlug.get(slug)!.compactJson, jobsBySlug.get(slug)!.listing.websiteText, record),
    })),
    { system: AUDIT_SYSTEM, maxTokens: 800, pad: false },
    "Audit 2",
  );
  usage = addUsage(usage, audit2.usage);

  let fixed = 0;
  const removed: Array<{ slug: string; name: string; unsupported: string[] }> = [];
  for (const [slug] of dirty) {
    const record = regenerated.get(slug);
    const row = audit2.rows.find((item) => item.custom_id === slug);
    const job = jobsBySlug.get(slug);
    const unsupported = record
      ? filterUnsupported(parseUnsupported(row?.text, row?.error), job?.compactJson ?? "", job?.listing.websiteText)
      : ["regeneration produced no JSON"];
    if (record && unsupported.length === 0) {
      record.needsReview = false;
      record.reviewReasons = [];
      clean.set(slug, record);
      fixed += 1;
    } else {
      const listing = jobsBySlug.get(slug)?.listing as CompactListing | undefined;
      removed.push({
        slug,
        name: listing?.name ?? slug,
        unsupported,
      });
    }
  }

  let index: IndexEntry[] = [];
  console.log(`Writing ${clean.size} clean records and quarantining ${removed.length}...`);
  for (const record of clean.values()) {
    record.needsReview = false;
    record.reviewReasons = [];
    await putRecord(record);
    index = upsertIndex(index, record);
  }
  for (const item of removed) {
    const record = regenerated.get(item.slug) ?? dirty.get(item.slug)?.record;
    if (!record) continue;
    try {
      await quarantineRecord({ ...record, needsReview: true, reviewReasons: item.unsupported });
    } catch (error) {
      console.warn(`quarantine ${item.slug}: ${error instanceof Error ? error.message : error}`);
    }
  }
  await putIndex(index);

  mkdirSync(join(PATHS.root, ".listing-content-cache"), { recursive: true });
  writeFileSync(MANUAL_PATH, `${JSON.stringify(removed, null, 2)}\n`, "utf8");
  const summary = {
    total: targets.length,
    cleanAfterFirst,
    fixedByRegen: fixed,
    removed: removed.length,
    costUsd: estimateCostUsd(usage, true),
    runUsd: runCostUsd(),
  };
  writeFileSync(COST_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  const best = clean.get("best-western-tampa");
  const arcade = clean.get("1983-restaurant-bar-and-arcade");
  console.log("\n=== SUMMARY ===");
  console.log(
    `Total listings ${summary.total}, clean after first audit ${summary.cleanAfterFirst}, fixed by regeneration ${summary.fixedByRegen}, removed ${summary.removed}`,
  );
  console.log(`This run ${formatMoney(runCostUsd())}`);
  console.log("\n=== best-western-tampa ===\n");
  console.log(best?.contentMarkdown ?? "(removed or missing)");
  console.log("\n=== 1983-restaurant-bar-and-arcade ===\n");
  console.log(arcade?.contentMarkdown ?? "(removed or missing)");
  if (removed.length) {
    console.log("\nNeeds manual data:");
    for (const item of removed) console.log(`  ${item.slug}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
