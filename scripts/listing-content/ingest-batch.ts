import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PATHS } from "../article-gen/env";
import { addUsage, emptyUsage, ListingClaude } from "./claude";
import { addRunCost, estimateCostUsd, formatMoney, lifetimeCostUsd, runCostUsd } from "./cost";
import { markdownToHtml } from "./markdown";
import { getIndex, putIndex, putRecord } from "./r2";
import type { IndexEntry, ListingContentRecord, ListingJob, ModelOutput } from "./types";
import { applyTinyFixes, failingChecks, headingCount, parseModelJson, runChecks, wordCount } from "./validate";

const SKIP = new Set([
  "1983-restaurant-bar-and-arcade",
  "another-broken-egg-cafe",
  "best-western-tampa",
]);

type BatchState = { id: string; jobs: ListingJob[]; phase: "main" | "retry" };

function toRecord(
  job: ListingJob,
  output: ModelOutput,
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
    model: "claude-haiku-5-5",
    tokens: { input: 0, output: 0, cacheRead: 0 },
    generatedAt: new Date().toISOString(),
  };
}

async function main(): Promise<void> {
  const state = JSON.parse(
    readFileSync(join(PATHS.root, "scripts/listing-content/.batch-state.json"), "utf8"),
  ) as BatchState;
  const claude = new ListingClaude();
  console.log(`Ingesting ${state.id}...`);
  const rows = await claude.downloadBatch(state.id);
  addRunCost(
    rows.reduce((total, row) => addUsage(total, row.usage), emptyUsage()),
    true,
    state.id,
  );
  const bySlug = new Map(state.jobs.map((job) => [job.listing.slug, job]));
  const records: ListingContentRecord[] = [];
  let review = 0;
  let failed = 0;
  for (const row of rows) {
    const job = bySlug.get(row.custom_id);
    if (!job || SKIP.has(row.custom_id)) continue;
    if (row.error || !row.text) {
      failed += 1;
      console.error(`✗ ${row.custom_id}: ${row.error ?? "empty"}`);
      continue;
    }
    const parsed = parseModelJson(row.text);
    if ("error" in parsed) {
      failed += 1;
      console.error(`✗ ${row.custom_id}: ${parsed.error}`);
      continue;
    }
    const output = applyTinyFixes(parsed, job.listing);
    const failures = failingChecks(
      runChecks(output, job.listing, job.primaryKeyword, `${job.compactJson}\n${job.listing.websiteText ?? ""}`, job.tier),
    ).map((check) => `${check.name}: ${check.detail}`);
    if (failures.length) review += 1;
    records.push(toRecord(job, output, failures.length > 0, failures));
  }
  console.log(`Writing ${records.length} records (${review} needs review, ${failed} failed)...`);
  await Promise.all(
    records.map(async (record, i) => {
      await putRecord(record);
      if (i === 0 || (i + 1) % 25 === 0 || i + 1 === records.length) {
        console.log(`  wrote ${i + 1}/${records.length}`);
      }
    }),
  );
  let index: IndexEntry[] = await getIndex();
  for (const record of records) {
    index = index.filter((entry) => entry.slug !== record.slug);
    index.push({
      slug: record.slug,
      wordCount: record.wordCount,
      needsReview: record.needsReview,
      inputHash: record.inputHash,
      generatedAt: record.generatedAt,
    });
  }
  index.sort((a, b) => a.slug.localeCompare(b.slug));
  await putIndex(index);
  console.log(
    `Ingest done. wrote ${records.length}, needs review ${review}, failed ${failed}. This run ${formatMoney(runCostUsd())}, lifetime ${formatMoney(lifetimeCostUsd())}. Batch usage ${formatMoney(estimateCostUsd(emptyUsage(), true))}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
