import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { config } from "dotenv";
import { PATHS } from "../article-gen/env";
import { putIndex, putRecord, r2WriteMode, readLocalRecords, readQuarantineRecords } from "./r2";
import type { IndexEntry, ListingContentRecord } from "./types";
import { runWrangler } from "./wrangler-cli";

config({ path: resolve(PATHS.root, ".env"), quiet: true });

function slugSql(slugs: string[]): string {
  return slugs
    .filter((slug) => /^[a-z0-9-]+$/.test(slug))
    .map((slug) => `'${slug}'`)
    .join(", ");
}

async function d1Json(args: string[]): Promise<unknown> {
  const { stdout } = await runWrangler(["d1", "execute", "tampa-bay-guide", ...args], {
    maxBuffer: 32 * 1024 * 1024,
  });
  const startArr = stdout.indexOf("[");
  const startObj = stdout.indexOf("{");
  const start = startArr === -1 ? startObj : startObj === -1 ? startArr : Math.min(startArr, startObj);
  if (start === -1) throw new Error("wrangler d1 execute returned no JSON");
  return JSON.parse(stdout.slice(start));
}

function countByStatus(payload: unknown): Record<string, number> {
  const counts: Record<string, number> = {};
  const walk = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      const first = value[0];
      if (first && typeof first === "object" && "status" in first) {
        for (const row of value as Array<{ status?: string; n?: number | string }>) {
          counts[String(row.status ?? "unknown")] = Number(row.n ?? 0);
        }
        return;
      }
      for (const item of value) walk(item);
      return;
    }
    walk((value as { results?: unknown }).results);
  };
  walk(payload);
  return counts;
}

async function main(): Promise<void> {
  const bySlug = new Map<string, ListingContentRecord>();
  for (const record of readLocalRecords()) bySlug.set(record.slug, record);
  for (const record of readQuarantineRecords()) {
    const current = bySlug.get(record.slug);
    if (!current || current.needsReview) bySlug.set(record.slug, current ?? record);
  }
  const flagged = [...bySlug.values()].filter((record) => record.needsReview && record.contentMarkdown?.trim());
  console.log(`Flagged for review: ${flagged.length}. R2 writes: ${r2WriteMode()}`);
  const published = flagged.map((record) => ({
    ...record,
    needsReview: false,
    reviewReasons: [],
  }));
  let written = 0;
  await Promise.all(
    published.map(async (record) => {
      await putRecord(record);
      written += 1;
      if (written === 1 || written % 25 === 0 || written === published.length) {
        console.log(`  wrote ${written}/${published.length}`);
      }
    }),
  );
  const indexPath = join(PATHS.root, ".listing-content-cache", "_index.json");
  const index = JSON.parse(readFileSync(indexPath, "utf8")) as IndexEntry[];
  const flaggedSlugs = new Set(published.map((record) => record.slug));
  const nextIndex = index.map((entry) =>
    flaggedSlugs.has(entry.slug) ? { ...entry, needsReview: false } : entry,
  );
  for (const record of published) {
    if (!nextIndex.some((entry) => entry.slug === record.slug)) {
      nextIndex.push({
        slug: record.slug,
        wordCount: record.wordCount,
        needsReview: false,
        inputHash: record.inputHash,
        generatedAt: record.generatedAt,
      });
    }
  }
  nextIndex.sort((a, b) => a.slug.localeCompare(b.slug));
  await putIndex(nextIndex);

  const slugs = published.map((record) => record.slug);
  for (let i = 0; i < slugs.length; i += 40) {
    const chunk = slugs.slice(i, i + 40);
    await d1Json([
      "--remote",
      "--json",
      "--command",
      `UPDATE places SET status = 'published' WHERE slug IN (${slugSql(chunk)})`,
    ]);
    console.log(`D1 published ${Math.min(i + 40, slugs.length)}/${slugs.length}`);
  }
  const counts = countByStatus(
    await d1Json(["--remote", "--json", "--command", "SELECT status, COUNT(*) AS n FROM places GROUP BY status"]),
  );
  const stillFlagged = nextIndex.filter((entry) => entry.needsReview).length;
  console.log(
    `DONE review_published=${published.length} index_needs_review=${stillFlagged} d1_published=${counts.published ?? 0} d1_draft=${counts.draft ?? 0}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
