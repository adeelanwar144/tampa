import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PATHS } from "../article-gen/env";
import { ListingClaude } from "./claude";
import { applyTinyFixes, failingChecks, parseModelJson, runChecks } from "./validate";
import type { ListingJob } from "./types";

type BatchState = { id: string; jobs: ListingJob[]; phase: "main" | "retry" };

async function main(): Promise<void> {
  const state = JSON.parse(
    readFileSync(join(PATHS.root, "scripts/listing-content/.batch-state.json"), "utf8"),
  ) as BatchState;
  const claude = new ListingClaude();
  const rows = await claude.downloadBatch(state.id);
  const bySlug = new Map(state.jobs.map((job) => [job.listing.slug, job]));
  const reasons = new Map<string, number>();
  let pass = 0;
  let fail = 0;
  let jsonFail = 0;
  const samples: string[] = [];
  for (const row of rows) {
    const job = bySlug.get(row.custom_id);
    if (!job) continue;
    if (row.error || !row.text) {
      jsonFail += 1;
      reasons.set("empty/error", (reasons.get("empty/error") ?? 0) + 1);
      continue;
    }
    const parsed = parseModelJson(row.text);
    if ("error" in parsed) {
      jsonFail += 1;
      reasons.set(`json: ${parsed.error}`, (reasons.get(`json: ${parsed.error}`) ?? 0) + 1);
      if (samples.length < 8) samples.push(`${row.custom_id} json: ${parsed.error}`);
      continue;
    }
    const output = applyTinyFixes(parsed, job.listing);
    const failures = failingChecks(
      runChecks(output, job.listing, job.primaryKeyword, `${job.compactJson}\n${job.listing.websiteText ?? ""}`, job.tier),
    );
    if (!failures.length) {
      pass += 1;
      continue;
    }
    fail += 1;
    for (const check of failures) {
      reasons.set(check.name, (reasons.get(check.name) ?? 0) + 1);
    }
    if (samples.length < 12) {
      samples.push(`${row.custom_id} [${job.tier}] ${failures.map((item) => `${item.name}: ${item.detail}`).join(" | ")}`);
    }
  }
  console.log(`rows ${rows.length} pass ${pass} fail ${fail} jsonFail ${jsonFail}`);
  console.log("Reasons:");
  for (const [name, count] of [...reasons.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count} ${name}`);
  }
  console.log("Samples:");
  for (const sample of samples) console.log(`  ${sample}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
