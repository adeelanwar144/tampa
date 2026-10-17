import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { parseArgs } from "node:util";
import { join } from "node:path";
import { config } from "dotenv";
import { resolve } from "node:path";
import { PATHS } from "../article-gen/env";
import { ListingClaude, addUsage, emptyUsage } from "./claude";
import {
  HAIKU_MODEL,
  addRunCost,
  estimateCostUsd,
  estimateTokens,
  formatMoney,
  planCost,
  lifetimeCostUsd,
  runCostUsd,
} from "./cost";
import { toJob } from "./keywords";
import { enrichListings, loadCachedEnrichment } from "./enrich";
import { applyListingHours } from "./hours";
import { AUDIT_SYSTEM, auditUserMessage, filterUnsupported, parseUnsupported } from "./fact-check";
import { filterListings, loadListings, pickDiverseTestSet } from "./listings";
import { enrichmentWordCount, scoreRichness } from "./travel";
import { markdownToHtml } from "./markdown";
import { SYSTEM_PROMPT, revisionMessage, userMessage } from "./prompt";
import { getIndex, getRecord, putIndex, putRecord, r2WriteMode } from "./r2";
import type {
  CheckResult,
  ClaudeUsage,
  GenerateOptions,
  IndexEntry,
  ListingContentRecord,
  ListingJob,
  ModelOutput,
} from "./types";
import { applyTinyFixes, failingChecks, headingCount, parseModelJson, runChecks, wordCount } from "./validate";

const MAX_BATCH_REQUESTS = 10_000;

config({ path: resolve(PATHS.root, ".env"), quiet: true });

const STATE_PATH = join(PATHS.root, "scripts/listing-content/.batch-state.json");
const OUTPUT_TOKENS_EST = 900;

function parseCli(argv: string[]): GenerateOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      test: { type: "string" },
      slug: { type: "string", multiple: true, default: [] },
      category: { type: "string" },
      limit: { type: "string" },
      force: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      yes: { type: "boolean", default: false },
      review: { type: "boolean", default: false },
      resume: { type: "boolean", default: false },
      revalidate: { type: "boolean", default: false },
      source: { type: "string" },
    },
    allowPositionals: false,
  });
  const source = values.source === "local" ? "local" : "remote";
  return {
    test: values.test ? Number(values.test) : undefined,
    slugs: (values.slug ?? []).map((slug) => slug.replace(/^\/+|\/+$/g, "")),
    category: values.category,
    limit: values.limit ? Number(values.limit) : undefined,
    force: Boolean(values.force),
    dryRun: Boolean(values["dry-run"]),
    yes: Boolean(values.yes),
    review: Boolean(values.review),
    resume: Boolean(values.resume),
    revalidate: Boolean(values.revalidate),
    source,
  };
}

type BatchState = { id: string; jobs: ListingJob[]; phase: "main" | "retry" };

function saveState(state: BatchState): void {
  mkdirSync(join(PATHS.root, "scripts/listing-content"), { recursive: true });
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function loadState(): BatchState | null {
  if (!existsSync(STATE_PATH)) return null;
  return JSON.parse(readFileSync(STATE_PATH, "utf8")) as BatchState;
}

function clearState(): void {
  if (existsSync(STATE_PATH)) writeFileSync(STATE_PATH, "", "utf8");
}

async function confirm(prompt: string): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(`${prompt} `);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

function jobUserMessage(job: ListingJob, flagged?: string[]): string {
  return userMessage(
    job.primaryKeyword,
    job.secondaryKeywords,
    job.compactJson,
    job.tier,
    flagged,
    job.listing.websiteText,
  );
}

function factCorpus(job: ListingJob): string {
  return `${job.compactJson}\n${job.listing.websiteText ?? ""}`;
}

function printEstimate(count: number, batch: boolean, outputTokens = OUTPUT_TOKENS_EST): number {
  const systemTokens = estimateTokens(SYSTEM_PROMPT);
  const userTokens = 320;
  const planned = planCost({
    listingCount: count,
    systemTokens,
    userTokens,
    outputTokens,
    batch,
  });
  console.log(`Listings to generate: ${count}`);
  console.log(`Model: ${HAIKU_MODEL}${batch ? " (Message Batches, 50% off)" : " (standard Messages API)"}`);
  console.log(`R2 writes: ${r2WriteMode()} → listing-content/listings/*.json (verified --remote)`);
  console.log(
    `Est. tokens  in ${planned.usage.inputTokens.toLocaleString("en-US")}  out ${planned.usage.outputTokens.toLocaleString("en-US")}  cacheWrite ${planned.usage.cacheCreationTokens.toLocaleString("en-US")}  cacheRead ${planned.usage.cacheReadTokens.toLocaleString("en-US")}`,
  );
  console.log(`Est. cost: ${formatMoney(planned.usd)}`);
  return planned.usd;
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

function failureLines(checks: CheckResult[]): string[] {
  return failingChecks(checks).map((check) => `${check.name}: ${check.detail}`);
}

function evaluateRaw(job: ListingJob, raw: string): { output?: ModelOutput; failures: string[] } {
  const parsed = parseModelJson(raw);
  if ("error" in parsed) return { failures: [`json: ${parsed.error}`] };
  const output = applyTinyFixes(parsed, job.listing);
  return {
    output,
    failures: failureLines(runChecks(output, job.listing, job.primaryKeyword, factCorpus(job), job.tier)),
  };
}

async function processOutput(
  job: ListingJob,
  raw: string,
  usage: ClaudeUsage,
  claude: ListingClaude | null,
): Promise<{ record?: ListingContentRecord; usage: ClaudeUsage; retried: boolean; failures: string[] }> {
  let total = usage;
  let retried = false;
  let evaluated = evaluateRaw(job, raw);
  if (evaluated.failures.length && claude) {
    retried = true;
    let previous = raw;
    for (let round = 0; round < 2 && evaluated.failures.length; round += 1) {
      const retry = await claude.complete(revisionMessage(evaluated.failures), [
        { role: "user", content: jobUserMessage(job) },
        { role: "assistant", content: previous },
      ]);
      total = addUsage(total, retry.usage);
      previous = retry.text;
      evaluated = evaluateRaw(job, retry.text);
    }
  }
  if (!evaluated.output) {
    return {
      usage: total,
      retried,
      failures: evaluated.failures.length ? evaluated.failures : ["empty model output"],
    };
  }
  return {
    record: toRecord(job, evaluated.output, total, evaluated.failures.length > 0, evaluated.failures),
    usage: total,
    retried,
    failures: evaluated.failures,
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size));
  return groups;
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

function printRecordSummary(record: ListingContentRecord): void {
  const headings = [...record.contentMarkdown.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1]);
  console.log(`\n--- ${record.slug} ---`);
  console.log(`metaTitle (${record.metaTitle.length}): ${record.metaTitle}`);
  console.log(`metaDescription (${record.metaDescription.length}): ${record.metaDescription}`);
  console.log(`headings (${record.headingCount}): ${headings.join(" | ")}`);
  console.log(`words: ${record.wordCount}  needsReview: ${record.needsReview}`);
  if (record.reviewReasons.length) console.log(`review: ${record.reviewReasons.join("; ")}`);
}

async function runReview(): Promise<void> {
  const index = await getIndex();
  const flagged = index.filter((entry) => entry.needsReview);
  if (flagged.length === 0) {
    console.log("No listings marked needsReview.");
    return;
  }
  console.log(`${flagged.length} listing(s) need review:\n`);
  for (const entry of flagged) {
    const record = await getRecord(entry.slug);
    console.log(`- ${entry.slug}`);
    for (const reason of record?.reviewReasons ?? []) console.log(`    ${reason}`);
  }
}

async function generateOne(job: ListingJob, claude: ListingClaude): Promise<{ record: ListingContentRecord; usage: ClaudeUsage }> {
  const first = await claude.complete(jobUserMessage(job));
  const processed = await processOutput(job, first.text, first.usage, claude);
  if (!processed.record) {
    throw new Error(`${job.listing.slug}: ${processed.failures.join("; ") || "empty model output"}`);
  }
  let record = processed.record;
  let usage = processed.usage;
  const audit = await claude.complete(auditUserMessage(job.compactJson, job.listing.websiteText, record), [], {
    system: AUDIT_SYSTEM,
    maxTokens: 800,
    pad: false,
  });
  usage = addUsage(usage, audit.usage);
  const unsupported = filterUnsupported(
    parseUnsupported(audit.text, audit.text ? undefined : "empty audit"),
    job.compactJson,
    job.listing.websiteText,
  );
  if (unsupported.length) {
    console.log(`  fact-audit ${job.listing.slug}: ${unsupported.length} unsupported claim(s); regenerating`);
    const retry = await claude.complete(jobUserMessage(job, unsupported));
    const again = await processOutput(job, retry.text, retry.usage, claude);
    usage = addUsage(usage, again.usage);
    if (again.record) record = again.record;
    const audit2 = await claude.complete(
      auditUserMessage(job.compactJson, job.listing.websiteText, record),
      [],
      { system: AUDIT_SYSTEM, maxTokens: 800, pad: false },
    );
    usage = addUsage(usage, audit2.usage);
    const still = filterUnsupported(parseUnsupported(audit2.text), job.compactJson, job.listing.websiteText);
    if (still.length) {
      record = {
        ...record,
        needsReview: true,
        reviewReasons: [...record.reviewReasons, `unsupported claims: ${still.join(" | ")}`],
      };
    }
  }
  return { record, usage };
}

async function runRevalidate(source: "remote" | "local"): Promise<void> {
  const listings = await loadListings(source);
  const bySlug = new Map(listings.map((listing) => [listing.slug, listing]));
  let index = await getIndex();
  let passed = 0;
  let review = 0;
  let updated = 0;
  let missing = 0;
  const reasons = new Map<string, number>();
  for (const entry of index) {
    const listing = bySlug.get(entry.slug);
    if (listing) listing.websiteText = listing.websiteText ?? loadCachedEnrichment(listing.slug);
    const record = await getRecord(entry.slug);
    if (!listing || !record) {
      missing += 1;
      continue;
    }
    const score = scoreRichness(listing);
    if (score.tier === "thin") continue;
    const job = toJob(listing, score.tier);
    const output: ModelOutput = {
      metaTitle: record.metaTitle,
      metaDescription: record.metaDescription,
      content: record.contentMarkdown,
      faq: record.faq,
    };
    const failures = failingChecks(
      runChecks(output, listing, job.primaryKeyword, `${job.compactJson}\n${listing.websiteText ?? ""}`, job.tier),
    );
    const needsReview = failures.length > 0;
    const reviewReasons = failures.map((check) => `${check.name}: ${check.detail}`);
    if (needsReview) {
      review += 1;
      for (const reason of reviewReasons) {
        const key = reason.split(":")[0] ?? reason;
        reasons.set(key, (reasons.get(key) ?? 0) + 1);
      }
    } else {
      passed += 1;
    }
    if (record.needsReview === needsReview && JSON.stringify(record.reviewReasons) === JSON.stringify(reviewReasons)) {
      continue;
    }
    const next = { ...record, needsReview, reviewReasons };
    await putRecord(next);
    index = upsertIndex(index, next);
    updated += 1;
  }
  await putIndex(index);
  console.log(`Revalidated ${index.length} records. passed ${passed}, needs review ${review}, updated ${updated}, missing ${missing}.`);
  if (reasons.size) {
    console.log("Failure reasons:");
    for (const [name, count] of [...reasons.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${name}: ${count}`);
    }
  }
}

async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  if (options.review) {
    await runReview();
    return;
  }
  if (options.revalidate) {
    await runRevalidate(options.source);
    return;
  }

  let jobs: ListingJob[] = [];
  let totals = { generated: 0, skipped: 0, review: 0, failed: 0, usage: emptyUsage() };
  let index = await getIndex();
  const hashBySlug = new Map(index.map((entry) => [entry.slug, entry.inputHash]));

  if (options.resume) {
    const state = loadState();
    if (!state?.id) throw new Error("No batch state to resume. Missing scripts/listing-content/.batch-state.json");
    const claude = new ListingClaude();
    console.log(`Resuming batch ${state.id} (${state.jobs.length} listings, phase ${state.phase})...`);
    await claude.pollBatch(state.id);
    console.log("Downloading results...");
    const rows = await claude.downloadBatch(state.id);
    console.log(`Downloaded ${rows.length} results.`);
    addRunCost(
      rows.reduce((total, row) => addUsage(total, row.usage), emptyUsage()),
      true,
      state.id,
    );
    const bySlug = new Map(state.jobs.map((job) => [job.listing.slug, job]));
    const retryJobs: Array<{ job: ListingJob; failures: string[] }> = [];
    const passing: ListingContentRecord[] = [];
    let processedCount = 0;
    for (const row of rows) {
      const job = bySlug.get(row.custom_id);
      if (!job) continue;
      processedCount += 1;
      if (processedCount === 1 || processedCount % 25 === 0) {
        console.log(`Processing ${processedCount}/${rows.length} ${row.custom_id}...`);
      }
      try {
        if (row.error || !row.text) throw new Error(row.error ?? "empty batch result");
        totals.usage = addUsage(totals.usage, row.usage);
        const processed = await processOutput(job, row.text, row.usage, null);
        if (state.phase === "main" && (!processed.record || processed.failures.length)) {
          retryJobs.push({
            job,
            failures: processed.failures.length ? processed.failures : ["empty model output"],
          });
          continue;
        }
        if (!processed.record) throw new Error(processed.failures.join("; ") || "empty model output");
        passing.push(processed.record);
        totals.generated += 1;
        if (processed.record.needsReview) totals.review += 1;
      } catch (error) {
        totals.failed += 1;
        console.error(`✗ ${row.custom_id}: ${error instanceof Error ? error.message : error}`);
      }
    }
    console.log(`Writing ${passing.length} passing records (${retryJobs.length} to retry)...`);
    await Promise.all(
      passing.map(async (record, i) => {
        await putRecord(record);
        if (i === 0 || (i + 1) % 25 === 0) console.log(`  wrote ${i + 1}/${passing.length}`);
      }),
    );
    for (const record of passing) index = upsertIndex(index, record);
    if (retryJobs.length) {
      console.log(`Retrying ${retryJobs.length} listing(s) as a second batch...`);
      const { id: retryId } = await claude.createBatch(
        retryJobs.map(({ job, failures }) => ({
          custom_id: job.listing.slug,
          user: `${jobUserMessage(job)}\n\n${revisionMessage(failures)}`,
        })),
      );
      saveState({
        id: retryId,
        jobs: retryJobs.map((item) => item.job),
        phase: "retry",
      });
      await claude.pollBatch(retryId);
      const retryRows = await claude.downloadBatch(retryId);
      addRunCost(
        retryRows.reduce((total, row) => addUsage(total, row.usage), emptyUsage()),
        true,
        retryId,
      );
      const retryBySlug = new Map(retryJobs.map((item) => [item.job.listing.slug, item.job]));
      for (const row of retryRows) {
        const job = retryBySlug.get(row.custom_id);
        if (!job) continue;
        try {
          if (row.error || !row.text) throw new Error(row.error ?? "empty batch result");
          const processed = await processOutput(job, row.text, row.usage, null);
          totals.usage = addUsage(totals.usage, row.usage);
          if (!processed.record) throw new Error(processed.failures.join("; ") || "empty model output");
          await putRecord(processed.record);
          index = upsertIndex(index, processed.record);
          totals.generated += 1;
          if (processed.record.needsReview) totals.review += 1;
        } catch (error) {
          totals.failed += 1;
          console.error(`✗ ${row.custom_id}: ${error instanceof Error ? error.message : error}`);
        }
      }
    }
    await putIndex(index);
    clearState();
    console.log(
      `\nDone. generated ${totals.generated}, skipped ${totals.skipped}, needs review ${totals.review}, failed ${totals.failed}. Tokens in ${totals.usage.inputTokens.toLocaleString("en-US")} / out ${totals.usage.outputTokens.toLocaleString("en-US")}. Actual cost ${formatMoney(estimateCostUsd(totals.usage, true))} (this run ${formatMoney(runCostUsd())}, lifetime ${formatMoney(lifetimeCostUsd())})`,
    );
    return;
  }

  const listings = await loadListings(options.source);
  console.log(`D1 source: ${options.source} (${listings.length} listings)`);
  const byCategory = new Map<string, number>();
  for (const listing of listings) {
    byCategory.set(listing.category, (byCategory.get(listing.category) ?? 0) + 1);
  }
  console.log("Categories:");
  for (const [category, count] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${category}: ${count}`);
  }

  let selected = filterListings(listings, {
    slugs: options.slugs,
    category: options.category,
    limit: options.limit,
    travelOnly: true,
  });
  if (options.test && !options.slugs.length) selected = pickDiverseTestSet(selected, options.test);
  if (selected.length === 0) {
    console.log("No listings matched.");
    return;
  }
  if (selected.length <= 10) {
    console.log(
      `Selected: ${selected.map((listing) => `${listing.slug} [${listing.category}]`).join(", ")}`,
    );
  }

  console.log("Enriching from business websites...");
  await enrichListings(selected, Boolean(options.test));
  for (const listing of selected) applyListingHours(listing);

  const thin: Array<{ slug: string; name: string; filled: string[] }> = [];
  const rich = { rich: 0, medium: 0 };
  for (const listing of selected) {
    const score = scoreRichness(listing);
    if (score.tier === "thin") {
      thin.push({ slug: listing.slug, name: listing.name, filled: score.filled });
      continue;
    }
    rich[score.tier] += 1;
    const job = toJob(listing, score.tier);
    console.log(
      `  tier ${score.tier} ${listing.slug} fields=${score.filled.join(",") || "none"} websiteWords=${enrichmentWordCount(listing)}`,
    );
    if (!options.force && hashBySlug.get(listing.slug) === job.inputHash) {
      totals.skipped += 1;
      continue;
    }
    jobs.push(job);
  }
  console.log(`Travel-relevant: ${selected.length}. Rich ${rich.rich}, medium ${rich.medium}, thin skipped ${thin.length}.`);
  if (thin.length) {
    console.log(`Thin listings (add data later, ${thin.length}):`);
    for (const item of thin) {
      console.log(`  ${item.slug}  fields=${item.filled.join(",") || "none"}`);
    }
  }

  const useBatch = !options.test;
  const avgOut =
    jobs.length === 0
      ? OUTPUT_TOKENS_EST
      : Math.round(jobs.reduce((sum, job) => sum + (job.tier === "rich" ? 900 : 650), 0) / jobs.length);
  printEstimate(jobs.length, useBatch, avgOut);
  if (options.dryRun) {
    console.log(`Unchanged (skipped): ${totals.skipped}`);
    return;
  }
  if (jobs.length === 0) {
    console.log("Nothing to generate.");
    return;
  }
  if (!options.test && !options.yes) {
    const ok = await confirm("Run this batch? (y/N)");
    if (!ok) {
      console.log("Cancelled.");
      return;
    }
  }

  const claude = new ListingClaude();
  if (options.test) {
    for (const job of jobs) {
      try {
        let result = await generateOne(job, claude);
        totals.usage = addUsage(totals.usage, result.usage);
        addRunCost(result.usage, false);
        for (let attempt = 2; attempt <= 3 && result.record.needsReview; attempt += 1) {
          console.log(`Retry ${attempt}/3 ${job.listing.slug}`);
          result = await generateOne(job, claude);
          totals.usage = addUsage(totals.usage, result.usage);
          addRunCost(result.usage, false);
        }
        await putRecord(result.record);
        index = upsertIndex(index, result.record);
        totals.generated += 1;
        if (result.record.needsReview) totals.review += 1;
        printRecordSummary(result.record);
        console.log("\n--- full content ---\n");
        console.log(result.record.contentMarkdown);
      } catch (error) {
        totals.failed += 1;
        console.error(`✗ ${job.listing.slug}: ${error instanceof Error ? error.message : error}`);
      }
    }
    await putIndex(index);
    if (totals.review || totals.failed) process.exitCode = 1;
  } else {
    for (const group of chunk(jobs, MAX_BATCH_REQUESTS)) {
      const { id } = await claude.createBatch(
        group.map((job) => ({
          custom_id: job.listing.slug,
          user: jobUserMessage(job),
        })),
      );
      saveState({ id, jobs: group, phase: "main" });
      console.log(`Submitted batch ${id} (${group.length} listings). Polling every 60s...`);
      await claude.pollBatch(id);
      console.log("Downloading results...");
      const rows = await claude.downloadBatch(id);
      console.log(`Downloaded ${rows.length} results.`);
      addRunCost(
        rows.reduce((total, row) => addUsage(total, row.usage), emptyUsage()),
        true,
      );
      const bySlug = new Map(group.map((job) => [job.listing.slug, job]));
      const retryJobs: Array<{ job: ListingJob; failures: string[] }> = [];
      for (const row of rows) {
        const job = bySlug.get(row.custom_id);
        if (!job) continue;
        try {
          if (row.error || !row.text) throw new Error(row.error ?? "empty batch result");
          totals.usage = addUsage(totals.usage, row.usage);
          const processed = await processOutput(job, row.text, row.usage, null);
          if (!processed.record || processed.failures.length) {
            retryJobs.push({
              job,
              failures: processed.failures.length ? processed.failures : ["empty model output"],
            });
            continue;
          }
          await putRecord(processed.record);
          index = upsertIndex(index, processed.record);
          totals.generated += 1;
        } catch (error) {
          totals.failed += 1;
          console.error(`✗ ${row.custom_id}: ${error instanceof Error ? error.message : error}`);
        }
      }
      if (retryJobs.length) {
        console.log(`Retrying ${retryJobs.length} listing(s) as a second batch...`);
        const { id: retryId } = await claude.createBatch(
          retryJobs.map(({ job, failures }) => ({
            custom_id: job.listing.slug,
            user: `${jobUserMessage(job)}\n\n${revisionMessage(failures)}`,
          })),
        );
        saveState({
          id: retryId,
          jobs: retryJobs.map((item) => item.job),
          phase: "retry",
        });
        await claude.pollBatch(retryId);
        const retryRows = await claude.downloadBatch(retryId);
        addRunCost(
          retryRows.reduce((total, row) => addUsage(total, row.usage), emptyUsage()),
          true,
        );
        const retryBySlug = new Map(retryJobs.map((item) => [item.job.listing.slug, item.job]));
        for (const row of retryRows) {
          const job = retryBySlug.get(row.custom_id);
          if (!job) continue;
          try {
            if (row.error || !row.text) throw new Error(row.error ?? "empty batch result");
            const processed = await processOutput(job, row.text, row.usage, null);
            totals.usage = addUsage(totals.usage, row.usage);
            if (!processed.record) throw new Error(processed.failures.join("; ") || "empty model output");
            await putRecord(processed.record);
            index = upsertIndex(index, processed.record);
            totals.generated += 1;
            if (processed.record.needsReview) totals.review += 1;
          } catch (error) {
            totals.failed += 1;
            console.error(`✗ ${row.custom_id}: ${error instanceof Error ? error.message : error}`);
          }
        }
      }
    }
    await putIndex(index);
    clearState();
  }

  mkdirSync(join(PATHS.root, ".listing-content-cache"), { recursive: true });
  writeFileSync(
    join(PATHS.root, ".listing-content-cache", "batch-counts.json"),
    `${JSON.stringify(
      {
        rich: rich.rich,
        medium: rich.medium,
        thinSkipped: thin.length,
        generated: totals.generated,
        skippedUnchanged: totals.skipped,
        needsReview: totals.review,
        failed: totals.failed,
        runUsd: runCostUsd(),
        lifetimeUsd: lifetimeCostUsd(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(
    `\nDone. generated ${totals.generated}, skipped ${totals.skipped}, needs review ${totals.review}, failed ${totals.failed}. Tokens in ${totals.usage.inputTokens.toLocaleString("en-US")} / out ${totals.usage.outputTokens.toLocaleString("en-US")}. Actual cost ${formatMoney(estimateCostUsd(totals.usage, useBatch))} (this run ${formatMoney(runCostUsd())}, lifetime ${formatMoney(lifetimeCostUsd())})`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
